import { requireAuth } from "@clerk/express";
import {
  GetLike,
  GetAllLike,
  GetAllComment,
  GetAllShare,
  GetComment,
  GetShare,
} from "../controller/Social.controller.js";
import express, { Router } from "express";
const router = express.Router();
router.post("user/:id/like", requireAuth, GetLike);
router.get("Stream/:id/like", requireAuth, GetAllLike);
router.post("user/:id/Share", requireAuth, GetShare);
router.get("Stream/:id/Share", requireAuth, GetAllShare);
router.post("Stream/:id/Comment", requireAuth, GetComment);
router.get("Creator/Stream/:id/Comment", requireAuth, GetAllComment);
export default router;
