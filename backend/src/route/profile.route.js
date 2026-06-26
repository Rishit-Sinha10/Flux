import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  getUserSettings,
  updateUserSettings,
  getAnalytics,
} from "../controller/profile.controller.js";
import { requireAuth } from "../middleware/require-Auth.js";
import User from "../models/User.models.js";
const route = express.Router();

// ✅ DEBUG ENDPOINT: Must come BEFORE the catch-all /:userId route!
route.get("/debug", async (req, res) => {
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

// ✅ All routes protected with Clerk JWT verification
route.use(requireAuth);
// Profile routes
route.get("/:userId", getUserProfile);
route.put("/:userId", updateUserProfile);
// Settings routes
route.get("/settings/:userId", getUserSettings);
route.put("/settings/:userId", updateUserSettings);
// Analytics route
route.get("/analytics/:userId", getAnalytics);
export default route;
