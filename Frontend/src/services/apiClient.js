import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL;
// ─── Configuration ────────────────────────────────────────────────────────────
const TIMEOUT_CONFIG = {
  initial: 4000, // Increase from 15s to 30s
  max: 6000,
};
// ─── Token Provider ───────────────────────────────────────────────────────────
// Clerk tokens cannot be stored in localStorage — they are short-lived JWTs
// that must be fetched fresh from Clerk on each request.
//
// Call `setClerkTokenProvider(getToken)` once inside your app (e.g., in a
// top-level component or context) where `getToken` is the function returned
// by Clerk's `useAuth()` hook.
//
//   import { useAuth } from "@clerk/clerk-react";
//   const { getToken } = useAuth();
//   setClerkTokenProvider(getToken);

let _getClerkToken = null;
let _cachedToken = null;
let _tokenFetchPromise = null;
export const setClerkTokenProvider = (fn) => {
  _getClerkToken = fn;
};
/**
 * Get Clerk token with smart caching
 * Reduces repeated getToken() calls which can take 1-3 seconds each
 *
 * Reuses token if:
 * - Already in cache AND
 * - Expires in >30 seconds (safe margin)
 *
 * Deduplicates in-flight requests:
 * - If getToken() is already being called, wait for that promise
 * - Don't spawn multiple concurrent token fetches
 */
