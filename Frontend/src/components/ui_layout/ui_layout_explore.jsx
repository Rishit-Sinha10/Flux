import { useState } from "react";
import Navbar from "../common/navbar";
import Sidebar from "../common/sidebar";
import Explore from "../pages/explore";
import ChatbotWidget from "../chatbot/chatbot_widget";

export default function ExploreLayout() {
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
          <Explore />
        </main>
      </div>      
      {/* Chatbot Widget */}
      <ChatbotWidget/>
    </div>
  );
}
