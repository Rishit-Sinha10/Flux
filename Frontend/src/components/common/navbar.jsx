import { Bell, Menu, Video } from "lucide-react";
import SmartSearchBar from "./searchbar";
import { Link } from "react-router-dom";
export default function Navbar({ isCollapsed, setIsCollapsed }) {
  return (
    <nav className="w-full bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm h-16">
      
      {/* LEFT - Toggle */}
      <div className="flex items-center gap-2 w-12 flex-shrink-0">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900 focus:outline-none"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu size={20} />
        </button>
      </div>

      {/* CENTER - Search Bar */}
      <div className="flex-1 flex items-center justify-center min-w-0">
        <div className="w-full max-w-md">
          <SmartSearchBar />
        </div>
      </div>

      {/* RIGHT - Actions */}
      <div className="flex items-center justify-end gap-4 text-gray-500 flex-shrink-0 ml-4">
        <Link to="/Live">
          <button className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors border border-red-100 shadow-sm whitespace-nowrap">
            <Video size={16} />
            <span className="hidden sm:inline">Go Live</span>
          </button>
        </Link>
        
        <button className="p-2 rounded-full hover:bg-gray-100 relative transition-colors flex-shrink-0">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </nav>
  );
}