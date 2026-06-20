import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Tv2, ChevronDown, Radio, Users, Eye } from "lucide-react";
import { io } from "socket.io-client";
import StreamerAISuggestions from "../chatbot/StreamerAISuggestions";

const socket = io("http://localhost:5000");

export default function GoLiveDashboard() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Gaming");
  const [desc, setDesc] = useState("");
  const [streamKey, setStreamKey] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [streamId, setStreamId] = useState(null);
  const chatEndRef = useRef(null);
  const { streamKey1, rtmpUrl } = response.data;
  const currentUser = JSON.parse(localStorage.getItem("user")) || { username: "Streamer" };
  useEffect( () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  // 🔥 Handle going live - Create or join stream
  useEffect(() => {
    if (isLive && !streamId) {
      // Create a new stream when going live
      const createStream = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/streams/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              title: title || "My Stream",
              description: desc,
              category: category,
            }),
          });
          const data = await response.json();
          setStreamId(data._id);
          setMessages([]); // Clear messages for new stream
          // Join the stream via Socket.IO
          socket.emit("join-stream", data._id);
        } catch (error) {
          console.error("Error creating stream:", error);
        }
      };
      createStream();
    } else if (!isLive && streamId) {
      // End stream when going offline
      const endStream = async () => {
        try {
          await fetch(`http://localhost:5000/api/streams/${streamId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          });
          socket.emit("leave-stream", streamId);
          setStreamId(null);
        } catch (error) {
          console.error("Error ending stream:", error);
        }
      };
      endStream();
    }
  }, [isLive, streamId, title, desc, category]);

  // ⚡ Socket.IO listeners for real-time chat and viewer count
  useEffect(() => {
    if (!streamId) return;

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
  }, [streamId]);

  // 💬 Send message via Socket.IO
  const handleSend = () => {
    if (!message.trim() || !streamId) return;

    socket.emit("send-message", {
      streamId: streamId,
      message: message,
      user: currentUser?.username || "Streamer",
      sender: "me",
    });
    setMessage("");
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };
  const handleSelectMessage = (msg) => {
    if (msg.sender !== "me") {
      setSelectedMessage(msg.text);
      setShowAISuggestions(true);
    }
  };
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {isLive && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Live</span>
              </>
            )}
            <h1 className="text-2xl font-bold text-gray-900">Go Live</h1>
          </div>
          <p className="text-sm text-gray-500">Manage your stream settings and interact with viewers</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full text-sm">
            <Eye size={14} className="text-red-500" />
            <span className="text-gray-700 font-medium">{viewers} viewers</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full text-sm">
            <Users size={14} className="text-gray-600" />
            <span className="text-gray-700 font-medium">{messages.length} chats</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Preview & Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Preview Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Preview</span>
              <Tv2 size={16} className="text-gray-400" />
            </div>
            <div className="bg-gradient-to-br from-gray-100 to-gray-50 h-80 flex items-center justify-center relative overflow-hidden">
              {/* Grid Pattern Background */}
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `radial-gradient(circle, #ddd 1px, transparent 1px)`,
                  backgroundSize: "24px 24px",
                }}
              ></div>

              {/* No Source Message */}
              <div className="relative z-10 text-center">
                <div className="w-14 h-14 bg-white border border-gray-300 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                  <Tv2 size={24} className="text-gray-400" />
                </div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">No source connected</p>
              </div>
            </div>
          </div>

          {/* Stream Settings Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Radio size={14} className="text-red-500" />
              <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Stream Settings</span>
            </div>

            <div className="space-y-4">
              {/* Stream Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stream Title</label>
                <input
                  type="text"
                  placeholder="Enter stream title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Category & Stream Key */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition appearance-none"
                    >
                      <option>Gaming</option>
                      <option>Education</option>
                      <option>Music</option>
                      <option>Tech</option>
                      <option>Just Chatting</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stream Key</label>
                  <input
                    type="text"
                    placeholder="Your stream key"
                    value={streamKey}
                    onChange={(e) => setStreamKey(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition font-mono text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  placeholder="Stream description (optional)"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>

              {/* Go Live Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsLive((v) => !v)}
                  className={`px-8 py-2 rounded-lg font-bold transition transform hover:scale-105 ${isLive
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-red-500 text-white hover:bg-red-600 shadow-md"
                    }`}
                >
                  {isLive ? "⏹ End Stream" : "● Go Live"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Live Chat */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-96 lg:h-auto">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Live Chat</span>
            <span className="text-xs text-gray-400 font-mono">{messages.length} msgs</span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-4">Waiting for viewers to join...</p>
            ) : (
              messages.map((msg, i) => {
                const colors = ["#6366f1", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];
                const botColor = colors[(msg.user?.charCodeAt?.(0) ?? i) % colors.length];

                return (
                  <div key={i} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <div className={msg.sender === "me" ? "max-w-xs" : "max-w-xs"}>
                      {msg.sender !== "me" && (
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: botColor }}
                          >
                            {msg.user?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="text-xs text-gray-500 font-medium">{msg.user || "Guest"}</span>
                        </div>
                      )}
                      <div
                        onClick={() => handleSelectMessage(msg)}
                        className={`px-3 py-2 rounded-lg cursor-pointer transition ${msg.sender === "me"
                            ? "bg-red-500 text-white rounded-tr-none"
                            : "bg-gray-100 text-gray-900 rounded-tl-none hover:bg-gray-200"
                          } ${msg.sender !== "me" ? "group" : ""}`}
                      >
                        <p className="text-sm leading-relaxed">{msg.message || msg.text}</p>
                        {msg.sender !== "me" && (
                          <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition">
                            💡 Get AI reply
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-200 p-3 flex items-center gap-2 bg-gray-50">
            {!isLive ? (
              <div className="w-full text-center py-2 text-sm text-gray-500">
                Go live to enable chat
              </div>
            ) : (
              <>
                <label htmlFor="fileUpload" className="cursor-pointer text-gray-400 hover:text-gray-600 transition flex-shrink-0">
                  <Paperclip size={18} />
                </label>
                <input type="file" id="fileUpload" className="hidden" />
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Say something..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition text-sm"
                  disabled={!isLive}
                />
                <button
                  onClick={handleSend}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex-shrink-0 disabled:opacity-50"
                  disabled={!isLive}
                >
                  <Send size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {showAISuggestions && (
        <StreamerAISuggestions
          selectedMessage={selectedMessage}
          streamTitle={title || "My Stream"}
          category={category}
          onSuggestionsClose={() => {
            setShowAISuggestions(false);
            setSelectedMessage(null);
          }}
          onSelectSuggestion={(suggestion) => {
            setMessage(suggestion);
            setShowAISuggestions(false);
          }}
        />
      )}
    </div>
  );
}