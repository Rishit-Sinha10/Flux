import { ChatModeration } from "./controller/chat.controller.js";
import { Message } from "./models/ChatMessage.models.js";
import Stream from "./models/stream.models.js";
import {
  startRecording,
  stopRecording,
  getActiveRecordings,
} from "./utils/ffmpeg-recorder.js";

// Track active streams and their metrics
const activeStreams = new Map(); // streamId -> { viewers: [], metrics: {} }

export const setupStreamSockets = (io) => {
  io.on("connection", (socket) => {
    console.log("👤 User connected:", socket.id);

    // ==================== STREAM EVENTS ====================

    // 🔴 JOIN STREAM - Viewer joins the stream
    socket.on("join-stream", async (streamId) => {
      try {
        socket.join(streamId);
        console.log(`✅ ${socket.id} joined stream ${streamId}`);

        // Initialize stream if not exists
        if (!activeStreams.has(streamId)) {
          activeStreams.set(streamId, {
            viewers: [],
            metrics: {
              currentViewers: 0,
              totalViewers: 0,
              bitrate: 0,
              fps: 0,
              resolution: "1080p",
              health: "good",
              startTime: new Date(),
            },
          });
        }

        const stream = activeStreams.get(streamId);

        // Add viewer to list
        stream.viewers.push({
          socketId: socket.id,
          joinedAt: new Date(),
        });

        const currentViewers = stream.viewers.length;
        stream.metrics.currentViewers = currentViewers;

        // Update database
        await Stream.findByIdAndUpdate(streamId, {
          viewers: currentViewers,
        });

        // Broadcast updated viewer count
        io.to(streamId).emit("viewer-count", currentViewers);
        io.to(streamId).emit("stream-status", {
          isLive: true,
          viewers: currentViewers,
          status: "streaming",
        });

        console.log(`👥 Stream ${streamId} now has ${currentViewers} viewers`);
      } catch (err) {
        console.error("Error joining stream:", err);
      }
    });

    // 💬 SEND MESSAGE - Real-time chat
    socket.on("send-message", async (data) => {
      try {
        const { streamId, message, userId, userName, sender } = data;

        if (!streamId || !message) return;

        // 🔐 Moderation
        const moderation = await ChatModeration(message);

        if (moderation.flagged) {
          return socket.emit("message-blocked", {
            reason: "Content violation",
          });
        }

        // 💾 Save to DB
        const newMessage = await Message.create({
          streamId,
          userId,
          message,
          userName: userName || "Anonymous",
          sender: sender || "viewer",
          moderation: { flagged: false },
          createdAt: new Date(),
        });

        // 📡 Broadcast to stream
        io.to(streamId).emit("receive-message", {
          _id: newMessage._id,
          message: newMessage.message,
          userName: newMessage.userName,
          sender: newMessage.sender,
          timestamp: newMessage.createdAt,
        });
      } catch (error) {
        console.error("Chat error:", error);
      }
    });

    // 📊 STREAM METRICS - Encoder sends bitrate/fps/resolution
    socket.on("stream-metrics", ({ streamId, bitrate, fps, resolution }) => {
      try {
        if (!activeStreams.has(streamId)) return;

        const stream = activeStreams.get(streamId);
        stream.metrics.bitrate = bitrate;
        stream.metrics.fps = fps;
        stream.metrics.resolution = resolution;

        // Determine stream health based on metrics
        let health = "good";
        if (bitrate < 1000 || fps < 24) health = "fair";
        if (bitrate < 500 || fps < 15) health = "poor";
        stream.metrics.health = health;

        // Broadcast metrics to all viewers in stream
        io.to(streamId).emit("stream-metrics", {
          bitrate,
          fps,
          resolution,
          health,
        });
        console.log(
          `📊 Metrics for ${streamId}: ${bitrate}Kbps @ ${fps}fps [${health}]`,
        );
      } catch (err) {
        console.error("Error updating metrics:", err);
      }
    });

    // 🎬 STREAM STARTED - Encoder connects for RTMP stream
    socket.on("stream-started", async ({ streamId, rtmpUrl, creatorId }) => {
      try {
        const stream = await Stream.findByIdAndUpdate(
          streamId,
          {
            isLive: true,
            startedAt: new Date(),
          },
          { new: true },
        );

        // ✅ START FFMPEG RECORDING
        if (rtmpUrl) {
          try {
            await startRecording(streamId, rtmpUrl, { creatorId });
            console.log(`🎥 Recording started for stream ${streamId}`);

            // Notify viewers that recording started
            io.to(streamId).emit("recording-started", {
              message: "Stream recording started",
              timestamp: new Date(),
            });
          } catch (recordError) {
            console.warn(`⚠️  Recording not started: ${recordError.message}`);
            // Continue even if recording fails
          }
        }
        io.to(streamId).emit("stream-status", {
          isLive: true,
          status: "live",
          recording: true,
          timestamp: new Date(),
        });
        console.log(`🔴 Stream ${streamId} is now LIVE`);
      } catch (err) {
        console.error("Error starting stream:", err);
      }
    });
    // ⏹️ STREAM ENDED - Encoder disconnects
    socket.on("stream-ended", async ({ streamId }) => {
      try {
        const stream = activeStreams.get(streamId);
        if (!stream) return;

        const duration = Math.floor(
          (new Date() - stream.metrics.startTime) / 1000,
        );
        // ✅ STOP FFMPEG RECORDING
        try {
          await stopRecording(streamId);
          console.log(`✅ Recording stopped for stream ${streamId}`);
        } catch (recordError) {
          console.warn(`⚠️  Error stopping recording: ${recordError.message}`);
        }

        await Stream.findByIdAndUpdate(streamId, {
          isLive: false,
          endedAt: new Date(),
          viewers: 0,
          recordingDuration: duration,
        });

        io.to(streamId).emit("stream-status", {
          isLive: false,
          status: "ended",
          duration,
          timestamp: new Date(),
        });

        // Broadcast to room that stream ended
        io.to(streamId).emit("stream-ended-notification", {
          message: "Stream has ended. Recording will be available shortly.",
          recordedAt: new Date(),
        });

        console.log(`⏹️ Stream ${streamId} ended (Duration: ${duration}s)`);

        // Clean up after 5 minutes
        setTimeout(
          () => {
            activeStreams.delete(streamId);
          },
          5 * 60 * 1000,
        );
      } catch (err) {
        console.error("Error ending stream:", err);
      }
    });

    // 🔴 LEAVE STREAM - Viewer disconnects
    socket.on("leave-stream", async ({ streamId }) => {
      try {
        if (!activeStreams.has(streamId)) return;

        const stream = activeStreams.get(streamId);
        stream.viewers = stream.viewers.filter((v) => v.socketId !== socket.id);

        const currentViewers = stream.viewers.length;
        stream.metrics.currentViewers = currentViewers;

        await Stream.findByIdAndUpdate(streamId, {
          viewers: currentViewers,
        });

        io.to(streamId).emit("viewer-count", currentViewers);
        console.log(
          `👤 Viewer left ${streamId}. Now ${currentViewers} viewers`,
        );
      } catch (err) {
        console.error("Error leaving stream:", err);
      }
    });

    // ==================== SOCKET DISCONNECTION ====================
    socket.on("disconnect", async () => {
      try {
        console.log("❌ User disconnected:", socket.id);

        // Remove from all active streams
        for (const [streamId, stream] of activeStreams) {
          stream.viewers = stream.viewers.filter(
            (v) => v.socketId !== socket.id,
          );

          const currentViewers = stream.viewers.length;
          stream.metrics.currentViewers = currentViewers;

          await Stream.findByIdAndUpdate(streamId, {
            viewers: currentViewers,
          });

          io.to(streamId).emit("viewer-count", currentViewers);
        }
      } catch (err) {
        console.error("Error on disconnect:", err);
      }
    });
    // Chat Moderation using WebSocket
  });
};
export { activeStreams };
