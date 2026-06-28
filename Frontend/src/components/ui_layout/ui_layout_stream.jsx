import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Navbar from "../common/navbar";
import Sidebar from "../common/sidebar";
import StreamPlayer from "../pages/StreamPlayer";
import ChatbotWidget from "../chatbot/chatbot_widget";
import { streamAPI } from "../../services/apiClient";

const socket = io("http://localhost:5000");

const CATEGORY_COLORS = {
    Gaming: { bg: "#1e1b4b", text: "#a5b4fc" },
    Music: { bg: "#1a1a2e", text: "#f9a8d4" },
    Education: { bg: "#042f2e", text: "#6ee7b7" },
    Art: { bg: "#2d1b1b", text: "#fca5a5" },
    Tech: { bg: "#0f172a", text: "#7dd3fc" },
    IRL: { bg: "#1c1917", text: "#fcd34d" },
    Sports: { bg: "#052e16", text: "#86efac" },
};

function formatViewers(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
}

export default function StreamLayout() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchParams] = useSearchParams();
  const streamId = searchParams.get("stream");
  const [liveStreams, setLiveStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  const pollingRef = useRef(null);

  useEffect(() => {
    if (streamId) return;
    let cancelled = false;

    const doFetch = async () => {
      try {
        const res = await streamAPI.getLiveStreams();
        if (!cancelled) setLiveStreams(res.data);
      } catch (err) {
        console.error("Failed to fetch live streams:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doFetch();

    socket.on("new-live-stream", () => { if (!cancelled) doFetch(); });

    pollingRef.current = setInterval(() => { if (!cancelled) doFetch(); }, 10000);

    return () => {
      cancelled = true;
      socket.off("new-live-stream");
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [streamId]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-0" : "ml-64"
        }`}
      >
        <Navbar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {streamId ? (
            <div className="p-6">
              <div className="bg-black rounded-lg shadow-lg overflow-hidden relative h-[70vh]">
                <StreamPlayer streamId={streamId} />
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Browse Live Streams</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {loading ? "Loading..." : `${liveStreams.length} stream(s) live right now`}
                </p>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : liveStreams.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-500 text-lg">No live streams right now</p>
                  <p className="text-gray-400 text-sm mt-1">Check back later or go live yourself!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {liveStreams.map((stream) => {
                    const colors = CATEGORY_COLORS[stream.category] || { bg: "#1e293b", text: "#94a3b8" };
                    return (
                      <div
                        key={stream._id}
                        onClick={() => navigate(`/stream/${stream._id}`)}
                        className="bg-white rounded-xl overflow-hidden border border-gray-100 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
                      >
                        <div className="relative aspect-video bg-gray-200">
                          <img
                            src={stream.thumbnail || `https://picsum.photos/seed/${stream._id}/640/360`}
                            alt={stream.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                          </span>
                          <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                            <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            {formatViewers(stream.viewers || 0)}
                          </span>
                        </div>
                        <div className="p-3">
                          <div className="flex items-start gap-2.5">
                            <img
                              src={stream.creator?.avatarUrl || `https://picsum.photos/seed/${stream._id}/80/80`}
                              alt={stream.creator?.username || "Streamer"}
                              className="w-8 h-8 rounded-full object-cover border-2 border-indigo-100 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{stream.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{stream.creator?.username || "Unknown"}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <span
                              className="inline-block text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.text}22` }}
                            >
                              {stream.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <ChatbotWidget/>
    </div>
  );
}
