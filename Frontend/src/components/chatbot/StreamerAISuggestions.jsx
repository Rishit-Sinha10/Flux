import { Sparkles, X, Copy, Loader } from "lucide-react";
import { useState } from "react";
import useStreamAssistant from "./useStreamAssistant";

/**
 * AI Suggestions Panel for Streamer - appears in golive.jsx
 * Shows suggested responses to chat messages from viewers
 */
export default function StreamerAISuggestions({
  selectedMessage,
  streamTitle,
  category,
  onSuggestionsClose,
}) {
  const { suggestions, loading, error, getSuggestions, clearSuggestions } =
    useStreamAssistant();
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!selectedMessage) return null;

  const handleGetSuggestions = () => {
    getSuggestions(selectedMessage, streamTitle, category);
  };

  const handleCopySuggestion = (suggestion) => {
    navigator.clipboard.writeText(suggestion);
    setCopiedIndex(suggestion);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div
      className="fixed bottom-24 right-6 z-50 w-96 max-h-[500px]
      bg-white/10 backdrop-blur-xl border border-white/20
      rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/20 to-blue-500/20">
        <div className="flex items-center gap-2">
          <Sparkles className="text-yellow-400" size={20} />
          <h3 className="text-white font-semibold text-sm">AI Suggestions</h3>
        </div>
        <button
          onClick={() => {
            onSuggestionsClose?.();
            clearSuggestions();
          }}
          className="text-white opacity-70 hover:opacity-100 transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Viewer Message Preview */}
      <div className="p-4 border-b border-white/10 bg-white/5">
        <p className="text-xs text-white/70 font-medium mb-2">Viewer says:</p>
        <p className="text-sm text-black bg-white/10 p-2 rounded italic border-l-2 border-purple-400">
          "{selectedMessage}"
        </p>
      </div>

      {/* Suggestions Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!suggestions.length && !loading && (
          <button
            onClick={handleGetSuggestions}
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 
            hover:from-purple-700 hover:to-blue-700 text-white rounded-lg 
            font-medium text-sm transition disabled:opacity-50"
          >
            {loading ? "Generating..." : "💡 Get Suggestions"}
          </button>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader className="text-purple-400 animate-spin" size={24} />
            <span className="ml-2 text-black/70 text-sm">Getting suggestions...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-xs text-red-200">{error}</p>
          </div>
        )}

        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className="p-3 bg-white/10 border border-white/20 rounded-lg 
            hover:bg-white/15 group transition cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-black flex-1">{suggestion}</p>
              <button
                onClick={() => handleCopySuggestion(suggestion)}
                className="opacity-0 group-hover:opacity-100 transition p-1.5 
                hover:bg-white/20 rounded"
                title="Copy suggestion"
              >
                <Copy size={16} className="text-white/70" />
              </button>
            </div>
            {copiedIndex === suggestion && (
              <p className="text-xs text-green-400 mt-1">✓ Copied!</p>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      {suggestions.length > 0 && (
        <div className="border-t border-white/10 p-3 flex gap-2 bg-white/5">
          <button
            onClick={() => clearSuggestions()}
            className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white 
            rounded text-xs font-medium transition"
          >
            Clear
          </button>
          <button
            onClick={handleGetSuggestions}
            disabled={loading}
            className="flex-1 py-2 px-3 bg-purple-600/50 hover:bg-purple-600/70 text-white 
            rounded text-xs font-medium transition disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
