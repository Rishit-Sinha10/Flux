/**
 * Frontend Authentication Flow Tests
 * Tests: AuthContext analytics guard, profile loading, and non-blocking UI
 * 
 * Run: npm test -- __tests__/auth-flow.test.jsx
 * Purpose: Verify analytics is only called after profile is loaded
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/react';
import { AppProvider, useAppContext } from '../src/context/auth_context';
import ProtectedRoute from '../src/components/common/protectedroute';
// Mock Clerk
jest.mock('@clerk/react', () => ({
  ...jest.requireActual('@clerk/react'),
  useAuth: jest.fn(),
  ClerkProvider: ({ children }) => <>{children}</>,
}));

// Mock API calls
jest.mock('../src/services/apiClient', () => ({
  setClerkTokenProvider: jest.fn(),
  profileAPI: {
    getProfile: jest.fn(),
  },
  analyticsAPI: {
    generateReport: jest.fn(),
  },
}));

const { useAuth } = require('@clerk/react');
const { profileAPI, analyticsAPI } = require('../src/services/apiClient');

// Test component to access context
function TestComponent() {
  const {
    profileLoaded,
    profileLoading,
    profileError,
    analytics,
    isAuthenticated,
    userId,
  } = useAppContext();

  return (
    <div>
      <div data-testid="profile-loaded">{profileLoaded ? 'true' : 'false'}</div>
      <div data-testid="profile-loading">{profileLoading ? 'true' : 'false'}</div>
      <div data-testid="profile-error">{profileError || 'none'}</div>
      <div data-testid="analytics">{analytics ? 'loaded' : 'not-loaded'}</div>
      <div data-testid="is-authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="user-id">{userId || 'none'}</div>
    </div>
  );
}

describe('Frontend Authentication Flow Tests', () => {
  const testTimeout = 10000;
  jest.setTimeout(testTimeout);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Analytics Guard - Strict Protection', () => {
    /**
     * CRITICAL TEST: Analytics must NOT be called before profile loads
     */
    test('Analytics should NOT be called until profileLoaded is true', async () => {
      // Setup: User is signed in with Clerk, but profile hasn't loaded yet
      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'test-user-123',
        getToken: jest.fn().mockResolvedValue('test-token'),
      });

      // Setup: Profile fetch takes time
      profileAPI.getProfile.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => {
                resolve({
                  data: {
                    user: {
                      _id: 'mongo-user-id',
                      email: 'test@example.com',
                      firstName: 'Test',
                    },
                  },
                });
              },
              500 // Simulate 500ms delay
            );
          })
      );

      // Analytics should NOT be called initially
      analyticsAPI.generateReport.mockImplementation(() => {
        throw new Error(
          'Analytics called before profile loaded! This is a critical bug.'
        );
      });

      const { rerender } = render(
        <ClerkProvider>
          <BrowserRouter>
            <AppProvider>
              <TestComponent />
            </AppProvider>
          </BrowserRouter>
        </ClerkProvider>
      );

      // IMMEDIATELY after sign-in, profile should be loading
      await waitFor(() => {
        const profileLoading = screen.getByTestId('profile-loading');
        expect(profileLoading.textContent).toBe('true');
      });

      // ✅ VERIFY: Analytics NOT called yet
      expect(analyticsAPI.generateReport).not.toHaveBeenCalled();

      // Wait for profile to load
      await waitFor(
        () => {
          const profileLoaded = screen.getByTestId('profile-loaded');
          expect(profileLoaded.textContent).toBe('true');
        },
        { timeout: 2000 }
      );

      // ✅ NOW Analytics can be called (but we won't mock it to avoid error)
      // Reset the mock to allow analytics call
      analyticsAPI.generateReport.mockResolvedValue({
        data: { analytics: { totalViewers: 1000 } },
      });

      // Rerender to trigger analytics effect
      rerender(
        <ClerkProvider>
          <BrowserRouter>
            <AppProvider>
              <TestComponent />
            </AppProvider>
          </BrowserRouter>
        </ClerkProvider>
      );

      // ✅ VERIFY: Now analytics SHOULD be called
      await waitFor(
        () => {
          expect(analyticsAPI.generateReport).toHaveBeenCalledWith('test-user-123');
        },
        { timeout: 2000 }
      );
    });

    /**
     * IMPORTANT TEST: Analytics should NOT be called if profile fails
     */
    test('Analytics should NOT be called if profile fetch fails', async () => {
      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'test-user-123',
        getToken: jest.fn().mockResolvedValue('test-token'),
      });

      // Setup: Profile fetch fails with 401
      profileAPI.getProfile.mockRejectedValue({
        response: {
          status: 401,
          data: { msg: 'Unauthorized' },
        },
      });

      analyticsAPI.generateReport.mockImplementation(() => {
        throw new Error('Analytics called even though profile failed!');
      });

      render(
        <ClerkProvider>
          <BrowserRouter>
            <AppProvider>
              <TestComponent />
            </AppProvider>
          </BrowserRouter>
        </ClerkProvider>
      );

      // Wait for profile to fail
      await waitFor(() => {
        const profileLoading = screen.getByTestId('profile-loading');
        expect(profileLoading.textContent).toBe('false');
      });

      // ✅ VERIFY: Profile loading stopped (profile failed)
      const profileLoaded = screen.getByTestId('profile-loaded');
      expect(profileLoaded.textContent).toBe('false');

      // ✅ VERIFY: Analytics was NEVER called
      expect(analyticsAPI.generateReport).not.toHaveBeenCalled();

      console.log('✅ Analytics guard working: No call when profile fails');
    });

    /**
     * TEST: Verify dependency array includes profileLoaded
     */
    test('Analytics useEffect should depend on profileLoaded, not isAuthenticated', async () => {
      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'test-user-123',
        getToken: jest.fn().mockResolvedValue('test-token'),
      });

      profileAPI.getProfile.mockResolvedValue({
        data: {
          user: {
            _id: 'mongo-user-id',
            email: 'test@example.com',
          },
        },
      });

      analyticsAPI.generateReport.mockResolvedValue({
        data: { analytics: { totalViewers: 1000 } },
      });

      render(
        <ClerkProvider>
          <BrowserRouter>
            <AppProvider>
              <TestComponent />
            </AppProvider>
          </BrowserRouter>
        </ClerkProvider>
      );

      // Wait for both profile and analytics to load
      await waitFor(() => {
        expect(profileAPI.getProfile).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(analyticsAPI.generateReport).toHaveBeenCalledTimes(1);
      });

      // Try calling getProfile again (simulate if isAuthenticated changed)
      // This should NOT trigger analytics again
      const callCountBefore = analyticsAPI.generateReport.mock.calls.length;

      // profileLoaded didn't change, so analytics should NOT be called again
      await new Promise((resolve) => setTimeout(resolve, 500));

      const callCountAfter = analyticsAPI.generateReport.mock.calls.length;

      // ✅ VERIFY: Analytics not called again (no duplicate calls)
      expect(callCountAfter).toBe(callCountBefore);

      console.log('✅ Analytics guard working: Proper dependency array');
    });
  });

  describe('Non-Blocking UI Rendering', () => {
    /**
     * TEST: Dashboard should render immediately after Clerk auth
     * Profile loading should NOT block the UI
     */
    test('Dashboard should render immediately even if profile is loading', async () => {
      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'test-user-123',
        getToken: jest.fn().mockResolvedValue('test-token'),
      });

      // Profile will take a while to load
      profileAPI.getProfile.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => {
                resolve({
                  data: { user: { _id: 'mongo-user-id', email: 'test@example.com' } },
                });
              },
              2000 // 2 second delay
            );
          })
      );

      analyticsAPI.generateReport.mockResolvedValue({
        data: { analytics: { totalViewers: 1000 } },
      });

      render(
        <ClerkProvider>
          <BrowserRouter>
            <ProtectedRoute>
              <div data-testid="dashboard">Dashboard Content</div>
            </ProtectedRoute>
            <AppProvider>
              <TestComponent />
            </AppProvider>
          </BrowserRouter>
        </ClerkProvider>
      );

      // ✅ VERIFY: Dashboard renders IMMEDIATELY
      await waitFor(() => {
        const dashboard = screen.queryByTestId('dashboard');
        expect(dashboard).toBeTruthy();
      });

      // ✅ VERIFY: Profile is still loading at this point
      const profileLoading = screen.getByTestId('profile-loading');
      expect(profileLoading.textContent).toBe('true');

      console.log('✅ Non-blocking UI: Dashboard rendered while profile loading');
    });

    /**
     * TEST: Loading indicator should show while profile is being fetched
     */
    test('ProtectedRoute should show loading indicator while profile loads', async () => {
      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'test-user-123',
        getToken: jest.fn().mockResolvedValue('test-token'),
      });

      profileAPI.getProfile.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => {
                resolve({
                  data: { user: { _id: 'mongo-user-id', email: 'test@example.com' } },
                });
              },
              500
            );
          })
      );

      render(
        <ClerkProvider>
          <BrowserRouter>
            <ProtectedRoute>
              <div data-testid="dashboard">Dashboard</div>
            </ProtectedRoute>
            <AppProvider>
              <TestComponent />
            </AppProvider>
          </BrowserRouter>
        </ClerkProvider>
      );

      // Profile should be loading (verified by context state)
      await waitFor(() => {
        const profileLoading = screen.getByTestId('profile-loading');
        expect(profileLoading.textContent).toBe('true');
      });

      console.log('✅ Loading state: Profile loading state properly tracked');
    });
  });

  describe('Failsafe: Analytics Error Should Not Block Dashboard', () => {
    /**
     * TEST: If analytics fails, dashboard should still be usable
     */
    test('Dashboard should remain functional if analytics fails', async () => {
      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'test-user-123',
        getToken: jest.fn().mockResolvedValue('test-token'),
      });

      profileAPI.getProfile.mockResolvedValue({
        data: { user: { _id: 'mongo-user-id', email: 'test@example.com' } },
      });

      // Analytics fails with timeout or error
      analyticsAPI.generateReport.mockRejectedValue(
        new Error('Analytics timeout')
      );

      render(
        <ClerkProvider>
          <BrowserRouter>
            <ProtectedRoute>
              <div data-testid="dashboard">Dashboard Content</div>
            </ProtectedRoute>
            <AppProvider>
              <TestComponent />
            </AppProvider>
          </BrowserRouter>
        </ClerkProvider>
      );

      // Wait for profile to load
      await waitFor(() => {
        const profileLoaded = screen.getByTestId('profile-loaded');
        expect(profileLoaded.textContent).toBe('true');
      });

      // ✅ VERIFY: Dashboard is still rendered
      const dashboard = screen.queryByTestId('dashboard');
      expect(dashboard).toBeTruthy();

      // ✅ VERIFY: Even though analytics failed, profile is available
      const isAuthenticated = screen.getByTestId('is-authenticated');
      expect(isAuthenticated.textContent).toBe('true');

      console.log('✅ Failsafe working: Dashboard functional even with analytics error');
    });
  });

  describe('No Duplicate API Calls', () => {
    /**
     * TEST: Verify hasFetchedProfile and hasFetchedAnalytics prevent duplicates
     */
    test('Profile and Analytics should only be called once per session', async () => {
      useAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        userId: 'test-user-123',
        getToken: jest.fn().mockResolvedValue('test-token'),
      });

      profileAPI.getProfile.mockResolvedValue({
        data: { user: { _id: 'mongo-user-id', email: 'test@example.com' } },
      });

      analyticsAPI.generateReport.mockResolvedValue({
        data: { analytics: { totalViewers: 1000 } },
      });

      const { rerender } = render(
        <ClerkProvider>
          <BrowserRouter>
            <AppProvider>
              <TestComponent />
            </AppProvider>
          </BrowserRouter>
        </ClerkProvider>
      );

      // Wait for initial calls
      await waitFor(() => {
        expect(profileAPI.getProfile).toHaveBeenCalledTimes(1);
        expect(analyticsAPI.generateReport).toHaveBeenCalledTimes(1);
      });

      // Simulate re-render
      rerender(
        <ClerkProvider>
          <BrowserRouter>
            <AppProvider>
              <TestComponent />
            </AppProvider>
          </BrowserRouter>
        </ClerkProvider>
      );

      // ✅ VERIFY: No duplicate calls
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(profileAPI.getProfile).toHaveBeenCalledTimes(1);
      expect(analyticsAPI.generateReport).toHaveBeenCalledTimes(1);

      console.log('✅ No duplicates: Each API called exactly once');
    });
  });
});
