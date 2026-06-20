// ============================================================
// FFmpeg Recording Service for RTMP Streams
// ============================================================
// Purpose: Monitor active RTMP streams and record them to:
//   - MP4 (full recording)
//   - HLS (segmented video for streaming)
// 
// Integration: Listens to Socket.IO events and Node.js
// Recording Flow:
//   1. Stream starts → Socket.IO "stream-started" event
//   2. FFmpeg process spawned to capture RTMP → MP4 + HLS
//   3. Stream ends → FFmpeg cleanup, duration recorded
//   4. VOD files available for playback
// ============================================================

import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { fileURLToPath } from "url";
import Stream from "../models/stream.models.js";
import logger from "../utils/logger.js";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CONFIGURATION
// ============================================================

const RECORDING_CONFIG = {
  // Video encoding
  videoCodec: "libx264",
  videoBitrate: "2500k",
  videoPreset: "ultrafast", // ultrafast, superfast, veryfast, faster
  videoBuffer: "5000k",
  videoResolution: "-vf scale=1280:720", // 720p

  // Audio encoding
  audioCodec: "aac",
  audioBitrate: "128k",
  audioSampleRate: "44100",

  // HLS specific
  hlsTime: 10, // Segment duration (seconds)
  hlsListSize: 10, // Keep last N segments
  hlsFlags: "delete_segments", // Delete old segments

  // Storage paths (will be created if needed)
  recordingsDir: path.join(__dirname, "../../recordings"),
  vodDir: path.join(__dirname, "../../vod"),
  hlsDir: path.join(__dirname, "../../hls"),

  // Timeout if no data for 30 seconds
  streamTimeout: 30000,
  // Max recording duration (12 hours)
  maxDuration: 12 * 60 * 60,
};

// Active recording processes Map
const activeRecordings = new Map();
// ============================================================
// INITIALIZATION
// ============================================================

async function initializeRecordingDirs() {
  try {
    const dirs = [
      RECORDING_CONFIG.recordingsDir,
      RECORDING_CONFIG.vodDir,
      RECORDING_CONFIG.hlsDir,
    ];

    for (const dir of dirs) {
      if (!fsSync.existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
        logger.info(`Created recording directory: ${dir}`);
      }
    }

    logger.info("✅ Recording directories initialized");
  } catch (error) {
    logger.error("❌ Failed to initialize recording dirs:", error);
  }
}
// ============================================================
// MAIN RECORDING SERVICE
// ============================================================
class FFmpegRecorder {
  constructor(streamId, rtmpUrl, userData = {}) {
    this.streamId = streamId;
    this.rtmpUrl = rtmpUrl;
    this.userData = userData;
    this.process = null;
    this.startTime = Date.now();
    this.isRecording = false;

    // Generate filename from timestamp + streamId
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.filename = `${timestamp}_${streamId}`;

    // Paths for outputs
    this.mp4Path = path.join(
      RECORDING_CONFIG.recordingsDir,
      `${this.filename}.mp4`
    );
    this.hlsPath = path.join(RECORDING_CONFIG.hlsDir, this.streamId);
    this.hlsPlaylist = path.join(this.hlsPath, "playlist.m3u8");
  }

