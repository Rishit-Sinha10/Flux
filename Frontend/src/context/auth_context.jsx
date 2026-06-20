import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/react";
import { setClerkTokenProvider } from "../services/apiClient";
import { profileAPI, analyticsAPI } from "../services/apiClient";
import { useAsyncError } from "../components/common/asyncerrorhandler";
const AppContext = createContext();
export const AppProvider = ({ children }) => {
  const { getToken, isSignedIn, userId } = useAuth();
  const { reportError: reportAsyncError } = useAsyncError();
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  // 📊 SEPARATED STATES: Profile is loaded independently (non-blocking)
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  // 🔄 Legacy states (for analytics and other data, kept for backward compat)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 🔑 NEW: isAuthenticated now means "Clerk auth is valid"
  // Previously meant "profile is loaded", but that was causing blocking
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Track if we've attempted to fetch (prevents double-fetch)
  const hasFetchedProfile = useRef(false);
  const hasFetchedAnalytics = useRef(false);

  // 🔑 Set Clerk token provider once
  useEffect(() => {
    if (getToken) {
      setClerkTokenProvider(getToken);
    }
  }, [getToken]);

  // 🚀 Fetch Profile - WRAPPED IN useCallback
  // ✅ Auto-fetches on first authentication, handles both new and existing users
  // ✅ Does NOT block authentication — runs in background
  // ✅ CRITICAL: userId is in dependencies to avoid stale closure
  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      setProfileError(null);
      console.log(`📡 [auth_context] Fetching profile for userId: ${userId}`);
      const res = await profileAPI.getProfile(userId);
      // Backend returns { success: true, user: {...} } or { success: true, msg: "...", user: {...} }
      const userData = res.data?.user || res.data;
      setUser(userData);
      setProfileLoaded(true); // ✅ Profile loaded successfully
      setIsAuthenticated(true); // ✅ For backward compat, mark as authenticated
      console.log("✅ [auth_context] Profile fetched successfully — user profile now available");
    } catch (err) {
      const status = err.response?.status;
      const errorMsg = err.response?.data?.msg || err.response?.data?.message || err.message || "Failed to fetch profile";
      const debugInfo = err.response?.data?.debug;
      console.error(`❌ [auth_context] Profile fetch failed (${status}):`, errorMsg);      
      if (debugInfo) {
        console.error("[auth_context] Debug info from backend:", debugInfo);
        console.error("[auth_context] Backend req.auth object was:", debugInfo.authObject);
      }
      
      // Handle 401 explicitly
      if (status === 401) {
        console.error("[auth_context] ❌ 401 Unauthorized — Backend couldn't validate Clerk token");
        console.error("[auth_context] Troubleshooting:");
        console.error("  ✓ Check frontend .env.local has VITE_CLERK_PUBLISHABLE_KEY");
        console.error("  ✓ Check backend .env has CLERK_SECRET_KEY");
        console.error("  ✓ Ensure they match (same Clerk instance)");
        console.error("  ✓ Verify token is being attached (check Network tab)");
        setProfileError("Authentication failed. Check Clerk configuration.");
      } else if (status === 503 || err.message?.includes("timeout")) {
        setProfileError("Server is slow or unreachable. Will retry automatically.");
      } else {
        setProfileError(errorMsg);
      }
      
      setProfileLoaded(false); // ❌ Profile fetch failed
      setIsAuthenticated(false); // Not authenticated if profile fails
      
    } finally {
      setProfileLoading(false);
    }
  }, [userId, isSignedIn]); // ✅ FIXED: Added userId and isSignedIn to dependencies

  // 📊 Fetch Analytics - WRAPPED IN useCallback
  // ✅ Only fetches after profile is available and userId is known
  const fetchAnalytics = useCallback(async () => {
    // Only fetch if userId is available from Clerk
    if (!userId) {
      console.warn("[auth_context] Skipping analytics - userId not available yet");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log("📡 Fetching analytics for user:", userId);
      const res = await analyticsAPI.generateReport(userId);
      
      // Backend may return various formats, handle gracefully
      const analyticsData = res.data?.analytics || res.data?.data || res.data;
      setAnalytics(analyticsData);
      console.log("✅ Analytics fetched successfully");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch analytics";
      console.error("❌ Analytics error:", errorMsg);
      setError(errorMsg);
      
      // Report error to async error handler
      if (reportAsyncError) {
        reportAsyncError({
          message: errorMsg,
          code: err.response?.status === 404 ? 'NO_ANALYTICS' : 'ANALYTICS_FETCH_ERROR',
          originalError: err,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [userId]); // ✅ Only userId as dependency

  // 🔄 Auto fetch when user logs in
  // Use refs to ensure we only fetch ONCE per authentication
  useEffect(() => {
    console.log(`[auth_context] useEffect triggered — isSignedIn=${isSignedIn}, userId=${userId}`);
    
    if (isSignedIn && userId) {
      // Fetch profile only once when user first signs in
      if (!hasFetchedProfile.current) {
        hasFetchedProfile.current = true;
        console.log("🔄 [auth_context] User authenticated, starting profile fetch...");
        fetchProfile();
      }
    } else if (!isSignedIn) {
      // Reset when user signs out
      console.log("[auth_context] User signed out, resetting state...");
      hasFetchedProfile.current = false;
      hasFetchedAnalytics.current = false;
      setUser(null);
      setAnalytics(null);
      setError(null);
      setIsAuthenticated(false);
    }
  }, [isSignedIn, userId, fetchProfile]); // ✅ FIXED: Removed isAuthenticated from deps

  // 🔄 Auto fetch analytics ONLY after profile succeeds
  // ✅ STRICT GUARD: Analytics only fetches if:
  //    1. profileLoaded === true (profile successfully fetched)
  //    2. userId is available (from Clerk)
  //    3. No previous fetch attempt (hasFetchedAnalytics.current)
  useEffect(() => {
    console.log(`[auth_context] Analytics guard check:`);
    console.log(`  - profileLoaded: ${profileLoaded}`);
    console.log(`  - userId: ${userId}`);
    console.log(`  - hasFetchedAnalytics: ${hasFetchedAnalytics.current}`);
    
    // ✅ CRITICAL: Only fetch if profile is CONFIRMED loaded
    if (profileLoaded === true && userId && !hasFetchedAnalytics.current) {
      hasFetchedAnalytics.current = true;
      console.log("✅ [auth_context] Profile verified, NOW fetching analytics...");
      fetchAnalytics();
    } else if (profileLoaded === false) {
      console.warn("[auth_context] Blocking analytics fetch - profile not loaded yet");
    }
  }, [profileLoaded, userId]); // ✅ CRITICAL: profileLoaded in deps (NOT isAuthenticated)

  // 🔄 Allow manual retry of profile fetch on timeout
  const retryProfileFetch = useCallback(() => {
    console.log("🔄 [auth_context] User manually retrying profile fetch...");
    hasFetchedProfile.current = false; // Allow refetch
    setProfileError(null);
    setProfileLoading(false);
    fetchProfile();
  }, [fetchProfile]);

  return (
    <AppContext.Provider
      value={{
        // 🔑 Clerk state (primary auth source)
        isSignedIn,  // ✅ From Clerk useAuth()
        userId,      // ✅ From Clerk useAuth()
        
        // 👤 User profile data
        user,
        analytics,
        
        // 📊 PROFILE-SPECIFIC STATES (non-blocking, background loading)
        profileLoaded,    // ✅ True when profile has been fetched
        profileLoading,   // ⏳ True while fetching
        profileError,     // ❌ Error message if fetch failed
        
        // 🔄 Legacy states (for analytics and other data)
        loading,
        error,
        
        // ✅ DEPRECATED: isAuthenticated now just means profileLoaded
        // Use profileLoaded directly instead
        isAuthenticated: profileLoaded,
        
        // 🔧 Methods
        fetchProfile,
        fetchAnalytics,
        retryProfileFetch,  // ✅ Manual retry for error handling
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
// Custom hook
export const useAppContext = () => useContext(AppContext);