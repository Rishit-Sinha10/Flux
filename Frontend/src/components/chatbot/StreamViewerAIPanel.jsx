import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, AlertCircle } from "lucide-react";
import useChatbot from "./useChatbot";

/**
 * Stream Viewer AI Panel - appears in StreamPlayer.jsx
 * Allows viewers to ask AI questions related to the stream
 */
export default function StreamViewerAIPanel({
  isOpen,
  onClose,
  streamTitle = "Stream",
  category = "Gaming",
}) {
  const { messages, input, setInput, sendMessage, loading } = useChatbot();

  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendWithContext = async () => {
    if (!input.trim() || loading) return;

    // Add context to the message
    const contextualMessage = `[Stream: ${streamTitle} | Category: ${category}] ${input}`;
    setInput(contextualMessage);

    // Let useChatbot send it
    setTimeout(sendMessage, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendWithContext();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-0 right-0 z-50 w-full sm:w-96 h-screen sm:h-[600px]
      bg-white/10 backdrop-blur-xl border-l border-white/20 shadow-2xl 
      flex flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-blue-500/20">
        <div className="flex items-center gap-2">
          <Sparkles className="text-yellow-400" size={20} />
          <div>
            <h3 className="text-white font-semibold text-sm">Stream Assistant</h3>
            <p className="text-xs text-white/60">{streamTitle}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-black opacity-70 hover:opacity-100 transition p-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* Info Box */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-start gap-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-black-200">
            Ask questions about the stream, get tips, or discuss the topic!
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                msg.sender === "user"
                  ? "bg-purple-600/70 text-black rounded-br-none"
                  : "bg-white/20 text-black rounded-bl-none border border-white/20"
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/20 border border-white/20 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-black/60 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-black/60 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Questions */}
      <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-white/10 bg-white/5">
        {[
          "Stream tips?",
          "Category insights?",
          "Engagement ideas?",
        ].map((q, idx) => (
          <button
            key={idx}
            onClick={() => {
              setInput(q);
              setTimeout(sendMessage, 0);
            }}
            className="text-xs px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 
            text-white transition disabled:opacity-50"
            disabled={loading}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-4 bg-white/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something..."
            className="flex-1 px-4 py-2 rounded-lg bg-white/20 border border-white/30 
            text-black placeholder-white/50 outline-none focus:border-purple-400 transition"
            disabled={loading}
          />
          <button
            onClick={handleSendWithContext}
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg bg-purple-600/70 hover:bg-purple-600 
            text-black disabled:opacity-50 transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
