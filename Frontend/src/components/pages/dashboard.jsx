import { UserAvatar } from "@clerk/react";
import { User } from "lucide-react";
import { useState } from "react";
// ─── Sub-components ───────────────────────────────────────────────
function StatCard({ label, value, change, changeType = "up", iconBg, iconColor, accentColor, icon }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #EAECF0",
        borderRadius: 14,
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        transition: "all 0.22s ease",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.querySelector(".accent-bar").style.opacity = "1";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.querySelector(".accent-bar").style.opacity = "0";
      }}
    >
      {/* Accent top bar */}
      <div
        className="accent-bar"
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 3,
          background: accentColor,
          opacity: 0,
          transition: "opacity 0.22s",
          borderRadius: "14px 14px 0 0",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#5C6070" }}>{label}</span>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: iconBg, color: iconColor,
          display: "grid", placeItems: "center",
        }}>
          {icon}
        </div>
      </div>
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: "1.7rem", fontWeight: 700,
        letterSpacing: "-0.04em", color: "#0D0F14",
        lineHeight: 1, marginBottom: 7,
      }}>
        {value}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.75rem" }}>
        <span style={{
          display: "flex", alignItems: "center", gap: 3,
          padding: "2px 7px", borderRadius: 20, fontWeight: 500,
          background: changeType === "up" ? "#ECFDF5" : "#FEF2F2",
          color: changeType === "up" ? "#10B981" : "#EF4444",
        }}>
          {changeType === "up" ? "↑" : "↓"} {change}
        </span>
        <span style={{ color: "#9BA3AF" }}>vs last month</span>
      </div>
    </div>
  );
}

function ActivityFeed({ items = [] }) {
  return (
    <div>
      {items.map((item, i) => (
        <div key={i}>
          <div
            style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "12px 22px", transition: "background 0.16s", cursor: "default",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#F8F9FB"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: item.iconBg, color: item.iconColor,
              display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1,
            }}>
              {item.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#0D0F14", lineHeight: 1.4 }}>
                {item.titleParts.map((part, j) =>
                  part.highlight
                    ? <span key={j} style={{ color: "#3B82F6", fontWeight: 600 }}>{part.text}</span>
                    : <span key={j}>{part.text}</span>
                )}
              </div>
              <div style={{ fontSize: "0.72rem", color: "#9BA3AF", marginTop: 2 }}>{item.meta}</div>
            </div>
          </div>
          {i < items.length - 1 && <div style={{ height: 1, background: "#F2F4F7", margin: "0 22px" }} />}
        </div>
      ))}
    </div>
  );
}

