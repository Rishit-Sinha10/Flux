
import { useState, useMemo } from "react";
// ─── Mock Data ────────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Gaming", "Music", "Education", "Art", "Tech", "IRL", "Sports"];
const STREAMS = [
    {
        id: 1,
        title: "Speedrunning Hollow Knight Any% – Road to World Record",
        streamer: "VoidRunner",
        category: "Gaming",
        viewers: 14832,
        thumbnail: "https://picsum.photos/seed/stream1/640/360",
        avatar: "https://picsum.photos/seed/av1/80/80",
        live: true,
        hot: true,
    },
    {
        id: 2,
        title: "Lo-fi Jazz Session – Chill & Code With Me",
        streamer: "neonkeys",
        category: "Music",
        viewers: 6201,
        thumbnail: "https://picsum.photos/seed/stream2/640/360",
        avatar: "https://picsum.photos/seed/av2/80/80",
        live: true,
        hot: false,
    },
    {
        id: 3,
        title: "CS for Everyone: Algorithms & Data Structures (Free Crash Course)",
        streamer: "CodeWithPriya",
        category: "Education",
        viewers: 9044,
        thumbnail: "https://picsum.photos/seed/stream3/640/360",
        avatar: "https://picsum.photos/seed/av3/80/80",
        live: true,
        hot: true,
    },
    {
        id: 4,
        title: "Digital Oil Painting – Fantasy Landscape from Scratch",
        streamer: "brushstroke_x",
        category: "Art",
        viewers: 3411,
        thumbnail: "https://picsum.photos/seed/stream4/640/360",
        avatar: "https://picsum.photos/seed/av4/80/80",
        live: true,
        hot: false,
    },
    {
        id: 5,
        title: "Building a Full-Stack SaaS in 24 Hours – Day 2",
        streamer: "HackerHouse",
        category: "Tech",
        viewers: 11504,
        thumbnail: "https://picsum.photos/seed/stream5/640/360",
        avatar: "https://picsum.photos/seed/av5/80/80",
        live: true,
        hot: true,
    },
    {
        id: 6,
        title: "Morning Run & Coffee – Chatting With the Community",
        streamer: "just_miles",
        category: "IRL",
        viewers: 2193,
        thumbnail: "https://picsum.photos/seed/stream6/640/360",
        avatar: "https://picsum.photos/seed/av6/80/80",
        live: true,
        hot: false,
    },
    {
        id: 7,
        title: "Chess Grand Master Practice – Open Challenges",
        streamer: "KingMoveKen",
        category: "Sports",
        viewers: 7760,
        thumbnail: "https://picsum.photos/seed/stream7/640/360",
        avatar: "https://picsum.photos/seed/av7/80/80",
        live: true,
        hot: false,
    },
    {
        id: 8,
        title: "React 19 Deep Dive – New Features Live Walkthrough",
        streamer: "devduo",
        category: "Tech",
        viewers: 5329,
        thumbnail: "https://picsum.photos/seed/stream8/640/360",
        avatar: "https://picsum.photos/seed/av8/80/80",
        live: true,
        hot: false,
    },
];

const RECOMMENDED = [
    { id: 1, name: "VoidRunner", followers: "14.2K", avatar: "https://picsum.photos/seed/av1/80/80", verified: true },
    { id: 2, name: "neonkeys", followers: "8.9K", avatar: "https://picsum.photos/seed/av2/80/80", verified: false },
    { id: 3, name: "CodeWithPriya", followers: "21.5K", avatar: "https://picsum.photos/seed/av3/80/80", verified: true },
    { id: 4, name: "brushstroke_x", followers: "5.3K", avatar: "https://picsum.photos/seed/av4/80/80", verified: false },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function formatViewers(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
}

// ─── Category Badge ───────────────────────────────────────────────────────────

const CATEGORY_COLORS = {
    Gaming: { bg: "#1e1b4b", text: "#a5b4fc" },
    Music: { bg: "#1a1a2e", text: "#f9a8d4" },
    Education: { bg: "#042f2e", text: "#6ee7b7" },
    Art: { bg: "#2d1b1b", text: "#fca5a5" },
    Tech: { bg: "#0f172a", text: "#7dd3fc" },
    IRL: { bg: "#1c1917", text: "#fcd34d" },
    Sports: { bg: "#052e16", text: "#86efac" },
};

// ─── Category Badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }) {
    const colors = CATEGORY_COLORS[category] || { bg: "#1e293b", text: "#94a3b8" };
    return (
        <span
            style={{
                display: "inline-block",
                padding: "2px 10px",
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                backgroundColor: colors.bg,
                color: colors.text,
                border: `1px solid ${colors.text}22`,
                whiteSpace: "nowrap",
            }}
        >
            {category}
        </span>
    );
}