const getClerkTokenWithCache = async () => {
  // Try to reuse cached token
  if (_cachedToken) {
    try {
      const [, payload] = _cachedToken.split(".");
      const decoded = JSON.parse(atob(payload));

      // If token expires in >30 seconds, reuse it
      const expiresIn = decoded.exp * 1000 - Date.now();
      if (expiresIn > 30000) {
        console.log(
          `[apiClient] ♻️  Reusing cached token (expires in ${Math.round(expiresIn / 1000)}s)`,
        );
        return _cachedToken;
      }
    } catch (err) {
      console.warn("[apiClient] ⚠️  Cached token invalid, fetching new one");
      _cachedToken = null;
    }
  }

  // If token fetch is already in progress, wait for it instead of fetching again
  if (_tokenFetchPromise) {
    console.log("[apiClient] ⏳ Token fetch in progress, waiting...");
    return _tokenFetchPromise;
  }

  // Fetch new token and cache the promise to deduplicate concurrent requests
  _tokenFetchPromise = (async () => {
    try {
      console.log("[apiClient] 🔑 Fetching fresh Clerk token...");
      const token = await _getClerkToken();
      _cachedToken = token;
      console.log("[apiClient] ✅ Token fetched and cached");
      return token;
    } catch (err) {
      console.error("[apiClient] ❌ Failed to fetch token:", err.message);
      throw err;
    } finally {
      // Clear promise to allow next fetch
      _tokenFetchPromise = null;
    }
  })();

  return _tokenFetchPromise;
};
// ─── Axios instance ───────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT_CONFIG.initial,
});
// ─── Request interceptor — attach Clerk token ─────────────────────────────────
apiClient.interceptors.request.use(
  async (config) => {
    try {
      if (typeof _getClerkToken === "function") {
        // Use cached token to avoid slow getToken() calls (1-3 seconds)
        try {
          const token = await getClerkTokenWithCache();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(
              `[apiClient] ✅ Token attached (${token.substring(0, 20)}...) to ${config.method?.toUpperCase()} ${config.url}`,
            );
          } else {
            console.error(
              `[apiClient] ⚠️  getToken() returned null/empty for ${config.method?.toUpperCase()} ${config.url}`,
            );
            console.error("[apiClient] Troubleshooting:");
            console.error("  1. User may not be signed in to Clerk");
            console.error("  2. Clerk session may have expired");
            console.error(
              "  3. Check browser console for Clerk initialization errors",
            );
          }
        } catch (tokenErr) {
          console.error("[apiClient] ❌ Token fetch error:", tokenErr.message);
          console.error("   Continuing without token (will likely get 401)");
        }
      } else {
        console.warn(
          "[apiClient] ⚠️  Clerk token provider NOT yet set. " +
            "Tokens will be attached after Clerk initializes.",
        );
      }
    } catch (err) {
      console.error(
        "[apiClient] ❌ Unexpected error in request interceptor:",
        err.message,
      );
    }
    return config;
  },
  (error) => Promise.reject(error),
);
// ─── Response interceptor — handle errors, timeouts, and diagnostics ────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.code;
    const message = error.message;
    const url = error.config?.url;
    const method = error.config?.method?.toUpperCase();

    // ===== TIMEOUT ERROR =====
    if (code === "ECONNABORTED" || message?.includes("")) {
      const timing = `${TIMEOUT_CONFIG.max}ms - ${TIMEOUT_CONFIG.initial}ms`;
      console.error(`[apiClient] ⏱️  TIMEOUT (${timing}) for ${method} ${url}`);
      console.error("[apiClient] Troubleshooting:");
      console.error("  1. Is backend server running? (npm run dev)");
      console.error("  2. Is MongoDB running? (mongod)");
      console.error("  3. Check backend console for errors");
      console.error(
        "  4. The frontend will automatically retry (up to 3 times)",
      );
      console.error(
        "  5. Try accessing http://localhost:5000/api/auth/debug/setup",
      );
      console.error("  6. Network tab → find request → see response");
      return Promise.reject({
        ...error,
        userMessage:
          "Request timed out. Backend is slow or not responding. Retrying...",
        isTimeout: true,
      });
    }
    // ===== 401 UNAUTHORIZED =====
    if (status === 401) {
      if (!error.config._isRetry) {
        console.warn(
          "[apiClient] 🔐 401 Unauthorized — token invalid or expired",
        );
        console.error("[apiClient] Next steps:");
        console.error("  1. User may need to sign in again");
        console.error("  2. Check Clerk configuration");
        console.error("  3. Verify VITE_CLERK_PUBLISHABLE_KEY in .env.local");
        error.config._isRetry = true;
      }
    }

    // ===== 403 FORBIDDEN =====
    if (status === 403) {
      console.warn("[apiClient] 🚫 403 Forbidden — insufficient permissions.");
    }

    // ===== 503 SERVICE UNAVAILABLE =====
    if (status === 503) {
      console.error("[apiClient] 📡 503 Service Unavailable");
      console.error("   Backend error:", error.response?.data?.msg);
      console.error("[apiClient] Troubleshooting:");
      console.error("  1. Is MongoDB connected? Check backend console");
      console.error("  2. Restart backend: npm run dev");
    }

    // ===== 5XX SERVER ERROR =====
    if (status >= 500) {
      console.error(
        `[apiClient] 🔥 ${status} Server Error for ${method} ${url}`,
      );
      console.error("   Backend error:", error.response?.data?.error);
      console.error("[apiClient] Check backend logs for details");
    }

    // ===== NETWORK ERROR (no response) =====
    if (!error.response) {
      console.error(`[apiClient] ❌ No response from server (network error)`);
      console.error(`   ${method} ${url}`);
      console.error("   Possible causes:");
      console.error("   1. Backend is not running");
      console.error("   2. Wrong API URL in .env (VITE_API_URL)");
      console.error("   3. CORS is blocking the request");
      console.error("   4. Network connectivity issue");
    }

    return Promise.reject(error);
  },
);
// ─── API helpers ──────────────────────────────────────────────────────────────
// Profile API - with automatic retry on timeout
// ✅ FIXED: Backend route is /api/v1/auth/profile (no userId param - extracted from Clerk token)
export const profileAPI = {
  getProfile: (data) => apiClient.get(`/auth/profile`),
  updateProfile: (data) => apiClient.put(`/auth/profile`, data),
};
// Settings API
// ✅ FIXED: Backend route is /api/v1/auth/settings (no userId param - extracted from Clerk token)
export const settingsAPI = {
  getSettings: (data) => apiClient.get(`/auth/settings`),
  updateSettings: (data) => apiClient.put(`/auth/settings`, data),
};
// Analytics API - with automatic retry on timeout
// ✅ FIXED: Backend routes under /api/v1/analytics
export const analyticsAPI = {
  // Get aggregate analytics for user (all streams)
  getAnalytics: (userId, range = "7days") =>
    apiClient.get(`/analytics/profile/${userId}`, {
      params: { range },
    }),
  // Get stream-specific analytics
  getStreamAnalytics: (streamId) =>
    apiClient.get(`/analytics/stream/${streamId}`),
  // Get detailed user analytics with stats
  getUserAnalytics: (userId) => 
    apiClient.get(`/analytics/profile/${userId}`),
  // Get analytics by date range
  getAnalyticsByDateRange: (userId, startDate, endDate) =>
    apiClient.get(`/analytics/range`, {
      params: { userId, startDate, endDate },
    }),
  // Generate comprehensive report for user
  generateReport: (userId) => 
    apiClient.get(`/analytics/report/${userId}`),
  // Update engagement metrics for stream
  updateEngagementMetrics: (streamId, data) =>
    apiClient.put(`/analytics/engagement/${streamId}`, data),
};
// Payment API
// ✅ FIXED: Backend routes under /api/v1/payment
export const paymentAPI = {
  createPayment: (data) => apiClient.post(`/payment/create`, data),
  getPaymentHistory: (userId)=> apiClient.get(`/payment/history/${userId}`),
  verifyPayment: (transactionId) => apiClient.get(`/payment/verify/${transactionId}`),
  getPaymentStats: (userId) => apiClient.get(`/payment/stats/${userId}`),
  updatePaymentStatus: (transactionId, status) =>
    apiClient.put(`/payment/status/${transactionId}`, {
      paymentStatus: status,
    }),
  deletePayment: (transactionId) => apiClient.delete(`/payment/${transactionId}`),
};
// User API (alternative to profileAPI)
export const userAPI = {
  getUserProfile: () => apiClient.get(`/auth/profile`),
  getUserSettings: () => apiClient.get(`/auth/settings`),
};
// Follow API
export const Follow = {
  checkFollow: (targetUserId) => 
   apiClient.get(`/follower/check`, {
      params: { targetUserId },
    }),
  follow: (userId) => apiClient.post(`/follower/follow/${userId}`),
  unfollow: (userId) => apiClient.delete(`/follower/unfollow/${userId}`),
  getFollowers: (userId) => 
    apiClient.get(`/follower/${userId}/followers`),
  getFollowing: (userId) => 
    apiClient.get(`/follower/${userId}/following`),
};
export default apiClient;