  /**
   * Start recording the RTMP stream
   */
  async start() {
    try {
      logger.info(`🎬 Starting recording for stream: ${this.streamId}`);
      logger.info(`   RTMP Input: ${this.rtmpUrl}`);
      logger.info(`   MP4 Output: ${this.mp4Path}`);
      logger.info(`   HLS Output: ${this.hlsPlaylist}`);

      // Create HLS directory
      await fs.mkdir(this.hlsPath, { recursive: true });

      // FFmpeg command arguments
      const ffmpegArgs = this.buildFFmpegArgs();

      logger.debug(`FFmpeg args: ${ffmpegArgs.join(" ")}`);

      // Spawn FFmpeg process
      this.process = spawn("ffmpeg", ffmpegArgs, {
        detached: false,
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Handle stdout (progress/logs)
      this.process.stdout.on("data", (data) => {
        // logger.debug(`FFmpeg stdout: ${data}`);
      });

      // Handle stderr (FFmpeg logs, warnings, errors)
      this.process.stderr.on("data", (data) => {
        const output = data.toString();
        if (
          output.includes("error") ||
          output.includes("Error") ||
          output.includes("ERROR")
        ) {
          logger.warn(`FFmpeg warning/error: ${output.trim()}`);
        }
      });

      // Handle process exit
      this.process.on("close", (code) => {
        this.handleProcessExit(code);
      });

      // Handle process error
      this.process.on("error", (error) => {
        logger.error(`FFmpeg process error: ${error.message}`);
        this.isRecording = false;
      });

      this.isRecording = true;
      logger.info(`✅ Recording started for stream: ${this.streamId}`);
    } catch (error) {
      logger.error(`❌ Failed to start recording: ${error.message}`);
      throw error;
    }
  }

  /**
   * Build FFmpeg command arguments
   */
  buildFFmpegArgs() {
    // Input options (for RTMP)
    const inputOptions = [
      "-rtmp_live",
      "live", // Treat RTMP as live stream
      "-i",
      this.rtmpUrl, // Input source
    ];

    // Video codec options
    const videoOptions = [
      "-c:v",
      RECORDING_CONFIG.videoCodec,
      "-preset",
      RECORDING_CONFIG.videoPreset,
      "-b:v",
      RECORDING_CONFIG.videoBitrate,
      "-maxrate",
      RECORDING_CONFIG.videoBitrate,
      "-bufsize",
      RECORDING_CONFIG.videoBuffer,
      RECORDING_CONFIG.videoResolution,
    ];

    // Audio codec options
    const audioOptions = [
      "-c:a",
      RECORDING_CONFIG.audioCodec,
      "-b:a",
      RECORDING_CONFIG.audioBitrate,
      "-ar",
      RECORDING_CONFIG.audioSampleRate,
    ];

    // Format options (for MP4)
    const mp4Options = [
      "-f",
      "mp4",
      "-movflags",
      "frag_keyframe+empty_moov", // Enable streaming while recording
      this.mp4Path, // Output MP4 file
    ];

    // HLS options (segmented with playlist)
    const hlsOptions = [
      "-f",
      "hls",
      "-hls_time",
      RECORDING_CONFIG.hlsTime,
      "-hls_list_size",
      RECORDING_CONFIG.hlsListSize,
      "-hls_flags",
      RECORDING_CONFIG.hlsFlags,
      this.hlsPlaylist, // Output HLS playlist
    ];

    // Combine all arguments
    // Note: Using multiple outputs for MP4 and HLS simultaneously
    const args = [
      ...inputOptions,
      ...videoOptions,
      ...audioOptions,
      ...mp4Options,
      ...videoOptions, // Repeat for second output
      ...audioOptions,
      ...hlsOptions,
    ];

    return args;
  }

  /**
   * Stop recording gracefully
   */
  async stop() {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.isRecording) {
        resolve();
        return;
      }

      logger.info(`⏹️  Stopping recording for stream: ${this.streamId}`);

      // Send 'q' command to FFmpeg (graceful stop)
      this.process.stdin.write("q");

      // Timeout after 10 seconds, force kill if not stopped
      const timeout = setTimeout(() => {
        logger.warn(
          `FFmpeg graceful stop timeout, force killing for: ${this.streamId}`
        );
        this.process.kill("SIGKILL");
      }, 10000);

      this.process.on("close", () => {
        clearTimeout(timeout);
        resolve();
      });

      this.process.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Handle FFmpeg process exit
   */
  async handleProcessExit(code) {
    try {
      this.isRecording = false;
      const duration = (Date.now() - this.startTime) / 1000;

      if (code === 0) {
        logger.info(
          `✅ Recording completed for stream: ${this.streamId} (${Math.round(duration)}s)`
        );

        // Verify files exist
        const mp4Exists = fsSync.existsSync(this.mp4Path);
        const hlsExists = fsSync.existsSync(this.hlsPlaylist);

        if (mp4Exists && hlsExists) {
          // Update database
          await this.updateDatabase(duration);
          logger.info(`📊 Database updated with VOD metadata`);
        } else {
          logger.warn(
            `⚠️  Output files missing - MP4: ${mp4Exists}, HLS: ${hlsExists}`
          );
        }
      } else {
        logger.error(
          `❌ FFmpeg exited with code ${code} for stream: ${this.streamId}`
        );
      }

      // Cleanup
      activeRecordings.delete(this.streamId);
    } catch (error) {
      logger.error(
        `Error in handleProcessExit for stream ${this.streamId}:`,
        error
      );
    }
  }

  /**
   * Update database with recording metadata
   */
  async updateDatabase(duration) {
    try {
      const recordingUrl = `/vod/${this.filename}.mp4`;
      const hlsUrl = `/hls/${this.streamId}/playlist.m3u8`;

      await Stream.findByIdAndUpdate(this.streamId, {
        $set: {
          isRecorded: true,
          recordingPath: this.mp4Path,
          recordingUrl,
          hlsUrl,
          recordingDuration: Math.round(duration),
          recordedAt: new Date(),
        },
      });

      logger.info(
        `✅ Stream ${this.streamId} metadata saved (${Math.round(duration)}s recorded)`
      );
    } catch (error) {
      logger.error(
        `Error updating database for stream ${this.streamId}:`,
        error
      );
    }
  }

  /**
   * Get recording status
   */
  getStatus() {
    const uptime = this.isRecording
      ? Math.round((Date.now() - this.startTime) / 1000)
      : 0;

    return {
      streamId: this.streamId,
      isRecording: this.isRecording,
      uptime,
      mp4Path: this.mp4Path,
      hlsPath: this.hlsPlaylist,
      startTime: this.startTime,
    };
  }
}

// ============================================================
// SERVICE MANAGEMENT
// ============================================================

/**
 * Start recording a stream
 */
async function startRecording(streamId, rtmpUrl, userData = {}) {
  try {
    // Check if already recording
    if (activeRecordings.has(streamId)) {
      logger.warn(`Stream ${streamId} already being recorded`);
      return activeRecordings.get(streamId);
    }

    const recorder = new FFmpegRecorder(streamId, rtmpUrl, userData);
    await recorder.start();

    activeRecordings.set(streamId, recorder);
    return recorder;
  } catch (error) {
    logger.error(`Failed to start recording for ${streamId}:`, error);
    throw error;
  }
}

/**
 * Stop recording a stream
 */
async function stopRecording(streamId) {
  try {
    const recorder = activeRecordings.get(streamId);
    if (!recorder) {
      logger.warn(`No active recording found for stream: ${streamId}`);
      return;
    }

    await recorder.stop();
    logger.info(`✅ Recording stopped for stream: ${streamId}`);
  } catch (error) {
    logger.error(`Failed to stop recording for ${streamId}:`, error);
    throw error;
  }
}

/**
 * Get recording status for a stream
 */
function getRecordingStatus(streamId) {
  const recorder = activeRecordings.get(streamId);
  return recorder ? recorder.getStatus() : null;
}

/**
 * Get all active recordings
 */
function getActiveRecordings() {
  const recordings = [];
  activeRecordings.forEach((recorder, streamId) => {
    recordings.push(recorder.getStatus());
  });
  return recordings;
}

/**
 * Stop all recordings (cleanup on shutdown)
 */
async function stopAllRecordings() {
  logger.info(`Stopping all active recordings...`);
  const promises = [];

  activeRecordings.forEach((recorder, streamId) => {
    promises.push(stopRecording(streamId));
  });

  await Promise.all(promises);
  logger.info(`✅ All recordings stopped`);
}

/**
 * Cleanup old recordings (older than maxAge)
 */
async function cleanupOldRecordings(maxAgeDays = 7) {
  try {
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000; // Convert to ms
    const now = Date.now();

    const recordingFiles = await fs.readdir(
      RECORDING_CONFIG.recordingsDir
    );

    let deletedCount = 0;
    for (const file of recordingFiles) {
      const filePath = path.join(RECORDING_CONFIG.recordingsDir, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
        logger.info(`Deleted old recording: ${file}`);
      }
    }

    logger.info(
      `✅ Cleanup complete: ${deletedCount} old recordings deleted`
    );
  } catch (error) {
    logger.error("Error during cleanup:", error);
  }
}

// ============================================================
// EXPORTS
// ============================================================

export {
  FFmpegRecorder,
  initializeRecordingDirs,
  startRecording,
  stopRecording,
  getRecordingStatus,
  getActiveRecordings,
  stopAllRecordings,
  cleanupOldRecordings,
  RECORDING_CONFIG,
};
