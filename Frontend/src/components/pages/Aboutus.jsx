import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
// ── Utility ──────────────────────────────────────────────────────────────────
const cn = (...classes) => classes.filter(Boolean).join(" ");
// ── Primitive Components ─────────────────────────────────────────────────────
const Button = ({
  children,
  variant = "primary",
  className = "",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer select-none";
  const variants = {
    primary:
      "bg-black text-white hover:bg-neutral-800 active:scale-[0.98] rounded-lg px-5 py-2.5 text-sm shadow-sm focus-visible:ring-black",
    outline:
      "border border-neutral-300 text-black bg-white hover:bg-neutral-50 active:scale-[0.98] rounded-lg px-5 py-2.5 text-sm focus-visible:ring-black",
    ghost:
      "text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg px-4 py-2 text-sm focus-visible:ring-black",
    live: "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] rounded-lg px-5 py-2.5 text-sm shadow-sm shadow-red-200 focus-visible:ring-red-500",
  };
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};

const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-neutral-100 text-neutral-700 border border-neutral-200",
    live: "bg-red-50 text-red-600 border border-red-200",
    black: "bg-black text-white",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};

const Card = ({ children, className = "", hover = false, glass = false }) => (
  <div
    className={cn(
      "rounded-2xl border border-neutral-200 bg-white",
      hover &&
        "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-neutral-200/80",
      glass && "bg-white/70 backdrop-blur-xl",
      className,
    )}
  >
    {children}
  </div>
);

// ── Live Dot ──────────────────────────────────────────────────────────────────
const LiveDot = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
  </span>
);

