import Stream from "../models/stream.models.js";
import { v4 as uuidv4 } from "uuid";
import { activeStreams } from "../sockets.js";
import {
  getRecordingStatus,
  getActiveRecordings,
} from "../utils/ffmpeg-recorder.js";
// 🎥 CREATE STREAM (Go Live)
export const createStream = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const streamKey = uuidv4();
    const stream = await Stream.create({
      title,
      description,
      category: category || "Gaming",
      creator: req.user.id,
      streamKey: streamKey,
      rtmpUrl: `rtmp://localhost:1935/live/${streamKey}`,
      isLive: false,
    });
    res.status(201).json({
      _id: stream._id,
      streamKey: stream.streamKey,
      rtmpUrl: stream.rtmpUrl,
      title: stream.title,
      description: stream.description,
      category: stream.category,
      message:
        "Stream created. Use RTMP URL with OBS/FFmpeg to start streaming.",
    });
  } catch (err) {
    console.error("Error creating stream:", err);
    res.status(500).json({ error: err.message });
  }
};
// 🛑 END STREAM
export const endStream = async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream) {
      return res.status(404).json({ msg: "Stream not found" });
    }
    stream.isLive = false;
    stream.endedAt = new Date();
    await stream.save();
    // Clean up from active streams
    if (activeStreams.has(req.params.id)) {
      activeStreams.delete(req.params.id);
    }
    res.json({ msg: "Stream ended", stream });
  } catch (err) {
    console.error("Error ending stream:", err);
    res.status(500).json({ error: err.message });
  }
};
// 📺 GET LIVE STREAMS
export const getLiveStreams = async (req, res) => {
  try {
    const streams = await Stream.find({ isLive: true })
      .populate("creator", "username avatarUrl")
      .sort({ startedAt: -1 });
    res.json(streams);
  } catch (err) {
    console.error("Error getting live streams:", err);
    res.status(500).json({ error: err.message });
  }
};
// 🔍 GET STREAM BY ID
export const getStreamById = async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id).populate(
      "creator",
      "username avatarUrl",
    );
    if (!stream) {
      return res.status(404).json({ msg: "Stream not found" });
    }
    // Get live metrics if stream is active
    let liveMetrics = null;
    if (activeStreams.has(req.params.id)) {
      const activeStream = activeStreams.get(req.params.id);
      liveMetrics = {
        currentViewers: activeStream.metrics.currentViewers,
        bitrate: activeStream.metrics.bitrate,
        fps: activeStream.metrics.fps,
        resolution: activeStream.metrics.resolution,
        health: activeStream.metrics.health,
      };
    }
    res.json({
      ...stream.toObject(),
      liveMetrics,
    });
  } catch (err) {
    console.error("Error getting stream:", err);
    res.status(500).json({ error: err.message });
  }
};

// 📊 GET STREAM METRICS
export const getStreamMetrics = async (req, res) => {
  try {
    const { streamId } = req.params;

    const stream = await Stream.findById(streamId);
    if (!stream) {
      return res.status(404).json({ msg: "Stream not found" });
    }

    // Get real-time metrics if stream is active
    let metrics = {
      currentViewers: stream.viewers,
      peakViewers: stream.peakViewers,
      bitrate: stream.bitrate,
      fps: stream.fps,
      resolution: stream.resolution,
      health: stream.streamHealth,
      isLive: stream.isLive,
    };
    if (activeStreams.has(streamId)) {
      const activeStream = activeStreams.get(streamId);
      metrics = { ...metrics, ...activeStream.metrics };
    }
    res.json(metrics);
  } catch (err) {
    console.error("Error getting metrics:", err);
    res.status(500).json({ error: err.message });
  }
};

// 👥 GET STREAM VIEWERS LIST
export const getStreamViewers = async (req, res) => {
  try {
    const { streamId } = req.params;

    if (!activeStreams.has(streamId)) {
      return res.json({
        viewers: [],
        count: 0,
        message: "Stream is not active",
      });
    }

    const stream = activeStreams.get(streamId);
    const viewerCount = stream.viewers.length;
    res.json({
      viewers: stream.viewers,
      count: viewerCount,
      isLive: true,
    });
  } catch (err) {
    console.error("Error getting viewers:", err);
    res.status(500).json({ error: err.message });
  }
};

// 📈 GET CREATOR'S STREAMS
export const getCreatorStreams = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const streams = await Stream.find({ creator: creatorId })
      .sort({ startedAt: -1 })
      .populate("creator", "username avatarUrl");
    res.json(streams);
  } catch (err) {
    console.error("Error getting creator streams:", err);
    res.status(500).json({ error: err.message });
  }
};
// 🎞️ GET STREAM RECORDINGS (VOD)
export const getStreamRecordings = async (req, res) => {
  try {
    const { creatorId } = req.params;

    const recordings = await Stream.find({
      creator: creatorId,
      isRecorded: true,
    })
      .select("title description thumbnail vodUrl hlsUrl recordingDuration")
      .sort({ endedAt: -1 });

    res.json(recordings);
  } catch (err) {
    console.error("Error getting recordings:", err);
    res.status(500).json({ error: err.message });
  }
};
// 📍 GET STREAM STATUS
export const getStreamStatus = async (req, res) => {
  try {
    const { streamId } = req.params;

    const stream = await Stream.findById(streamId);
    if (!stream) {
      return res.status(404).json({ msg: "Stream not found" });
    }

    const status = {
      streamId,
      isLive: stream.isLive,
      title: stream.title,
      viewers: stream.viewers,
      startedAt: stream.startedAt,
      endedAt: stream.endedAt,
      streamHealth: stream.streamHealth,
      isRecorded: stream.isRecorded,
    };
    if (activeStreams.has(streamId)) {
      const activeStream = activeStreams.get(streamId);
      status.liveMetrics = activeStream.metrics;
      status.uptime = Math.floor(
        (new Date() - activeStream.metrics.startTime) / 1000,
      );
    }
    res.json(status);
  } catch (err) {
    console.error("Error getting status:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🎥 GET RECORDING STATUS FOR A STREAM
export const getRecordingStatusEndpoint = async (req, res) => {
  try {
    const { streamId } = req.params;

    const recordingStatus = getRecordingStatus(streamId);

    if (!recordingStatus) {
      return res.json({
        streamId,
        isRecording: false,
        message: "No active recording for this stream",
      });
    }

    res.json(recordingStatus);
  } catch (err) {
    console.error("Error getting recording status:", err);
    res.status(500).json({ error: err.message });
  }
};
// 🎬 GET ALL ACTIVE RECORDINGS
export const getAllActiveRecordings = async (req, res) => {
  try {
    const activeRecordings = getActiveRecordings();

    res.json({
      count: activeRecordings.length,
      recordings: activeRecordings,
    });
  } catch (err) {
    console.error("Error getting active recordings:", err);
    res.status(500).json({ error: err.message });
  }
};
