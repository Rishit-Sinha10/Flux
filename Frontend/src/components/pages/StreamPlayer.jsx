import { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
const RETRY_INTERVAL = 5000;
const MAX_RETRIES = 20;
export default function StreamPlayer({ streamId, hlsUrl: overrideHlsUrl }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const retryTimerRef = useRef(null);
  const retryCountRef = useRef(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const cleanup = useCallback(() => {
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);
  const startPlayer = useCallback(() => {
    if (!streamId || !videoRef.current) return;
    const hlsUrl = overrideHlsUrl || `http://localhost:8080/live/${streamId}/index.m3u8`;
    const video = videoRef.current;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setError(null);
    setLoading(true);
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        setError(null);
        retryCountRef.current = 0;
        setRetryCount(0);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          retryCountRef.current += 1;
          setRetryCount(retryCountRef.current);
          if (retryCountRef.current >= MAX_RETRIES) {
            setLoading(false);
            setError("Stream unavailable. Streamer may be offline.");
          } else {
            setLoading(true);
            setError(null);
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => {
        setLoading(false);
        setError(null);
        retryCountRef.current = 0;
        setRetryCount(0);
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        retryCountRef.current += 1;
        setRetryCount(retryCountRef.current);
        if (retryCountRef.current >= MAX_RETRIES) {
          setLoading(false);
          setError("Stream unavailable. Streamer may be offline.");
        } else {
          setLoading(true);
          setError(null);
        }
      });
    } else {
      setError("Your browser does not support HLS playback.");
      setLoading(false);
    }
  }, [streamId]);
  useEffect(() => {
    if (!streamId) return;
    retryCountRef.current = 0;
    setRetryCount(0);
    startPlayer();
    retryTimerRef.current = setInterval(() => {
      const hls = hlsRef.current;
      if (!hls || !hls.url) {
        startPlayer();
        return;
      }
      try {
        if (hls.nextLoadLevel !== undefined && hls.state !== undefined) {
          const states = ["STOPPED", "IDLE", "MANIFEST_LOADING", "MANIFEST_LOADED", "MANIFEST_PARSED", "LEVEL_LOADING", "LEVEL_LOADED", "AUDIO_TRACK_LOADING", "AUDIO_TRACK_LOADED", "BUFFERING", "LOADING", "PLAYING", "PAUSED", "ERROR"];
          const stateName = states[hls.state];
          if (stateName === "ERROR" || hls.state === 13) {
            startPlayer();
          }
        }
      } catch {
        startPlayer();
      }
    }, RETRY_INTERVAL);
    return cleanup;
  }, [streamId, startPlayer, cleanup]);
  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {(loading || (error && retryCount < MAX_RETRIES)) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-300">
            {retryCount === 0
              ? "Connecting to stream..."
              : `Connecting to stream... (retry ${retryCount}/${MAX_RETRIES})`}
          </p>
        </div>
      )}
      {error && retryCount >= MAX_RETRIES && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <p className="text-4xl mb-3">📡</p>
          <p className="text-sm text-gray-300 text-center px-4">{error}</p>
          <p className="text-xs text-gray-500 mt-2">Stream may have ended</p>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        playsInline
        className="w-full h-full object-contain"
      />
    </div>
  );
}
