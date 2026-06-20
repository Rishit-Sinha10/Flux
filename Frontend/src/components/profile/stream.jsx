import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import StreamViewerAIPanel from "../chatbot/StreamViewerAIPanel";
import Navbar from "../common/navbar";
import Sidebar from "../common/sidebar";
import { Sparkles, Send } from "lucide-react";

const socket = io("http://localhost:5000");

export default function StreamPage() {
    const { id } = useParams();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [stream, setStream] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [viewers, setViewers] = useState(0);
    const [showAIPanel, setShowAIPanel] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem("user"));
    
    // 🔥 Fetch stream
    useEffect(() => {
        const fetchStream = async () => {
            const res = await fetch(`http://localhost:5000/api/streams/${id}`);
            const data = await res.json();
            setStream(data);
        };

        fetchStream();
    }, [id]);

    // ⚡ Socket logic
    useEffect(() => {
        socket.emit("join-stream", id);

        socket.on("receive-message", (data) => {
            setMessages((prev) => [...prev, data]);
        });

        socket.on("viewer-count", (count) => {
            setViewers(count);
        });

        return () => {
            socket.off("receive-message");
            socket.off("viewer-count");
        };
    }, [id]);

    // 💬 Send message
    const sendMessage = () => {
        if (!input) return;
        socket.emit("send-message", {
            streamId: id,
            message: input,
            user: currentUser?.username || "Guest", // later dynamic
        });

        setInput("");
    };

    if (!stream) return <p>Loading...</p>;

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
                <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    <div className="space-y-6">
                        {/* Stream Title & Info */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{stream.title}</h1>
                            <div className="flex items-center gap-6">
                                <p className="text-gray-600">
                                    <span className="font-semibold">By:</span> {stream.creator?.username || "Unknown"}
                                </p>
                                <p className="text-red-500 font-semibold flex items-center gap-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    🔴 {viewers} watching
                                </p>
                            </div>
                        </div>

                        {/* Main Grid - Video + Chat */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Video Section */}
                            <div className="lg:col-span-2">
                                <div className="bg-black rounded-lg shadow-lg overflow-hidden relative h-96">
                                    <div className="w-full h-full flex items-center justify-center text-white text-lg">
                                        🎥 Live Stream Player
                                    </div>

                                    {/* AI Panel Toggle Button */}
                                    <button
                                        onClick={() => setShowAIPanel(!showAIPanel)}
                                        className="absolute top-4 right-4 px-4 py-2 bg-purple-600 hover:bg-purple-700
                                        text-white rounded-lg flex items-center gap-2 transition text-sm font-medium shadow-lg"
                                        title="Open AI Assistant"
                                    >
                                        <Sparkles size={16} />
                                        AI Assistant
                                    </button>
                                </div>
                            </div>

                            {/* Chat Section */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-96 lg:h-auto">
                                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                                    <h3 className="font-semibold text-gray-900">Live Chat</h3>
                                    <span className="text-xs text-gray-500 font-mono">{messages.length} msgs</span>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {messages.length === 0 ? (
                                        <p className="text-center text-gray-400 text-sm mt-8">No messages yet...</p>
                                    ) : (
                                        messages.map((msg, i) => (
                                            <div key={i} className="space-y-1">
                                                <p className="text-xs font-semibold text-gray-600">{msg.user}</p>
                                                <p className="text-sm text-gray-800 px-3 py-1 bg-gray-100 rounded-lg break-words">
                                                    {msg.message}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Chat Input */}
                                <div className="border-t border-gray-200 p-3 bg-gray-50 flex-shrink-0">
                                    <div className="flex gap-2">
                                        <input
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-sm"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === "Enter") {
                                                    sendMessage();
                                                }
                                            }}
                                            placeholder="Type message..."
                                        />
                                        <button
                                            onClick={sendMessage}
                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-2 text-sm font-medium"
                                        >
                                            <Send size={16} />
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {stream.description && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
                                <p className="text-gray-600">{stream.description}</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* AI Panel */}
            <StreamViewerAIPanel
                isOpen={showAIPanel}
                onClose={() => setShowAIPanel(false)}
                streamTitle={stream?.title || "Stream"}
                category={stream?.category || "Gaming"}
            />
        </div>
    );
}