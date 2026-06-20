import mongoose from "mongoose";
const streamSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "Gaming",
    },
    // 🎬 RTMP Streaming Fields
    streamKey: {
      type: String,
      unique: true,
      required: true,
    },
    rtmpUrl: {
      type: String,
      default: "rtmp://localhost:1935/live/", // Will be appended with streamKey
    },
    isLive: {
      type: Boolean,
      default: false,
    },

    // 👥 Viewer Tracking
    viewers: {
      type: Number,
      default: 0,
    },
    peakViewers: {
      type: Number,
      default: 0,
    },
    viewersList: [
      {
        username: String,
        joinedAt: Date,
        socketId: String,
      },
    ],

    // 📊 Stream Metrics
    bitrate: {
      type: Number,
      default: 0, // in Mbps
    },
    fps: {
      type: Number,
      default: 0,
    },
    resolution: {
      type: String,
      default: "1080p",
    },
    streamHealth: {
      type: String,
      enum: ["good", "fair", "poor"],
      default: "good",
    },

    // 🎥 Recording & VOD
    recordingPath: {
      type: String,
      default: "",
    },
    vodUrl: {
      type: String,
      default: "",
    },
    hlsUrl: {
      type: String,
      default: "",
    },
    isRecorded: {
      type: Boolean,
      default: false,
    },
    recordingDuration: {
      type: Number,
      default: 0, // in seconds
    },
    // 👤 Creator & Timestamps
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ⏰ Stream Timing
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    // 📈 Analytics
    totalViewers: {
      type: Number,
      default: 0,
    },
    averageViewtime: {
      type: Number,
      default: 0, // in seconds
    },
  },
  { timestamps: true },
);
// ✅ CRITICAL INDEXES: Optimize profile & analytics queries
streamSchema.index({ creator: 1 }); // For finding user's streams
streamSchema.index({ creator: 1, createdAt: -1 }); // For analytics time-range queries
streamSchema.index({ isLive: 1 }); // For finding live streams
// Update peak viewers when viewers count changes
streamSchema.methods.updateMetrics = function (currentViewers) {
  if (currentViewers > this.peakViewers) {
    this.peakViewers = currentViewers;
  }
};
const Stream = mongoose.model("Stream", streamSchema);
export default Stream;
