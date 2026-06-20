import express from "express";
import { requireAuth } from "@clerk/express";
import {
  getProfile,
  updateProfile,
  updateSettings,
  generateAPIKey,
} from "../controller/user.controller.js";
const route = express.Router();
// ==================== PUBLIC ROUTES ===================
// ==================== PROTECTED ROUTES (Clerk) ====================
// ✅ FIXED: requireAuth should be passed as middleware (not called as function)
route.get("/profile", requireAuth, getProfile);
route.put("/profile", requireAuth, updateProfile);
route.put("/settings", requireAuth, updateSettings);
route.post("/apikey", requireAuth, generateAPIKey);
export default route;