// ─── Stream Card ──────────────────────────────────────────────────────────────

function StreamCard({ stream }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                borderRadius: 14,
                overflow: "hidden",
                background: "#ffffff",
                border: "1px solid #f1f5f9",
                boxShadow: hovered
                    ? "0 12px 40px -8px rgba(99,102,241,0.18), 0 4px 16px -4px rgba(0,0,0,0.10)"
                    : "0 1px 6px rgba(0,0,0,0.06)",
                transform: hovered ? "translateY(-3px) scale(1.012)" : "translateY(0) scale(1)",
                transition: "transform 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.22s cubic-bezier(.4,0,.2,1)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Thumbnail */}
            <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                <img
                    src={stream.thumbnail}
                    alt={stream.title}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        transform: hovered ? "scale(1.04)" : "scale(1)",
                        transition: "transform 0.35s cubic-bezier(.4,0,.2,1)",
                    }}
                />
                {/* LIVE pill */}
                <span
                    style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        background: "#ef4444",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        padding: "3px 9px",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                    }}
                >
                    <span
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#fff",
                            display: "inline-block",
                            animation: "livePulse 1.4s infinite",
                        }}
                    />
                    LIVE
                </span>
                {/* Viewer count */}
                <span
                    style={{
                        position: "absolute",
                        bottom: 8,
                        right: 10,
                        background: "rgba(0,0,0,0.62)",
                        backdropFilter: "blur(4px)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                    }}
                >
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    {formatViewers(stream.viewers)}
                </span>
                {stream.hot && (
                    <span
                        style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            background: "linear-gradient(135deg,#f97316,#ef4444)",
                            color: "#fff",
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 6,
                        }}
                    >
                        🔥 Hot
                    </span>
                )}
            </div>

            {/* Card body */}
            <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <img
                        src={stream.avatar}
                        alt={stream.streamer}
                        style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #e0e7ff" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                            style={{
                                margin: 0,
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#0f172a",
                                lineHeight: 1.35,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {stream.title}
                        </p>
                        <p style={{ margin: "3px 0 0", fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                            {stream.streamer}
                        </p>
                    </div>
                </div>
                <CategoryBadge category={stream.category} />
            </div>
        </div>
    );
}
// ─── Sidebar: Category Filter ─────────────────────────────────────────────────
function CategoryFilter({ selected, onSelect }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {CATEGORIES.map((cat) => {
                const active = selected === cat;
                return (
                    <button
                        key={cat}
                        onClick={() => onSelect(cat)}
                        style={{
                            textAlign: "left",
                            padding: "9px 14px",
                            borderRadius: 10,
                            border: active ? "1.5px solid #6366f1" : "1.5px solid transparent",
                            background: active ? "#eef2ff" : "transparent",
                            color: active ? "#4f46e5" : "#475569",
                            fontWeight: active ? 700 : 500,
                            fontSize: 14,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            lineHeight: 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!active) e.currentTarget.style.background = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                            if (!active) e.currentTarget.style.background = "transparent";
                        }}
                    >
                        {cat}
                        {active && (
                            <span style={{ fontSize: 12, background: "#6366f1", color: "#fff", borderRadius: 4, padding: "1px 6px" }}>
                                {cat === "All"
                                    ? STREAMS.length
                                    : STREAMS.filter((s) => s.category === cat).length}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
// ─── Sidebar: Recommended Streamer ───────────────────────────────────────────
function RecommendedCard({ streamer }) {
    const [following, setFollowing] = useState(false);

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderBottom: "1px solid #f1f5f9",
            }}
        >
            <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                    src={streamer.avatar}
                    alt={streamer.name}
                    style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid #e0e7ff" }}
                />
                <span
                    style={{
                        position: "absolute",
                        bottom: 1,
                        right: 1,
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: "#22c55e",
                        border: "2px solid #fff",
                    }}
                />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {streamer.name}
                </p>
                <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8" }}>
                    {streamer.followers} followers · {streamer.category}
                </p>
            </div>
            <button
                onClick={() => setFollowing((f) => !f)}
                style={{
                    flexShrink: 0,
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: following ? "1.5px solid #6366f1" : "1.5px solid #e2e8f0",
                    background: following ? "#eef2ff" : "#fff",
                    color: following ? "#4f46e5" : "#64748b",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                }}
            >
                {following ? "✓ Following" : "+ Follow"}
            </button>
        </div>
    );
}
// ─── Search Bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange }) {
    return (
        <div style={{ position: "relative" }}>
            <svg
                width="17"
                height="17"
                fill="none"
                stroke="#94a3b8"
                strokeWidth={2}
                viewBox="0 0 24 24"
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
                type="text"
                placeholder="Search streams, games, or streamers…"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: "100%",
                    padding: "11px 16px 11px 42px",
                    borderRadius: 12,
                    border: "1.5px solid #e2e8f0",
                    background: "#fff",
                    fontSize: 14,
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
                onFocus={(e) => {
                    e.target.style.borderColor = "#6366f1";
                    e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
                }}
                onBlur={(e) => {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                }}
            />
            {value && (
                <button
                    onClick={() => onChange("")}
                    style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "#e2e8f0",
                        border: "none",
                        borderRadius: "50%",
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#64748b",
                        fontSize: 13,
                        lineHeight: 1,
                        padding: 0,
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
}
// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Explore() {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    const filtered = useMemo(() => {
        return STREAMS.filter((s) => {
            const matchCat = activeCategory === "All" || s.category === activeCategory;
            const q = search.trim().toLowerCase();
            const matchSearch =
                !q ||
                s.title.toLowerCase().includes(q) ||
                s.streamer.toLowerCase().includes(q) ||
                s.category.toLowerCase().includes(q);
            return matchCat && matchSearch;
        });
    }, [search, activeCategory]);

    return (
        <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #f8faff 0%, #f1f5ff 50%, #fafafa 100%)", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", padding: "28px 24px 48px", boxSizing: "border-box" }}>
            {/* ── Global keyframe for live pulse ── */}
            <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.35); }
        }
        @media (max-width: 768px) {
          .explore-grid { grid-template-columns: 1fr !important; }
          .explore-sidebar { order: -1; }
        }
      `}</style>

            {/* ── Page header ── */}
            <header style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#ef4444",
                            animation: "livePulse 1.4s infinite",
                        }}
                    />
                    <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                        Explore Live
                    </h1>
                </div>
                <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
                    {STREAMS.length} streams live right now
                </p>
            </header>

            {/* ── Search bar ── */}
            <div style={{ marginBottom: 28, maxWidth: 720 }}>
                <SearchBar value={search} onChange={setSearch} />
            </div>

            {/* ── Two-column grid ── */}
            <div
                className="explore-grid"
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 300px",
                    gap: 28,
                    alignItems: "start",
                }}
            >
                {/* ── LEFT: stream feed ── */}
                <section>
                    {filtered.length > 0 ? (
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                gap: 18,
                            }}
                        >
                            {filtered.map((stream) => (
                                <StreamCard key={stream.id} stream={stream} />
                            ))}
                        </div>
                    ) : (
                        <div
                            style={{
                                padding: "60px 24px",
                                textAlign: "center",
                                color: "#94a3b8",
                                background: "#fff",
                                borderRadius: 16,
                                border: "1.5px dashed #e2e8f0",
                            }}
                        >
                            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#475569" }}>
                                No streams found
                            </p>
                            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
                                Try a different search or category
                            </p>
                        </div>
                    )}
                </section>

                {/* ── RIGHT: sidebar ── */}
                <aside className="explore-sidebar" style={{ height: "fit-content", position: "sticky", top: 28 }}>
                    {/* Categories */}
                    <section
                        style={{
                            background: "#fff",
                            borderRadius: 16,
                            border: "1px solid #f1f5f9",
                            boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                            padding: "18px 16px",
                            marginBottom: 20,
                        }}
                    >
                        <h2
                            style={{
                                margin: "0 0 12px",
                                fontSize: 13,
                                fontWeight: 800,
                                color: "#94a3b8",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                            }}
                        >
                            Categories
                        </h2>
                        <CategoryFilter selected={activeCategory} onSelect={setActiveCategory} />
                    </section>

                    {/* Recommended streamers */}
                    <section
                        style={{
                            background: "#fff",
                            borderRadius: 16,
                            border: "1px solid #f1f5f9",
                            boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                            padding: "18px 16px",
                        }}
                    >
                        <h2
                            style={{
                                margin: "0 0 4px",
                                fontSize: 13,
                                fontWeight: 800,
                                color: "#94a3b8",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                            }}
                        >
                            Recommended
                        </h2>
                        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#cbd5e1" }}>Popular streamers to follow</p>
                        {RECOMMENDED.map((s) => (
                            <RecommendedCard key={s.id} streamer={s} />
                        ))}
                    </section>
                </aside>
            </div>
        </div>
    );
}