// ── Animated Counter ──────────────────────────────────────────────────────────
const Counter = ({ target, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(ease * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

// ── Fade-in Section ───────────────────────────────────────────────────────────
const FadeIn = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// ── Navbar ────────────────────────────────────────────────────────────────────
const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Home", "Explore", "Go Live", "About"];

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-lg border-b border-neutral-200 shadow-sm"
          : "bg-transparent",
      )}
    >
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight text-black">
            Flux
          </span>
          <LiveDot />
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l}
              href="#"
              className={cn(
                "text-sm px-3 py-1.5 rounded-lg transition-colors duration-150",
                l === "About"
                  ? "font-semibold text-black bg-neutral-100"
                  : "text-neutral-600 hover:text-black hover:bg-neutral-100",
              )}
            >
              {l === "Go Live" ? (
                <span className="flex items-center gap-1.5">
                  <LiveDot />
                  Go Live
                </span>
              ) : (
                l
              )}
            </a>
          ))}
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/login">
            <Button variant="outline" className="flex-1">
              Login
            </Button>
          </Link>
          <Link to="/Signup">
            <Button variant="primary" className="flex-1">
              SignUp
            </Button>
          </Link>
        </div>
        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-5 h-4 flex flex-col justify-between">
            <span
              className={cn(
                "block h-0.5 bg-black rounded transition-all duration-300",
                menuOpen && "rotate-45 translate-y-1.5",
              )}
            />
            <span
              className={cn(
                "block h-0.5 bg-black rounded transition-all duration-300",
                menuOpen && "opacity-0",
              )}
            />
            <span
              className={cn(
                "block h-0.5 bg-black rounded transition-all duration-300",
                menuOpen && "-rotate-45 -translate-y-2.5",
              )}
            />
          </div>
        </button>
      </nav>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white/95 backdrop-blur-lg px-6 py-4 flex flex-col gap-2">
          {links.map((l) => (
            <a
              key={l}
              href="#"
              className="text-sm py-2 text-neutral-700 hover:text-black font-medium"
            >
              {l}
            </a>
          ))}
          <div className="pt-2 border-t border-neutral-100 flex gap-2">
            <Link to="/login">
              <Button variant="outline" className="flex-1">
                Login
              </Button>
            </Link>
            <Link to="/Signup">
              <Button variant="primary" className="flex-1">
                SignUp
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
// ── Hero Section ──────────────────────────────────────────────────────────────
const Hero = () => (
  <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden bg-white">
    {/* Subtle grid background */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />

    {/* Glow blobs */}
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-gradient-to-br from-red-100 via-orange-50 to-transparent blur-3xl opacity-60 pointer-events-none" />
    <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-neutral-100 blur-3xl opacity-80 pointer-events-none" />

    <div className="relative max-w-4xl mx-auto">
      {/* LIVE badge */}
      <FadeIn>
        <div className="flex justify-center mb-6">
          <Badge variant="live" className="gap-2 py-1.5 px-4">
            <LiveDot />
            Now Live — Building the Future
          </Badge>
        </div>
      </FadeIn>

      <FadeIn delay={100}>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-black leading-[1.05] mb-6">
          We Power the{" "}
          <span className="relative inline-block">
            <span className="relative z-10">Future of</span>
          </span>
          <br />
          <span className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
            Live Streaming
          </span>
        </h1>
      </FadeIn>

      <FadeIn delay={200}>
        <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Connecting creators and audiences in real-time through seamless,
          ultra-low-latency streaming — built for anyone, anywhere.
        </p>
      </FadeIn>

      <FadeIn delay={300}>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="live" className="px-6 py-3 text-base rounded-xl">
            <LiveDot />
            Start Streaming
          </Button>
          <Button variant="outline" className="px-6 py-3 text-base rounded-xl">
            Explore Creators →
          </Button>
        </div>
      </FadeIn>
    </div>

    {/* Scroll caret */}
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
      <svg
        className="w-5 h-5 text-neutral-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  </section>
);
// ── Story Section ─────────────────────────────────────────────────────────────
const Story = () => (
  <section className="py-24 px-6 bg-white">
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <FadeIn>
          <div>
            <Badge className="mb-4">Our Story</Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-black mb-6 leading-tight">
              Born from frustration.
              <br />
              <span className="text-neutral-400">Built for creators.</span>
            </h2>
            <div className="space-y-4 text-neutral-600 leading-relaxed">
              <p>
                Live streaming was broken. Laggy, expensive, stitched together
                from a dozen incompatible tools — creators were spending more
                time fighting infrastructure than making content.
              </p>
              <p>
                We built because we believed creators deserved better: a single,
                powerful platform that handles everything from ingest to
                monetization, without a PhD in DevOps.
              </p>
              <p>
                Today, over half a million creators trust Flux to go live in
                seconds and connect with audiences across the globe — with the
                lowest latency in the industry.
              </p>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "⚡", title: "Sub-500ms", sub: "End-to-end latency" },
              { icon: "🌍", title: "Global CDN", sub: "50+ PoPs worldwide" },
              { icon: "🛡️", title: "AI Safety", sub: "Real-time moderation" },
              {
                icon: "💰",
                title: "Built-in Monetization",
                sub: "Keep 90% of revenue",
              },
            ].map((c) => (
              <Card key={c.title} hover className="p-5" glass>
                <div className="text-2xl mb-3">{c.icon}</div>
                <div className="font-bold text-black text-sm mb-0.5">
                  {c.title}
                </div>
                <div className="text-xs text-neutral-500">{c.sub}</div>
              </Card>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  </section>
);
// ── Mission/Vision/Values ─────────────────────────────────────────────────────
const Mission = () => {
  const pillars = [
    {
      icon: "🎯",
      label: "Mission",
      heading: "Empower creators to go live instantly",
      body: "We remove every barrier between a creator and their audience — from one-click setup to global delivery at sub-second latency.",
    },
    {
      icon: "🔭",
      label: "Vision",
      heading: "A world where anyone can stream, connect, and earn",
      body: "We're building a future where geography, budget, and technical skill are never reasons a creator can't reach the world.",
    },
  ];

  const values = [
    {
      emoji: "🧑‍🎨",
      title: "Creator First",
      desc: "Every product decision starts with creators, not advertisers.",
    },
    {
      emoji: "🪟",
      title: "Transparency",
      desc: "Open pricing, honest metrics, no hidden fees — ever.",
    },
    {
      emoji: "🤝",
      title: "Community Driven",
      desc: "Our roadmap is shaped by the creators who use Flux daily.",
    },
    {
      emoji: "🔒",
      title: "Privacy & Safety",
      desc: "Robust moderation and data ownership, built into every layer.",
    },
  ];
  return (
    <section className="py-24 px-6 bg-neutral-50">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <Badge className="mb-4">Mission & Vision</Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-black">
              Why we show up every day
            </h2>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {pillars.map((p, i) => (
            <FadeIn key={p.label} delay={i * 100}>
              <Card hover className="p-8 h-full border-neutral-200">
                <div className="text-3xl mb-4">{p.icon}</div>
                <Badge className="mb-4">{p.label}</Badge>
                <h3 className="text-xl font-bold text-black mb-3 leading-snug">
                  {p.heading}
                </h3>
                <p className="text-neutral-500 leading-relaxed text-sm">
                  {p.body}
                </p>
              </Card>
            </FadeIn>
          ))}
        </div>

        {/* Values */}
        <FadeIn>
          <h3 className="text-2xl font-black tracking-tight text-black mb-6 text-center">
            Our Values
          </h3>
        </FadeIn>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {values.map((v, i) => (
            <FadeIn key={v.title} delay={i * 70}>
              <Card hover className="p-6 text-center">
                <div className="text-3xl mb-3">{v.emoji}</div>
                <div className="font-bold text-sm text-black mb-2">
                  {v.title}
                </div>
                <div className="text-xs text-neutral-500 leading-relaxed">
                  {v.desc}
                </div>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

// ── Platform Highlights ───────────────────────────────────────────────────────
const Highlights = () => {
  const features = [
    {
      icon: "⚡",
      title: "Ultra Low Latency",
      desc: "Under 500ms end-to-end. Your audience reacts before you blink.",
      tag: "Core Infra",
    },
    {
      icon: "💬",
      title: "Real-Time Chat & Engagement",
      desc: "Polls, reactions, and live Q&A — all synced to your stream.",
      tag: "Interaction",
    },
    {
      icon: "📱",
      title: "Multi-Device Streaming",
      desc: "Go live from your phone, browser, or OBS. No dongles required.",
      tag: "Accessibility",
    },
    {
      icon: "💰",
      title: "Creator Monetization",
      desc: "Subscriptions, tips, pay-per-view — you keep 90% of everything.",
      tag: "Revenue",
    },
    {
      icon: "🤖",
      title: "AI Moderation & Safety",
      desc: "Real-time content filtering that protects your community automatically.",
      tag: "Safety",
    },
    {
      icon: "🌐",
      title: "Global CDN Infrastructure",
      desc: "50+ points of presence ensure silky delivery, everywhere.",
      tag: "Scale",
    },
  ];

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <Badge className="mb-4">Platform</Badge>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-black mb-4">
              Everything a creator needs
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto text-base">
              No duct tape. No 12 third-party services. Just one platform that
              does it all — and does it brilliantly.
            </p>
          </div>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 60}>
              <Card
                hover
                className="p-7 group cursor-default border-neutral-200 transition-all duration-300 hover:border-neutral-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-2xl">{f.icon}</span>
                  <Badge className="text-[10px] font-semibold">{f.tag}</Badge>
                </div>
                <h3 className="font-bold text-black mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {f.desc}
                </p>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
//Footer--------------------------------------------------------------------------
const Footer = () => (
  <footer className="bg-black border-t border-neutral-900 px-6 py-12">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-black">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="font-bold text-white text-sm">Flux</span>
      </div>
      <p className="text-neutral-600 text-sm">
        © 2026 Flux Inc. All rights reserved.
      </p>
      <div className="flex gap-4 text-neutral-600 text-sm">
        {["Privacy", "Terms", "Status"].map((l) => (
          <a key={l} href="#" className="hover:text-white transition-colors">
            {l}
          </a>
        ))}
      </div>
    </div>
  </footer>
);
// ── Root ──────────────────────────────────────────────────────────────────────
export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <Navbar />
      <main>
        <Hero />
        <Story />
        <Mission />
        <Highlights />
      </main>
      <Footer />
    </div>
  );
}
