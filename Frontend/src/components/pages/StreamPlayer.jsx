import { useRef, useEffect, useState } from "react";
import Hls from "hls.js";
export default function StreamPlayer({ streamId }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!streamId || !videoRef.current) return;
    const hlsUrl = `http://localhost:8080/hls/${streamId}.m3u8`;
    const video = videoRef.current;
    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
    cleanup();
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
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setLoading(false);
          setError("Stream unavailable. Streamer may be offline.");
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        setLoading(false);
        setError("Stream unavailable. Streamer may be offline.");
      });
    } else {
      setError("Your browser does not support HLS playback.");
      setLoading(false);
    }
    return cleanup;
  }, [streamId]);
  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-300">Connecting to stream...</p>
        </div>
      )}
      {error && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <p className="text-4xl mb-3">📡</p>
          <p className="text-sm text-gray-300 text-center px-4">{error}</p>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        playsInline
        className="w-full h-full object-contain"
        style={{ display: error ? "none" : "block" }}
      />
    </div>
  );
}