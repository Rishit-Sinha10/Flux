
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { streamAPI } from "../../services/apiClient";
const CATEGORIES = ["All", "Gaming", "Music", "Education", "Art", "Tech", "IRL", "Sports"];
const CATEGORY_COLORS = {
    Gaming: { bg: "#1e1b4b", text: "#a5b4fc" },
    Music: { bg: "#1a1a2e", text: "#f9a8d4" },
    Education: { bg: "#042f2e", text: "#6ee7b7" },
    Art: { bg: "#2d1b1b", text: "#fca5a5" },
    Tech: { bg: "#0f172a", text: "#7dd3fc" },
    IRL: { bg: "#1c1917", text: "#fcd34d" },
    Sports: { bg: "#052e16", text: "#86efac" },
};

function formatViewers(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
}

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

function StreamCard({ stream, onClick }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onClick={onClick}
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
                    src={stream.thumbnail || `https://picsum.photos/seed/${stream._id}/640/360`}
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
                    {formatViewers(stream.viewers || 0)}
                </span>
            </div>

            {/* Card body */}
            <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <img
                    src={stream.creator?.avatarUrl || `https://picsum.photos/seed/${stream._id}/80/80`}
                    alt={stream.creator?.username || "Streamer"}
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
                        {stream.creator?.username || "Unknown"}
                    </p>
                    </div>
                </div>
                <CategoryBadge category={stream.category} />
            </div>
        </div>
    );
}
// ─── Sidebar: Category Filter ─────────────────────────────────────────────────
function CategoryFilter({ selected, onSelect, streams }) {
    const streamList = streams || [];
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {CATEGORIES.map((cat) => {
                const active = selected === cat;
                const count = cat === "All"
                    ? streamList.length
                    : streamList.filter((s) => s.category === cat).length;
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
                        <span style={{ fontSize: 12, color: active ? "#6366f1" : "#94a3b8", borderRadius: 4, padding: "1px 6px" }}>
                            {count}
                        </span>
                    </button>
                );
            })}
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
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [streams, setStreams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const fetch = async () => {
            try {
                const res = await streamAPI.getLiveStreams();
                if (!cancelled) setStreams(res.data);
            } catch (err) {
                console.error("Failed to fetch live streams:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetch();
        return () => { cancelled = true; };
    }, []);

    const filtered = useMemo(() => {
        return streams.filter((s) => {
            const matchCat = activeCategory === "All" || s.category === activeCategory;
            const q = search.trim().toLowerCase();
            const matchSearch =
                !q ||
                s.title.toLowerCase().includes(q) ||
                (s.creator?.username || "").toLowerCase().includes(q) ||
                s.category.toLowerCase().includes(q);
            return matchCat && matchSearch;
        });
    }, [search, activeCategory, streams]);

    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(160deg, #f8faff 0%, #f1f5ff 50%, #fafafa 100%)",
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
          padding: "28px 24px 48px",
          boxSizing: "border-box",
        }}
      >
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#ef4444",
                animation: "livePulse 1.4s infinite",
              }}
            />
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.5px",
              }}
            >
              Explore Live
            </h1>
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
            {loading ? "..." : streams.length} streams live right now
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
                  <StreamCard
                    key={stream._id}
                    stream={stream}
                    onClick={() => navigate(`/stream/${stream._id}`)}
                  />
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
                <p
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  No streams found
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 13 }}>
                  Try a different search or category
                </p>
              </div>
            )}
          </section>

          {/* ── RIGHT: sidebar ── */}
          <aside
            className="explore-sidebar"
            style={{
              position: "sticky",
              top: "80px", // navbar height + some spacing
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              alignSelf: "flex-start",
            }}
          >
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
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                Categories
              </h2>
              <CategoryFilter
                selected={activeCategory}
                onSelect={setActiveCategory}
                streams={streams}
              />
            </section>

            {/* Popular streamers */}
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
                Live Now
              </h2>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#cbd5e1" }}>
                Streamers currently live
              </p>
              {streams.slice(0, 6).map((s) => {
                const name = s.creator?.username || "Unknown";
                return (
                  <div
                    key={s._id}
                    onClick={() => navigate(`/stream/${s._id}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 0",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img
                        src={s.creator?.avatarUrl || `https://picsum.photos/seed/${s._id}/80/80`}
                        alt={name}
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
                        {name}
                      </p>
                      <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8" }}>
                        {s.category} · {formatViewers(s.viewers || 0)} viewers
                      </p>
                    </div>
                  </div>
                );
              })}
            </section>
          </aside>
        </div>
      </div>
    );
}