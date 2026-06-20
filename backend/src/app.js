import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./route/user.route.js";
import streamRoutes from "./route/stream.route.js";
import profileRoutes from "./route/profile.route.js";
import paymentRoutes from "./route/payment.route.js";
import analyticsRoutes from "./route/analytics.route.js";
import FolllowerRoutes from "./route/follower.route.js";
import cors from "cors";
import social from "./route/Social.controller.js";
import geminiRoutes from "./route/gemini.route.js";
import { clerkMiddleware } from "@clerk/express";
import {
  requestLogger,
  checkDBConnection,
} from "./middleware/request-logger.js";
import { requestTimeoutGuard } from "./utils/request-timeout-guard.js";
import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 min
  message: "Too many requests, please try again later",
});
const app = express();
// ✅ CORS middleware — must be first
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:5173"];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
// ✅ Body parser middleware
app.use(express.json());
// ✅ NEW: Request timing & duration logger
app.use(requestLogger);
// ✅ NEW: Prevent requests from hanging indefinitely (30 second timeout)
app.use(requestTimeoutGuard(30000));
// ✅ Clerk authentication middleware (MUST be before routes)
app.use(clerkMiddleware());
// ✅ NEW: Check if MongoDB is connected before processing API calls
app.use(checkDBConnection);
// ==================== ROUTES ====================
app.use("/api/v1/auth", limiter, authRoutes);
app.use("/api/v1/streams", limiter, streamRoutes);
app.use("/api/v1/profile", limiter, profileRoutes);
app.use("/api/v1/gemini", limiter, geminiRoutes);
app.use("/api/v1/payment", limiter, paymentRoutes);
app.use("/api/v1/analytics", limiter, analyticsRoutes);
app.use("/api/v1/follower", limiter, FolllowerRoutes);
app.use("/api/v1/social", limiter, social);
// ==================== DIAGNOSTIC ENDPOINTS ====================
/**
 * DEBUG: Check Clerk token validation
 * Access at: http://localhost:5000/api/auth/debug/setup
 */
/**
 * DEBUG: Test token validation
 * Access at: http://localhost:5000/api/auth/debug/me
 * Requires: Authorization: Bearer <token>
 */
app.get("/api/auth/debug/setup", (req, res) => {
  res.json({
    success: true,
    debug: {
      tokenReceived: !!req.headers.authorization,
      tokenValidated: !!req.auth,
      clerkUserId: req.auth?.userId || null,
      clerkEmail: req.auth?.email || null,
      fullAuth: req.auth || null,
      message: req.auth?.userId
        ? "✅ Token validated by Clerk"
        : "❌ Token not validated. Check CLERK_SECRET_KEY in backend .env",
    },
  });
});

/**
 * HEALTH CHECK: Quick status without authentication
 * Access at: http://localhost:5000/api/health
 * Used by frontend to verify backend is alive before making auth calls
 */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    mongodb: global.mongoConnected ? "connected" : "disconnected",
    message: global.mongoConnected
      ? "✅ Backend and database are ready"
      : "⚠️  Backend running but MongoDB not connected",
  });
});

/**
 * DEBUG: Test profile endpoint connectivity
 * Access at: http://localhost:5000/api/v1/profile/debug
 * No authentication required - tests if MongoDB and route handler work
 */
app.get("/api/v1/profile/debug", async (req, res) => {
  try {
    console.log("🔍 [profile-debug] Testing profile endpoint connectivity...");

    // Test 1: MongoDB connection
    const mongoConnected = global.mongoConnected;
    console.log(`  ✓ MongoDB connected: ${mongoConnected}`);

    if (!mongoConnected) {
      return res.status(503).json({
        success: false,
        error: "MongoDB not connected",
        debug: "Backend running but cannot reach database",
      });
    }

    // Test 2: Can we query Users?
    const User = (await import("./models/User.models.js")).default;
    const userCount = await User.countDocuments().maxTimeMS(5000);
    console.log(`  ✓ User count: ${userCount}`);

    return res.status(200).json({
      success: true,
      message: "Profile endpoint is healthy",
      diagnostics: {
        mongodb_connected: mongoConnected,
        user_count: userCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[profile-debug] Error:", err.message);
    res.status(500).json({
      success: false,
      error: err.message,
      code: "DEBUG_ERROR",
    });
  }
});

app.get("/api/analytics/report/:userId", (req, res) => {
  console.log("✅ REPORT API HIT");
  res.json({ ok: true });
});

// ==================== 404 HANDLER ====================
// Catch all unmatched routes for debugging
app.use((req, res) => {
  console.error(`❌ [404] No route found for: ${req.method} ${req.path}`);
  console.error(`   Full URL: ${req.originalUrl}`);
  console.error(`   Query params: ${JSON.stringify(req.query)}`);
  console.error(`   Available routes:`);
  console.error(`   - GET/PUT /api/v1/profile/:userId`);
  console.error(`   - GET/POST /api/v1/analytics/...`);
  console.error(`   - GET/POST /api/v1/payment/...`);

  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
    method: req.method,
    suggestion:
      "Check if endpoint path is correct and backend routes are properly mounted",
  });
});

// ==================== GLOBAL ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error("❌ [ERROR] Unhandled error in middleware:");
  console.error(`   Path: ${req.path}`);
  console.error(`   Error: ${err.message}`);
  console.error(`   Stack: ${err.stack}`);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// DB connection
export default app;
