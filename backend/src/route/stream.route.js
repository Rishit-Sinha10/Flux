import express from "express";
import {
  createStream,
  endStream,
  getLiveStreams,
  getStreamById,
  getStreamMetrics,
  getStreamViewers,
  getCreatorStreams,
  getStreamRecordings,
  getStreamStatus,
  getRecordingStatusEndpoint,
  getAllActiveRecordings,
} from "../controller/stream.controller.js";
import { requireAuth } from "@clerk/express";
import websocketAuth from "../middleware/websocket.middleware.js";
const router = express.Router();
// 🔧 Stream Management
router.post("/create", websocketAuth, createStream); // Create stream and get stream key
router.put("/end/:id", websocketAuth, endStream); // End stream
router.get("/live", websocketAuth, getLiveStreams); // Get all live streams
router.get("/:id", requireAuth, getStreamById); // Get stream details
// 📊 Stream Metrics & Analytics
router.get("/:streamId/metrics", websocketAuth, getStreamMetrics); // Get stream metrics (bitrate, fps, health, etc.)
router.get("/:streamId/viewers", websocketAuth, getStreamViewers); // Get list of current viewers
router.get("/:streamId/status", websocketAuth, getStreamStatus); // Get detailed stream status
// 🎥 Recording Status
router.get("/:streamId/recording", websocketAuth, getRecordingStatusEndpoint); // Get recording status for specific stream
router.get("/recording/active/all", websocketAuth, getAllActiveRecordings); // Get all active recordings
// 👤 Creator's Streams
router.get("/creator/:creatorId/all", websocketAuth, getCreatorStreams); // Get all streams by creator
router.get(
  "/creator/:creatorId/recordings",
  websocketAuth,
  getStreamRecordings,
); // Get VOD recordings
export default router;
