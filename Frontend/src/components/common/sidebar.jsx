import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SignOutButton, UserAvatar, UserButton } from "@clerk/react";
import { LayoutDashboard, BarChart2, Settings,Video, Expand,MenuIcon,HelpCircle, EyeIcon, HandCoins } from "lucide-react";
import { Toast } from "./toast";
const Sidebar = ({ isCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { icon: <LayoutDashboard size={18} />, label: "Dashboard", path: "/dashboard" },
    { icon: <BarChart2 size={18} />, label: "Analytics", path: "/analytics" },
    { icon: <MenuIcon size={18} />, label: "Profile", path: "/Profile" },
    { icon: <Settings size={18} />, label: "Settings", path: "/settings" },
    { icon:<Expand size={18}/>,label:"Explore",path:"/Explore"},
    { icon:<EyeIcon size={18}/>,label:"Watch",path:"/Watch"},
    { icon:<HandCoins size={18}/>,label:"Payment",path:"/Payment"},
  ];
  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 z-40 ${
          isCollapsed ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-100 flex-shrink-0">
            <Video size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">StreamX</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1 px-4 py-4 overflow-y-auto">
          {navItems.map((item, i) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={i}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-red-50 text-red-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={`${isActive ? "text-red-500" : "text-gray-400"}`}>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
          <div className="my-4 px-4">
            <div className="h-px bg-gray-100 w-full" />
          </div>

          <button
            onClick={() => navigate("/help")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
          >
            <HelpCircle size={18} className="text-gray-400" />
            Help & Support
          </button>
        </nav>

        {/* User Profile & Footer */}
        <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 shadow-sm">
            <UserButton afterSignOutUrl="/" />
            <div className="flex flex-col min-w-0 overflow-hidden">
               <span className="text-xs font-semibold text-gray-900 truncate">My Profile</span>
               <span className="text-[10px] text-gray-400">Settings</span>
            </div>
          </div>
            <SignOutButton size={16} className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-black transition-all shadow-md"/>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;