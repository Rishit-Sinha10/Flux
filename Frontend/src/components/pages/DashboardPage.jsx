import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Navbar from "../common/navbar";
import Sidebar from "../common/sidebar";
import DashboardContent from "./dashboard";
import { streamAPI, profileAPI } from "../../services/apiClient";

const socket = io("http://localhost:5000");

export default function DashboardPage() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [liveStreams, setLiveStreams] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollingRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [streamsRes] = await Promise.all([
          streamAPI.getLiveStreams(),
        ]);
        if (!cancelled) {
          setLiveStreams(streamsRes.data || []);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();

    socket.on("new-live-stream", () => { if (!cancelled) fetchData(); });
    pollingRef.current = setInterval(() => { if (!cancelled) fetchData(); }, 15000);

    return () => {
      cancelled = true;
      socket.off("new-live-stream");
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const stats = [
    { label: "Live Streams", value: loading ? "..." : liveStreams.length, change: "0%", changeType: "up", iconBg: "#FEF2F2", iconColor: "#EF4444", accentColor: "#EF4444", icon: <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z"/></svg> },
    { label: "Active Viewers", value: liveStreams.reduce((s, st) => s + (st.viewers || 0), 0), change: "0%", changeType: "up", iconBg: "#EFF6FF", iconColor: "#3B82F6", accentColor: "#3B82F6", icon: <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg> },
    { label: "Categories", value: new Set(liveStreams.map(s => s.category).filter(Boolean)).size, change: "0%", changeType: "up", iconBg: "#F5F3FF", iconColor: "#8B5CF6", accentColor: "#8B5CF6", icon: <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z"/></svg> },
    { label: "Total Streams", value: loading ? "..." : liveStreams.length, change: "0%", changeType: "up", iconBg: "#ECFDF5", iconColor: "#10B981", accentColor: "#10B981", icon: <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg> },
  ];

  const streams = liveStreams.slice(0, 6).map((s) => ({
    title: s.title || "Untitled",
    isLive: true,
    viewerCount: s.viewers || 0,
    thumbnailGradient: "linear-gradient(135deg,#1e3a5f,#3B82F6)",
    tags: s.category ? [{ label: s.category, bg: "#EFF6FF", color: "#3B82F6" }] : [],
  }));

  const activityItems = liveStreams.slice(0, 10).map((s, i) => ({
    titleParts: [
      { text: s.creator?.username || "Someone", highlight: true },
      { text: ` started streaming "${s.title || "Untitled"}"` },
    ],
    meta: `${s.category || "Stream"} · ${s.viewers || 0} viewers`,
    icon: <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z"/></svg>,
    iconBg: "#FEF2F2",
    iconColor: "#EF4444",
  }));

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? "ml-0" : "ml-64"}`}>
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <DashboardContent
            subtext={loading ? "Loading..." : `${liveStreams.length} stream(s) live right now`}
            dateRange={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            stats={stats}
            streams={streams}
            activityItems={activityItems}
          />
        </main>
      </div>
    </div>
  );
}
