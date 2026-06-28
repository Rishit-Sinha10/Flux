import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { analyticsAPI } from "../../services/apiClient";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export default function AnalyticsDashboard() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
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
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4 mx-auto"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-6xl mb-6">&#9888;&#65039;</div>
          <h2 className="text-2xl font-bold text-white mb-4">Analytics Unavailable</h2>
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 text-red-300 mb-6 text-sm leading-relaxed">
            {error}
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-400">No analytics data available yet.</p>
          <p className="text-slate-500 text-sm mt-2">Start streaming to see your analytics here!</p>
        </div>
      </div>
    );
  }

  const summary = report.summary || {};
  const engagement = report.engagement || {};
  const topStreams = report.topPerformingStreams || [];
  const trends = report.trends || {};
  const deviceBreakdown = report.deviceBreakdown || {};
  const categoryData = report.categoryData || [];
  const topRegions = report.topRegions || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-slate-400">
            Comprehensive insights into your streaming performance
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-slate-700 overflow-x-auto">
          {["overview", "engagement","streams"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold transition border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? "text-blue-400 border-blue-500"
                  : "text-slate-400 border-transparent hover:text-slate-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                icon="🎬"
                label="Total Streams"
                value={summary.totalStreams || 0}
                trend="+0%"
              />
              <KPICard
                icon="👥"
                label="Total Viewers"
                value={(summary.totalViewers || 0).toLocaleString()}
                trend="+0%"
              />
              <KPICard
                icon="⏱"
                label="Watch Time (min)"
                value={(summary.totalWatchTime || 0).toLocaleString()}
                trend="+0%"
              />
              <KPICard
                icon="📊"
                label="Avg Engagement"
                value={`${(summary.averageEngagementRate || 0).toFixed(1)}%`}
                trend="+0%"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Viewers Trend */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Viewer Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={topStreams.slice(0, 5).map((s, i) => ({
                      date: `Stream ${i + 1}`,
                      viewers: s.viewers,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Line type="monotone" dataKey="viewers" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Engagement Rate */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Engagement Metrics</h3>
                <div className="space-y-4">
                  <EngagementBar label="Chat Messages" value={engagement.totalChatMessages || 0} />
                  <EngagementBar label="Likes" value={engagement.totalLikes || 0} />
                  <EngagementBar label="Shares" value={engagement.totalShares || 0} />
                  <EngagementBar
                    label="Followers Gained"
                    value={engagement.totalFollowersGained || 0}
                  />
                </div>
              </div>
            </div>

            {/* Growth Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-2">Weekly Growth</h3>
                <p className="text-3xl font-bold text-blue-400">
                  {trends.weeklyGrowth || 0}%
                </p>
                <p className="text-slate-400 text-sm mt-2">Week-over-week growth</p>
              </div>
              <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-2">Monthly Growth</h3>
                <p className="text-3xl font-bold text-purple-400">
                  {trends.monthlyGrowth || 0}%
                </p>
                <p className="text-slate-400 text-sm mt-2">Month-over-month growth</p>
              </div>
            </div>
          </div>
        )}

        {/* Engagement Tab */}
        {activeTab === "engagement" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EngagementCard
                icon="💬"
                label="Chat Messages"
                value={engagement.totalChatMessages || 0}
              />
              <EngagementCard
                icon="👍"
                label="Total Likes"
                value={engagement.totalLikes || 0}
              />
              <EngagementCard
                icon="📤"
                label="Total Shares"
                value={engagement.totalShares || 0}
              />
              <EngagementCard
                icon="➕"
                label="Followers Gained"
                value={engagement.totalFollowersGained || 0}
              />
              <EngagementCard
                icon="➖"
                label="Followers Lost"
                value={engagement.totalFollowersLost || 0}
              />
              <EngagementCard
                icon="📈"
                label="Net Followers"
                value={engagement.netFollowersGained || 0}
              />
            </div>
          </div>
        )}
        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchAnalytics}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            Refresh Analytics
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function KPICard({ icon, label, value, trend }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-blue-600 transition">
      <div className="flex items-start justify-between mb-2">
        <p className="text-slate-400 text-sm">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {trend && <p className="text-green-400 text-xs mt-2">{trend} from last period</p>}
    </div>
  );
}

function EngagementBar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-slate-300 text-sm">{label}</span>
        <span className="text-white font-semibold">{value.toLocaleString()}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full"
          style={{
            width: `${Math.min((value / 1000) * 100, 100)}%`,
          }}
        ></div>
      </div>
    </div>
  );
}
function EngagementCard({ icon, label, value }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}