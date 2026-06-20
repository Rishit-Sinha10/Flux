/**
 * DEBUG VERSION: User Controller with detailed logging
 *
 * Use this by importing from here instead of the regular controller
 * to see exactly what's happening at each step of profile fetch/creation
 *
 * Production note: Remove console.logs after debugging complete
 */

import User from "../models/User.models.js";
import { randomBytes } from "crypto";

/**
 * GET /api/auth/profile — DEBUG VERSION
 * ✅ Fetch user profile - Auto-create if doesn't exist
 * Enhanced with step-by-step logging
 */
export const getProfileDebug = async (req, res) => {
  const requestId = randomBytes(4).toString("hex");
  const startTime = Date.now();

  try {
    console.log(`\n[DEBUG:${requestId}] 🟢 START — getProfile request`);
    console.log(`[DEBUG:${requestId}]    Time: ${new Date().toISOString()}`);

    // ===== STEP 1: Extract Clerk ID =====
    console.log(`[DEBUG:${requestId}] Step 1️⃣  Extract Clerk ID from req.auth`);
    const clerkId = req.auth?.userId;
    const clerkEmail = req.auth?.email;

    console.log(`[DEBUG:${requestId}]    clerkId: ${clerkId}`);
    console.log(`[DEBUG:${requestId}]    clerkEmail: ${clerkEmail}`);
    console.log(
      `[DEBUG:${requestId}]    req.auth keys: ${Object.keys(req.auth || {}).join(", ")}`,
    );

    // ===== STEP 2: Validate Auth =====
    console.log(`[DEBUG:${requestId}] Step 2️⃣  Validate authentication`);
    if (!clerkId) {
      console.error(`[DEBUG:${requestId}] ❌ FAIL: clerkId is null/undefined`);
      console.error(
        `[DEBUG:${requestId}]    req.auth is: ${JSON.stringify(req.auth)}`,
      );

      return res.status(401).json({
        success: false,
        msg: "Not authenticated - Clerk ID missing",
        debug: { clerkId, authObject: req.auth },
      });
    }
    console.log(`[DEBUG:${requestId}] ✅ PASS: clerkId validated —`, clerkId);

    // ===== STEP 3: Check MongoDB Connection =====
    console.log(`[DEBUG:${requestId}] Step 3️⃣  Verify MongoDB connection`);
    const dbConnected =
      global.mongoConnected && require("mongoose").connection.readyState === 1;
    console.log(
      `[DEBUG:${requestId}]    MongoDB.readyState: ${require("mongoose").connection.readyState}`,
    );
    console.log(
      `[DEBUG:${requestId}]    global.mongoConnected: ${global.mongoConnected}`,
    );

    if (!dbConnected) {
      console.error(`[DEBUG:${requestId}] ❌ FAIL: MongoDB not connected`);
      return res.status(503).json({
        success: false,
        msg: "Database not ready",
        debug: { readyState: require("mongoose").connection.readyState },
      });
    }
    console.log(`[DEBUG:${requestId}] ✅ PASS: MongoDB is ready`);

    // ===== STEP 4: Query existing user =====
    console.log(
      `[DEBUG:${requestId}] Step 4️⃣  Query existing user from database`,
    );
    console.log(
      `[DEBUG:${requestId}]    Query: User.findOne({ clerkId: "${clerkId}" })`,
    );

    const queryStartTime = Date.now();
    let user = await User.findOne({ clerkId }).select("-password");
    const queryDuration = Date.now() - queryStartTime;

    console.log(
      `[DEBUG:${requestId}]    Query completed in ${queryDuration}ms`,
    );

    if (user) {
      // ===== USER FOUND: Return existing profile =====
      console.log(`[DEBUG:${requestId}] ✅ FOUND: User exists in database`);
      console.log(`[DEBUG:${requestId}]    User ID: ${user._id}`);
      console.log(`[DEBUG:${requestId}]    Email: ${user.email}`);
      console.log(`[DEBUG:${requestId}]    Username: ${user.username}`);

      const totalDuration = Date.now() - startTime;
      console.log(
        `[DEBUG:${requestId}] ✅ SUCCESS — Returning existing user (${totalDuration}ms total)\n`,
      );

      return res.json({
        success: true,
        msg: "Profile fetched",
        user,
        debug: { duration: totalDuration, action: "found" },
      });
    }

    // ===== STEP 5: Auto-create user =====
    console.log(
      `[DEBUG:${requestId}] Step 5️⃣  User NOT found — creating new user`,
    );

    const email = clerkEmail || `user-${clerkId}@clerk.local`;
    const firstName = req.auth?.first_name || "User";
    const lastName = req.auth?.last_name || clerkId.slice(-6);
    const username = `${firstName.toLowerCase()}-${clerkId.slice(-4)}`;

    console.log(`[DEBUG:${requestId}]    Creating with:`);
    console.log(`[DEBUG:${requestId}]      - email: ${email}`);
    console.log(`[DEBUG:${requestId}]      - firstName: ${firstName}`);
    console.log(`[DEBUG:${requestId}]      - lastName: ${lastName}`);
    console.log(`[DEBUG:${requestId}]      - username: ${username}`);

    user = new User({
      clerkId,
      email,
      firstName,
      lastName,
      username,
      password: "clerk-auth",
    });

    // ===== STEP 6: Save to database =====
    console.log(`[DEBUG:${requestId}] Step 6️⃣  Saving new user to database`);
    const saveStartTime = Date.now();

    try {
      await user.save();
      const saveDuration = Date.now() - saveStartTime;
      console.log(
        `[DEBUG:${requestId}]    Save completed in ${saveDuration}ms`,
      );
      console.log(`[DEBUG:${requestId}]    Generated user ID: ${user._id}`);
    } catch (saveErr) {
      if (saveErr.code === 11000) {
        console.warn(
          `[DEBUG:${requestId}] ⚠️  Race condition: User already exists (duplicate key)`,
        );
        // Retry fetch
        user = await User.findOne({ clerkId: req.auth.userId }).select(
          "-password",
        );
        return res.json({
          success: true,
          msg: "Profile fetched (race condition recovery)",
          user,
          debug: { action: "race_condition_recovery" },
        });
      }
      throw saveErr;
    }

    const totalDuration = Date.now() - startTime;
    console.log(
      `[DEBUG:${requestId}] ✅ SUCCESS — User created and returned (${totalDuration}ms total)\n`,
    );

    res.status(201).json({
      success: true,
      msg: "User profile created",
      user,
      debug: { duration: totalDuration, action: "created" },
    });
  } catch (err) {
    const totalDuration = Date.now() - startTime;

    console.error(`\n[DEBUG:${requestId}] ❌ ERROR — ${err.message}`);
    console.error(`[DEBUG:${requestId}]    Stack: ${err.stack}`);
    console.error(`[DEBUG:${requestId}]    Duration: ${totalDuration}ms\n`);

    res.status(500).json({
      success: false,
      msg: "Error fetching profile",
      error: err.message,
      debug: {
        duration: totalDuration,
        errorCode: err.code,
        errorName: err.name,
      },
    });
  }
};

/**
 * Helper function to temporarily switch to debug mode
 * Add this to your app.js to use the debug version:
 *
 * if (process.env.DEBUG_PROFILE === "true") {
 *   route.get("/profile", requireAuth, getProfileDebug);
 * } else {
 *   route.get("/profile", requireAuth, getProfile);
 * }
 */
