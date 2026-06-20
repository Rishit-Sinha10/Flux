import { requireAuth } from "@clerk/express";
import express from "express";
import {
  getFollow,
  getUnfollow,
  getFollowers,
  getFollowing,
  CheckFollowStatus,
} from "../controller/follow.controller.js";
const router = express.Router();
router.post("/follow/:id", requireAuth, getFollow);
router.delete("/Unfollow/:id", requireAuth, getUnfollow);
router.get("/:userId/followers", requireAuth, getFollowers);
router.get("/:id/following", requireAuth, getFollowing);
router.get("/:id/check-status", requireAuth, CheckFollowStatus);
export default router;
