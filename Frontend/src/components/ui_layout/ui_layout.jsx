import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../common/navbar";
import Sidebar from "../common/sidebar";
import Dashboard from "../pages/dashboard";
import ChatbotWidget from "../chatbot/chatbot_widget";
export default function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      {/* Main Section */}
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-0" : "ml-64"
        }`}
      >
        {/* Navbar */}
        <Navbar 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
        />
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Dashboard />
        </main>
      </div>
      {/*Footer8*/}
      <ChatbotWidget/>
    </div>
  );
}