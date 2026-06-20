import { useState, useCallback } from 'react'

/**
 * SmartSearchBar - Advanced search with filters and smart suggestions
 */
export default function SmartSearchBar({
    search,
    onSearchChange,
    availableTags = []
}) {
    const [showFilters, setShowFilters] = useState(false)
    const [suggestions, setSuggestions] = useState([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    
    const applySuggestion = useCallback((suggestion) => {
        onSearchChange(suggestion)
        setShowSuggestions(false)
    }, [onSearchChange])
    
    const handleSearchChange = useCallback((value) => {
        onSearchChange(value)
        if (value.length > 1) {
            const lowerValue = value.toLowerCase()
            const tagMatches = availableTags
                .filter(tag => tag.toLowerCase().includes(lowerValue))
                .map(tag => `#${tag}`)
            const newSuggestions = tagMatches.slice(0, 3)
            setSuggestions(newSuggestions)
            setShowSuggestions(true)
        } else {
            setSuggestions([])
            setShowSuggestions(false)
        }
    }, [onSearchChange, availableTags])
    return (
        <div className="flex items-center gap-2 w-full max-w-md">

            {/* Search Box */}
            <div className="flex-1 relative">
                <input
                    type="text"
                    placeholder="Search streams..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => search && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />

                {/* Search Icon */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    🔍
                </div>

                {/* Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                        {suggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => applySuggestion(suggestion)}
                                className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Filter Button */}
            <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition flex items-center gap-1 shadow-sm ${showFilters
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
            >
                ⚙
            </button>

        </div>
    )
}