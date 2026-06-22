import app from "./app.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { setupStreamSockets } from "./sockets.js";
import { initializeRecordingDirs } from "./utils/ffmpeg-recorder.js";
import NodeMediaServer from "node-media-server";
import connectDB from "./db/dbconnect.js";
const PORT = process.env.PORT || 5000;
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8080,
    mediaroot: "./media",
    allow_origin: "*",
  },
};
const nms = new NodeMediaServer(config);
nms.run();
// Initialize recording directories on startup
await initializeRecordingDirs();
// Setup Socket.IO event handlers for streaming
setupStreamSockets(io);
nms.on("prePublish", (id, StreamPath, args) => {
  console.log("Stream started:", StreamPath);
});
nms.on("donePublish", (id, StreamPath, args) => {
  console.log("Stream ended:", StreamPath);
});
// ✅ FIXED: Properly await MongoDB connection before starting server
(async () => {
  try {
    // 1️⃣  Connect to MongoDB FIRST
    await connectDB();
    console.log("✅ MongoDB connected successfully");
    // 2️⃣ THEN start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(
        `📡 Waiting for RTMP streams at rtmp://localhost:${process.env.Rmtp_port}/live/`,
      );
      console.log(`🎥 Recording directories initialized`);
      console.log("📡 RTMP Server running on port 1935");
      console.log("✅ All systems ready - API is operational\n");
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    console.error("   Possible causes:");
    console.error("   1. MongoDB is not running (try: mongod)");
    console.error("   2. MONGO_URI is incorrect in .env");
    console.error("   3. Network connection issue");
    process.exit(1);
  }
})();
