import { useState } from "react";
/**
 * Enhanced hook for AI assistance specifically in streaming context
 * Allows streamer to get suggestions for responding to chat messages
 */
export default function useStreamAssistant() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthToken = () => localStorage.getItem("token");

  /**
   * Get AI suggestions for responding to a specific chat message
   * @param {string} message - The chat message from viewer
   * @param {string} streamTitle - Current stream title for context
   * @param {string} category - Stream category for context
   */
  const getSuggestions = async (message, streamTitle = "", category = "") => {
    if (!message.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      // Add stream context to make suggestions more relevant
      const contextualPrompt = `
You are a helpful streaming assistant. A viewer sent this message during a ${category} stream titled "${streamTitle}":
"${message}"

Suggest 3 brief, engaging response options (2-15 words each) that the streamer could use to reply. 
Format as a JSON array with "responses" key like: {"responses": ["Option 1", "Option 2", "Option 3"]}
      `.trim();

      const response = await fetch(`${apiUrl}/gemini/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ message: contextualPrompt }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(errData.error || `Error ${response.status}`);
      }

      const data = await response.json();

      // Parse the response to extract suggestions
      try {
        const parsed = JSON.parse(data.reply);
        setSuggestions(parsed.responses || []);
      } catch {
        // If response isn't JSON, extract suggestions from text
        const responseText = data.reply || "";
        const suggestionsList = responseText
          .split(/[\n\d.•\-]/i)
          .filter(s => s.trim().length > 0)
          .slice(0, 3);
        setSuggestions(suggestionsList);
      }
    } catch (err) {
      console.error("Stream Assistant Error:", err);
      setError(err.message || "Failed to get suggestions");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ask a general question about streaming strategy
   * @param {string} question - Question about streaming
   */
  const askStreamingQuestion = async (question) => {
    if (!question.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      const contextualQuestion = `You are a professional streaming mentor. Answer this concisely: ${question}`;

      const response = await fetch(`${apiUrl}/gemini/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ message: contextualQuestion }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      return data.reply;
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clearSuggestions = () => setSuggestions([]);

  return {
    suggestions,
    loading,
    error,
    getSuggestions,
    askStreamingQuestion,
    clearSuggestions,
  };
}
