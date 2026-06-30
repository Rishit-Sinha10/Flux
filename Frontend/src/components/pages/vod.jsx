import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { vodAPI } from "../../services/apiClient";
import Navbar from "../common/navbar";
import Sidebar from "../common/sidebar";
import { Film, Clock, Eye } from "lucide-react";
export default function VODPage() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [vods, setVods] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchVODs = async () => {
      try {
        const res = await vodAPI.getAll();
        setVods(res.data);
      } catch (err) {
        console.error("Error fetching VODs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVODs();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? "ml-0" : "ml-64"}`}>
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Film size={28} className="text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Recorded Streams</h1>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : vods.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <Film size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg">No recordings yet</p>
                <p className="text-sm mt-1">Stream recordings will appear here after streams end</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {vods.map((vod) => (
                  <button
                    key={vod._id}
                    onClick={() => navigate(`/stream/${vod._id}`)}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all text-left group"
                  >
                    <div className="aspect-video bg-gray-800 flex items-center justify-center relative">
                      <Film size={40} className="text-gray-600" />
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {vod.recordingDuration ? `${Math.round(vod.recordingDuration / 60)}m` : "--"}
                      </span>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-900 truncate">{vod.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {vod.creator?.username || "Unknown"}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye size={12} /> {vod.viewers || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {vod.endedAt ? new Date(vod.endedAt).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