function AnalyticsChart({ data = [], labels = [], rangeOptions = ["7D", "30D", "90D"] }) {
  const [activeRange, setActiveRange] = useState(rangeOptions[0]);

  // Normalise data points to SVG coords (viewBox 560x200, usable y: 10–160)
  const maxVal = Math.max(...data.map(d => d.viewers), 1);
  const toY = v => 160 - (v / maxVal) * 150;
  const toX = i => 40 + i * (480 / Math.max(data.length - 1, 1));

  // Build smooth path
  const smoothPath = (pts) => {
    if (pts.length < 2) return "";
    const coords = pts.map(p => ({ x: p[0], y: p[1] }));
    let d = `M${coords[0].x},${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }
    return d;
  };

  const bluePts = data.map((d, i) => [toX(i), toY(d.viewers)]);
  const purplePts = data.map((d, i) => [toX(i), toY(d.subscribers)]);
  const bluePath = smoothPath(bluePts);
  const purplePath = smoothPath(purplePts);
  const blueArea = bluePath + ` L${toX(data.length - 1)},160 L${toX(0)},160 Z`;
  const purpleArea = purplePath + ` L${toX(data.length - 1)},160 L${toX(0)},160 Z`;

  return (
    <div>
      {/* Header */}
      <div style={{ padding: "18px 22px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#0D0F14", letterSpacing: "-0.02em" }}>
            Viewer Analytics
          </div>
          <div style={{ fontSize: "0.75rem", color: "#9BA3AF", marginTop: 2 }}>Daily active viewers over time</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {rangeOptions.map(r => (
            <button
              key={r}
              onClick={() => setActiveRange(r)}
              style={{
                padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 500,
                cursor: "pointer", border: "1px solid",
                background: activeRange === r ? "#3B82F6" : "#F5F6F8",
                color: activeRange === r ? "white" : "#5C6070",
                borderColor: activeRange === r ? "#3B82F6" : "#EAECF0",
                transition: "all 0.18s",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, padding: "0 22px", marginBottom: 8 }}>
        {[{ color: "#3B82F6", label: "Viewers" }, { color: "#8B5CF6", label: "Subscribers" }].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "#5C6070" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <div style={{ padding: "0 22px 20px" }}>
        <svg viewBox="0 0 560 200" style={{ width: "100%", height: 220, overflow: "visible" }}>
          <defs>
            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid */}
          {[160, 120, 80, 40].map(y => (
            <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="#F2F4F7" strokeWidth="1" />
          ))}
          {/* Y labels */}
          {[{ y: 163, label: "0" }, { y: 123, label: Math.round(maxVal * 0.33).toLocaleString() },
            { y: 83, label: Math.round(maxVal * 0.66).toLocaleString() }, { y: 43, label: maxVal.toLocaleString() }].map(l => (
            <text key={l.y} x="4" y={l.y} fill="#9BA3AF" fontSize="9" fontFamily="DM Sans">{l.label}</text>
          ))}
          {/* X labels */}
          {labels.map((lbl, i) => (
            <text key={i} x={toX(i)} y="186" fill="#9BA3AF" fontSize="9" fontFamily="DM Sans" textAnchor="middle">{lbl}</text>
          ))}

          {data.length > 1 && (
            <>
              <path d={blueArea} fill="url(#blueGrad)" />
              <path d={bluePath} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d={purpleArea} fill="url(#purpleGrad)" />
              <path d={purplePath} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {bluePts.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke="#3B82F6" strokeWidth="2" />
              ))}
            </>
          )}

          {data.length === 0 && (
            <text x="280" y="100" fill="#9BA3AF" fontSize="12" textAnchor="middle" fontFamily="DM Sans">
              No data available
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}

function StreamCard({ title, tags = [], isLive = false, viewerCount, thumbnailGradient }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        borderRadius: 10, overflow: "hidden",
        border: hovered ? "1px solid transparent" : "1px solid #EAECF0",
        cursor: "pointer",
        transition: "all 0.22s ease",
        transform: hovered ? "scale(1.025)" : "scale(1)",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.1)" : "none",
        background: "white",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        height: 88, position: "relative",
        background: thumbnailGradient || "linear-gradient(135deg,#1e3a5f,#3B82F6)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="32" height="32" viewBox="0 0 20 20" fill="rgba(255,255,255,0.4)">
          <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
        </svg>
        {isLive && (
          <div style={{
            position: "absolute", top: 7, left: 7,
            background: "#EF4444", color: "white",
            fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em",
            padding: "2px 6px", borderRadius: 4,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <span style={{
              width: 5, height: 5, background: "white", borderRadius: "50%",
              animation: "pulseDot 1.4s ease infinite",
            }} />
            LIVE
          </div>
        )}
        {viewerCount && (
          <div style={{
            position: "absolute", bottom: 7, right: 7,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
            color: "white", fontSize: "0.65rem", fontWeight: 500,
            padding: "2px 7px", borderRadius: 4,
          }}>
            👁 {viewerCount}
          </div>
        )}
      </div>
      <div style={{ padding: 10 }}>
        <div style={{
          fontSize: "0.78rem", fontWeight: 600, color: "#0D0F14",
          lineHeight: 1.3, marginBottom: 6,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {title}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {tags.map((tag, i) => (
            <span key={i} style={{
              fontSize: "0.62rem", fontWeight: 500,
              padding: "2px 7px", borderRadius: 20,
              background: tag.bg || "#EFF6FF",
              color: tag.color || "#3B82F6",
            }}>
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrafficSourceRow({ source, sub, views, barWidth, barGradient, change, changeDelta }) {
  return (
    <div
      style={{ display: "flex", alignItems: "center", padding: "11px 22px", gap: 12, transition: "background 0.16s", cursor: "default" }}
      onMouseEnter={e => e.currentTarget.style.background = "#F8F9FB"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 500, color: "#0D0F14" }}>{source}</div>
        <div style={{ fontSize: "0.7rem", color: "#9BA3AF" }}>{sub}</div>
      </div>
      <div style={{ width: 60, textAlign: "right", fontSize: "0.82rem", fontWeight: 600, color: "#0D0F14", fontVariantNumeric: "tabular-nums" }}>
        {views}
      </div>
      <div style={{ flex: 1, height: 5, background: "#F2F4F7", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ height: "100%", width: barWidth, background: barGradient, borderRadius: 20 }} />
      </div>
      <div style={{ width: 52, textAlign: "right", fontSize: "0.75rem", fontWeight: 500, color: changeDelta >= 0 ? "#10B981" : "#EF4444" }}>
        {changeDelta >= 0 ? "+" : ""}{change}
      </div>
    </div>
  );
}

// ─── Card Shell ───────────────────────────────────────────────────

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #EAECF0",
      borderRadius: 14,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, subtitle, action }) {
  return (
    <div style={{ padding: "18px 22px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
      <div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "0.95rem", fontWeight: 700, color: "#0D0F14", letterSpacing: "-0.02em" }}>
          {title}
        </div>
        {subtitle && <div style={{ fontSize: "0.75rem", color: "#9BA3AF", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────
/**
 * DashboardContent
 *
 * Props:
 * - greeting {string}           e.g. "Good morning, Rishit ☀️"
 * - subtext  {string}           e.g. "Here's what's happening..."
 * - dateRange {string}          e.g. "Mar 1 – Mar 18, 2026"
 *
 * - stats {Array<{label, value, change, changeType, iconBg, iconColor, accentColor, icon}>}
 *
 * - chartData   {Array<{viewers: number, subscribers: number}>}
 * - chartLabels {string[]}
 * - chartRangeOptions {string[]}
 *
 * - activityItems {Array<{titleParts, meta, icon, iconBg, iconColor}>}
 *   titleParts: Array<{text: string, highlight?: boolean}>
 *
 * - streams {Array<{title, isLive, viewerCount, thumbnailGradient, tags: [{label, bg, color}]}>}
 *
 * - trafficSources {Array<{source, sub, views, barWidth, barGradient, change, changeDelta}>}
 */
export default function DashboardContent({
  subtext = "",
  dateRange = "",
  stats = [],
  chartData = [],
  chartLabels = [],
  chartRangeOptions = ["7D", "30D", "90D"],
  activityItems = [],
  streams = [],
  trafficSources = [],
}) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        
        .dashboard-container {
          font-family: 'DM Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(0.7); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .stat-anim-1 { animation: fadeUp 0.4s ease 0.05s both; }
        .stat-anim-2 { animation: fadeUp 0.4s ease 0.10s both; }
        .stat-anim-3 { animation: fadeUp 0.4s ease 0.15s both; }
        .stat-anim-4 { animation: fadeUp 0.4s ease 0.20s both; }
        .card-anim   { animation: fadeUp 0.4s ease 0.25s both; }
      `}</style>

      <div className="dashboard-container max-w-[1600px] mx-auto">

        {/* ── Page Header ── */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            {subtext && <div style={{ fontSize: "0.875rem", color: "#64748b", marginTop: 6, fontWeight: 500 }}>{subtext}</div>}
          </div>
          {dateRange && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "white", border: "1px solid #EAECF0",
              borderRadius: 9, padding: "7px 12px",
              fontSize: "0.8rem", color: "#5C6070",
              cursor: "pointer",
            }}>
              📅 {dateRange}
            </div>
          )}
        </div>

        {/* ── Stats Grid ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          marginBottom: 24,
        }}>
          {stats.map((s, i) => (
            <div key={i} className={`stat-anim-${Math.min(i + 1, 4)}`}>
              <StatCard {...s} />
            </div>
          ))}
        </div>

        {/* ── Mid Row: Chart + Activity ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 20,
          marginBottom: 24,
        }}
          className="card-anim"
        >
          {/* Chart */}
          <Card>
            <AnalyticsChart data={chartData} labels={chartLabels} rangeOptions={chartRangeOptions} />
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader title="Activity Feed" subtitle="Latest events" />
            <div style={{ paddingTop: 8, paddingBottom: 4 }}>
              {activityItems.length > 0
                ? <ActivityFeed items={activityItems} />
                : <div style={{ padding: "24px 22px", fontSize: "0.82rem", color: "#9BA3AF", textAlign: "center" }}>No activity yet</div>
              }
            </div>
          </Card>
        </div>

        {/* ── Bottom Row: Streams + Traffic ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }} className="card-anim">

          {/* Stream Cards */}
          <Card>
            <CardHeader
              title="Live Streams"
              subtitle="Your active channels"
              action={
                <span style={{ fontSize: "0.78rem", color: "#3B82F6", cursor: "pointer", fontWeight: 500 }}>
                  View all →
                </span>
              }
            />
            <div style={{ padding: "16px 22px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {streams.length > 0
                ? streams.map((s, i) => <StreamCard key={i} {...s} />)
                : <div style={{ gridColumn: "1/-1", padding: "16px 0", fontSize: "0.82rem", color: "#9BA3AF", textAlign: "center" }}>
                    No streams available
                  </div>
              }
            </div>
          </Card>

          {/* Traffic Sources */}
          <Card>
            <CardHeader title="Top Traffic Sources" subtitle="Where your viewers come from" />
            <div style={{ paddingTop: 4, paddingBottom: 8 }}>
              {/* Table header */}
              <div style={{ display: "flex", gap: 12, padding: "10px 22px 6px" }}>
                {["Source", "Views", "Share", "Δ"].map((col, i) => (
                  <div key={col} style={{
                    fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.06em",
                    textTransform: "uppercase", color: "#9BA3AF",
                    flex: i === 0 ? 1 : i === 2 ? 1 : "none",
                    width: i === 1 ? 60 : i === 3 ? 52 : undefined,
                    textAlign: i >= 1 ? "right" : "left",
                  }}>
                    {col}
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: "#F2F4F7", margin: "0 22px 4px" }} />
              {trafficSources.length > 0
                ? trafficSources.map((src, i) => (
                    <div key={i}>
                      <TrafficSourceRow {...src} />
                      {i < trafficSources.length - 1 && <div style={{ height: 1, background: "#F2F4F7", margin: "0 22px" }} />}
                    </div>
                  ))
                : <div style={{ padding: "20px 22px", fontSize: "0.82rem", color: "#9BA3AF", textAlign: "center" }}>
                    No data available
                  </div>
              }
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
