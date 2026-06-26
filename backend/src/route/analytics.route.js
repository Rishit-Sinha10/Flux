import express from "express";
import {
  createAnalytics,
  getStreamAnalytics,
  getUserAnalytics,
  getAnalyticsByDateRange,
  generateAnalyticsReport,
  updateEngagementMetrics,
} from "../controller/analytics.controller.js";
import { requireAuth } from "../middleware/require-Auth.js";
import User from "../models/User.models.js";
import Analytics from "../models/Analytics.models.js";
const router = express.Router();
/**
 * Analytics API Routes
 * Base URL: /api/v1/analytics
 */

// ==================== DEBUG ROUTES ====================
/**
 * DEBUG: Test analytics endpoint connectivity
 * GET /api/v1/analytics/debug
 * No authentication required
 */
router.get("/debug", async (req, res) => {
  try {
    console.log(
      "🔍 [analytics-debug] Testing analytics endpoint connectivity...",
    );
    // Test 1: MongoDB connection
    const mongoConnected = global.mongoConnected;
    console.log(`  ✓ MongoDB connected: ${mongoConnected}`);
    // Test 2: Can we query Users?
    const userCount = await User.countDocuments().maxTimeMS(5000);
    console.log(`  ✓ User count: ${userCount}`);
    // Test 3: Can we query Analytics?
    const analyticsCount = await Analytics.countDocuments().maxTimeMS(5000);
    console.log(`  ✓ Analytics count: ${analyticsCount}`);
    // Test 4: Check auth context
    const hasAuth = !!req.auth;
    const userId = req.auth?.userId;
    console.log(`  ✓ Auth provided: ${hasAuth}, userId: ${userId}`);
    return res.status(200).json({
      success: true,
      message: "Analytics endpoint is healthy",
      diagnostics: {
        mongodb_connected: mongoConnected,
        user_count: userCount,
        analytics_count: analyticsCount,
        auth_context: {
          has_auth: hasAuth,
          user_id: userId,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [analytics-debug] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Analytics debug failed",
      error: error.message,
      diagnostics: {
        mongodb_connected: global.mongoConnected,
        timestamp: new Date().toISOString(),
      },
    });
  }
});
/**
 * DEBUG: Check token and auth headers
 * GET /api/v1/analytics/debug/auth
 * Shows exactly what auth headers are received
 */
router.get("/debug/auth", async (req, res) => {
  const authHeader = req.headers.authorization;
  const hasClerkAuth = !!req.auth;
  const clerkUserId = req.auth?.userId;
  console.log("🔍 [analytics-auth-debug] Checking auth headers...");
  console.log(`  Authorization header present: ${!!authHeader}`);
  console.log(
    `  Authorization header value: ${authHeader ? authHeader.substring(0, 50) + "..." : "NONE"}`,
  );
  console.log(`  Clerk middleware parsed auth: ${hasClerkAuth}`);
  console.log(`  Clerk userId: ${clerkUserId}`);
  return res.status(200).json({
    success: true,
    message: "Auth diagnostics",
    diagnostics: {
      authHeaderPresent: !!authHeader,
      authHeaderPrefix: authHeader ? authHeader.substring(0, 20) : null,
      clerkAuthPresent: hasClerkAuth,
      clerkUserId: clerkUserId,
      clerkEmail: req.auth?.email || null,
      allHeaders: Object.keys(req.headers),
      timestamp: new Date().toISOString(),
    },
  });
});

// ==================== PUBLIC ROUTES ====================
// Get stream analytics (public view)
router.get("/stream/:streamId", getStreamAnalytics);
// ==================== PROTECTED ROUTES (Clerk Auth) ====================
// Create or update analytics
router.post("/create", requireAuth, createAnalytics);
// Get user analytics (all streams)
router.get("/profile/:userId", requireAuth, getUserAnalytics);
// Get analytics by date range
router.get("/range", requireAuth, getAnalyticsByDateRange);
// Generate comprehensive report
router.get("/report/:userId", requireAuth, generateAnalyticsReport);
// Update engagement metrics
router.put("/engagement/:streamId", requireAuth, updateEngagementMetrics);
export default router;
