import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Navbar from "../common/navbar";
import Sidebar from "../common/sidebar";
import { analyticsAPI } from "../../services/apiClient";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export default function AnalyticsDashboard() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      if (!user?.id) return;

      const response = await analyticsAPI.generateReport(user.id);
      setReport(response.data?.report);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      const code = err.response?.data?.code;
      const status = err.response?.status;
      if (status === 503 || code === "DB_DISCONNECTED") {
        setError("Database is not connected. Make sure MongoDB is running and restart the backend.");
      } else if (status === 404 && code === "NO_DATA") {
        setError("");
        setReport({
          summary: {},
          engagement: {},
          topPerformingStreams: [],
          trends: {},
          deviceBreakdown: {},
          categoryData: [],
          topRegions: [],
        });
        return;
      } else if (err.isTimeout || err.code === "ECONNABORTED") {
        setError("Request timed out. The backend may be overloaded or not responding. Check that the backend server and MongoDB are running.");
      } else if (!err.response) {
        setError("Cannot reach the backend server. Make sure the backend is running at http://localhost:5000.");
      } else {
        setError("Failed to load analytics data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      navigate("/login");
      return;
    }
    fetchAnalytics();
  }, [isLoaded, user, navigate, fetchAnalytics]);

  const content = (() => {
    if (!isLoaded || loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-t-transparent mb-4 mx-auto"></div>
            <p className="text-gray-500">Loading analytics...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">&#9888;&#65039;</div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Analytics Unavailable</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4 text-sm max-w-lg mx-auto">
            {error}
          </div>
          <button onClick={fetchAnalytics} className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition">
            Try Again
          </button>
        </div>
      );
    }

    if (!report) {
      return (
        <div className="text-center py-16">
          <p className="text-gray-500">No analytics data available yet.</p>
          <p className="text-gray-400 text-sm mt-1">Start streaming to see your analytics here!</p>
        </div>
      );
    }

    const summary = report.summary || {};
    const engagement = report.engagement || {};
    const topStreams = report.topPerformingStreams || [];
    const trends = report.trends || {};
    const categoryData = report.categoryData || [];

    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Comprehensive insights into your streaming performance</p>
        </div>

        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {["overview", "engagement", "streams"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 font-semibold text-sm transition border-b-2 ${
                activeTab === tab
                  ? "text-red-600 border-red-500"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Streams", value: summary.totalStreams || 0, color: "bg-blue-50 text-blue-600" },
                { label: "Total Viewers", value: (summary.totalViewers || 0).toLocaleString(), color: "bg-purple-50 text-purple-600" },
                { label: "Watch Time (min)", value: (summary.totalWatchTime || 0).toLocaleString(), color: "bg-green-50 text-green-600" },
                { label: "Avg Engagement", value: `${(summary.averageEngagementRate || 0).toFixed(1)}%`, color: "bg-orange-50 text-orange-600" },
              ].map((kpi, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                  <p className="text-sm text-gray-500 mb-1">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.color.split(" ")[1]}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4">Viewer Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={topStreams.slice(0, 5).map((s, i) => ({ date: `Stream ${i + 1}`, viewers: s.viewers }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Line type="monotone" dataKey="viewers" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4">Engagement Metrics</h3>
                <div className="space-y-4">
                  {[
                    { label: "Chat Messages", value: engagement.totalChatMessages || 0 },
                    { label: "Likes", value: engagement.totalLikes || 0 },
                    { label: "Shares", value: engagement.totalShares || 0 },
                    { label: "Followers Gained", value: engagement.totalFollowersGained || 0 },
                  ].map((m, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">{m.label}</span>
                        <span className="text-sm font-semibold text-gray-900">{m.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((m.value / 1000) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Weekly Growth</h3>
                <p className="text-2xl font-bold text-blue-600">{trends.weeklyGrowth || 0}%</p>
                <p className="text-xs text-gray-500 mt-1">Week-over-week growth</p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Monthly Growth</h3>
                <p className="text-2xl font-bold text-purple-600">{trends.monthlyGrowth || 0}%</p>
                <p className="text-xs text-gray-500 mt-1">Month-over-month growth</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "engagement" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "💬", label: "Chat Messages", value: engagement.totalChatMessages || 0 },
              { icon: "👍", label: "Total Likes", value: engagement.totalLikes || 0 },
              { icon: "📤", label: "Total Shares", value: engagement.totalShares || 0 },
              { icon: "➕", label: "Followers Gained", value: engagement.totalFollowersGained || 0 },
              { icon: "➖", label: "Followers Lost", value: engagement.totalFollowersLost || 0 },
              { icon: "📈", label: "Net Followers", value: engagement.netFollowersGained || 0 },
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{card.icon}</span>
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={fetchAnalytics} className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition text-sm">
            Refresh Analytics
          </button>
        </div>
      </div>
    );
  })();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? "ml-0" : "ml-64"}`}>
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {content}
        </main>
      </div>
    </div>
  );
}
