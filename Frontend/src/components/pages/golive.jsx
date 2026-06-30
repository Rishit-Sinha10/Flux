import { useState, useRef, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import {
  Send,
  Paperclip,
  Tv2,
  ChevronDown,
  Radio,
  Users,
  Eye,
} from "lucide-react";
import { io } from "socket.io-client";
import Hls from "hls.js";
import StreamerAISuggestions from "../chatbot/StreamerAISuggestions";
import apiClient from "../../services/apiClient";
const socket = io("http://localhost:5000");
const RETRY_INTERVAL = 3000;
const LS_KEY = "flux_live_state";

function loadLiveState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLiveState(title, desc, category, isLive, streamId, streamKey) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ title, desc, category, isLive, streamId, streamKey }));
  } catch { /* quota exceeded — ignore */ }
}

function clearLiveState() {
  try { localStorage.removeItem(LS_KEY); } catch { /* ok */ }
}

export default function GoLiveDashboard() {
  const { user } = useUser();
  const saved = loadLiveState();
  const [title, setTitle] = useState(saved?.title || "");
  const [category, setCategory] = useState(saved?.category || "Gaming");
  const [desc, setDesc] = useState(saved?.desc || "");
  const [streamKey, setStreamKey] = useState(saved?.streamKey || "");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLive, setIsLive] = useState(saved?.isLive || false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [streamId, setStreamId] = useState(saved?.streamId || null);
  const [previewError, setPreviewError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const chatEndRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const retryTimerRef = useRef(null);
  const currentUsername = user?.username || user?.fullName || "Streamer";
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (isLive && !streamId) {
      if (!title.trim()) {
        setValidationErrors({ title: "Stream title is required" });
        setIsLive(false);
        return;
      }
      setValidationErrors({});
      const createStream = async () => {
        try {
          const response = await apiClient.post("/streams/create", {
            title: title || "My Stream",
            description: desc,
            category: category,
          });
          setStreamId(response.data._id);
          setStreamKey(response.data.streamKey);
          setMessages([]);
          socket.emit("join-stream", response.data._id);
        } catch (error) {
          console.error("Error creating stream:", error);
          setIsLive(false);
        }
      };
      createStream();
    } else if (!isLive && streamId) {
      const endStream = async () => {
        try {
          await apiClient.put(`/streams/end/${streamId}`);
          socket.emit("leave-stream", streamId);
          clearLiveState();
          setStreamId(null);
          setStreamKey("");
        } catch (error) {
          console.error("Error ending stream:", error);
        }
      };
      endStream();
    }
    saveLiveState(title, desc, category, isLive, streamId, streamKey);
  }, [isLive, streamId, title, desc, category]);
  useEffect(() => {
    if (!streamId) return;
    socket.on("receive-message", (data) => {
      setMessages((prev) => [...prev, data]);
    });
    socket.on("viewer-count", (count) => {
      setViewers(count);
    });
    socket.on("stream-status", (status) => {
      if (status.isLive && status.status === "live") {
        setPreviewError(null);
      }
    });
    return () => {
      socket.off("receive-message");
      socket.off("viewer-count");
      socket.off("stream-status");
    };
  }, [streamId]);
  const cleanupHls = useCallback(() => {
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);
  const startHlsPlayer = useCallback(() => {
    if (!videoRef.current || !streamKey) return;
    const video = videoRef.current;
    const hlsUrl = `http://localhost:8080/live/${streamKey}/index.m3u8`;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    setPreviewError(null);
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setPreviewError(null);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setPreviewError("Waiting for OBS... Connect via RTMP with the key below");
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      video.addEventListener("loadedmetadata", () => video.play().catch(() => {}));
      video.addEventListener("error", () => {
        setPreviewError("Waiting for OBS... Connect via RTMP with the key below");
      });
    } else {
      setPreviewError("HLS not supported in this browser");
    }
  }, [streamKey]);
  useEffect(() => {
    if (!isLive || !streamKey || !videoRef.current) {
      cleanupHls();
      return;
    }
    startHlsPlayer();
    retryTimerRef.current = setInterval(() => {
      if (hlsRef.current) {
        const hls = hlsRef.current;
        if (hls.state && hls.state !== "MEDIA_ATTACHED" && hls.state !== "MANIFEST_PARSED" && hls.state !== "PLAYING") {
          startHlsPlayer();
        }
      }
    }, RETRY_INTERVAL);
    return () => {
      cleanupHls();
    };
  }, [isLive, streamKey, cleanupHls, startHlsPlayer]);
  const handleSend = () => {
    if (!message.trim() || !streamId) return;
    socket.emit("send-message", {
      streamId: streamId,
      message: message,
      user: currentUsername,
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
  const canGoLive = title.trim().length > 0;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {isLive && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                  Live
                </span>
              </>
            )}
            <h1 className="text-2xl font-bold text-gray-900">Go Live</h1>
          </div>
          <p className="text-sm text-gray-500">
            {isLive
              ? "You are live. Stream with OBS using the stream key below."
              : "Configure your stream and go live when ready."}
          </p>
        </div>
        <div className="flex gap-4">
          {isLive && streamKey && !previewError && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Stream Detected
            </span>
          )}
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full text-sm">
            <Eye size={14} className="text-red-500" />
            <span className="text-gray-700 font-medium">{viewers} viewers</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full text-sm">
            <Users size={14} className="text-gray-600" />
            <span className="text-gray-700 font-medium">
              {messages.length} chats
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Live Preview
              </span>
              <Tv2 size={16} className="text-gray-400" />
            </div>
            <div className="relative bg-black h-80 flex items-center justify-center overflow-hidden">
              {isLive && streamKey ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  {previewError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
                      <div className="w-14 h-14 border-2 border-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Tv2 size={24} className="text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-400">{previewError}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Retrying every 3 seconds...
                      </p>
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600/80 text-white px-2 py-1 rounded text-xs font-semibold">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      PREVIEW
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <div className="w-14 h-14 bg-gray-800 border border-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Tv2 size={24} className="text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                    No source connected
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Radio size={14} className="text-red-500" />
              <span className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Stream Settings
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stream Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter stream title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) {
                      setValidationErrors((prev) => ({ ...prev, title: undefined }));
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition ${
                    validationErrors.title ? "border-red-400" : "border-gray-300"
                  }`}
                  disabled={isLive}
                />
                {validationErrors.title && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition appearance-none"
                      disabled={isLive}
                    >
                      <option>Gaming</option>
                      <option>Education</option>
                      <option>Music</option>
                      <option>Tech</option>
                      <option>Just Chatting</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stream Key
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={streamKey}
                      readOnly
                      placeholder={isLive ? "Waiting for stream..." : "Will generate when live"}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                    />
                    {streamKey && (
                      <button
                        onClick={() => navigator.clipboard.writeText(streamKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-500 hover:text-red-600 font-semibold"
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {isLive && streamKey && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">OBS Settings</p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Server:</span>{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs">rtmp://localhost:1935/live</code>
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">Stream Key:</span>{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs">{streamKey}</code>
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Stream description (optional)"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition resize-none"
                  disabled={isLive}
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsLive((v) => !v)}
                  disabled={!canGoLive && !isLive}
                  className={`px-8 py-2 rounded-lg font-bold transition transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none ${
                    isLive
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-red-500 text-white hover:bg-red-600 shadow-md"
                  }`}
                  title={!canGoLive && !isLive ? "Enter a stream title first" : ""}
                >
                  {isLive ? "End Stream" : "Go Live"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-96 lg:h-auto">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Live Chat
            </span>
            <span className="text-xs text-gray-400 font-mono">
              {messages.length} msgs
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400 text-sm mt-4">
                Waiting for viewers to join...
              </p>
            ) : (
              messages.map((msg, i) => {
                const colors = ["#6366f1", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];
                const botColor = colors[(msg.user?.charCodeAt?.(0) ?? i) % colors.length];
                return (
                  <div key={i} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-xs">
                      {msg.sender !== "me" && (
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: botColor }}>
                            {msg.user?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="text-xs text-gray-500 font-medium">{msg.user || "Guest"}</span>
                        </div>
                      )}
                      <div onClick={() => handleSelectMessage(msg)} className={`px-3 py-2 rounded-lg cursor-pointer transition ${
                        msg.sender === "me"
                          ? "bg-red-500 text-white rounded-tr-none"
                          : "bg-gray-100 text-gray-900 rounded-tl-none hover:bg-gray-200"
                      } ${msg.sender !== "me" ? "group" : ""}`}>
                        <p className="text-sm leading-relaxed">{msg.message || msg.text}</p>
                        {msg.sender !== "me" && (
                          <p className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition">
                            Get AI reply
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
                <button onClick={handleSend} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex-shrink-0 disabled:opacity-50" disabled={!isLive}>
                  <Send size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {showAISuggestions && (
        <StreamerAISuggestions
          selectedMessage={selectedMessage}
          streamTitle={title || "My Stream"}
          category={category}
          onSuggestionsClose={() => { setShowAISuggestions(false); setSelectedMessage(null); }}
          onSelectSuggestion={(suggestion) => { setMessage(suggestion); setShowAISuggestions(false); }}
        />
      )}
    </div>
  );
}
