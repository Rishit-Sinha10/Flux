import { useState } from "react";
export default function useChatbot() {
  const [messages, setMessages] = useState([
    { text: "Hi 👋 I'm your AI Assistant! What can I help you with today?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const getAuthToken = () => localStorage.getItem("token");
  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    const userMsg = { text: userText, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const token = getAuthToken();
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/gemini/chat`, { // ✅ FIXED ROUTE
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }), // ✅ cleaner
        },
        body: JSON.stringify({ message: userText }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }

        throw new Error(errData.error || `Error ${response.status}`);
      }
      const data = await response.json();

      // ✅ FIXED: Gemini backend returns `reply`
      const botReply = data.reply || "No response from AI.";
      setMessages((prev) => [
        ...prev,
        { text: botReply, sender: "bot" },
      ]);
    } catch (err) {
      console.error("Chatbot Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          text: err.message || "⚠️ Failed to connect to AI",
          sender: "bot",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  return { messages, input, setInput, sendMessage, loading };
}