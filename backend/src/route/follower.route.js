import { requireAuth } from "@clerk/express";
import express from "express";
import {
  getFollow,
  getUnfollow,
  getFollowers,
  getFollowing,
  checkFollowStatus,
} from "../controller/follow.controller.js";
const router = express.Router();
router.post("/follow/:id", requireAuth, getFollow);
router.delete("/Unfollow/:id", requireAuth, getUnfollow);
router.get("/:userId/followers", requireAuth, getFollowers);
router.get("/:id/following", requireAuth, getFollowing);
router.get("/check", requireAuth, checkFollowStatus);
export default router;
