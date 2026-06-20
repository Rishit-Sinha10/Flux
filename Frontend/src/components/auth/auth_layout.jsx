import { motion } from "framer-motion";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="linear-gradient(rgb(0, 0, 0) 1px, transparent 1px), linear-gradient(90deg, rgb(0, 0, 0) 1px, transparent 1px);">

      {/* Left Section */}
      <div className="hidden md:flex items-center justify-center text-black p-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2.6xl sm:text-3xl md:text-3xl font-black tracking-tighter text-black leading-[1.05] mb-6">
            We Power the{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Future of</span>
            </span>
            <br />
            <span className="bg-linear-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
              Live Streaming
            </span>
          </h1>
        </motion.div>
      </div>

      {/* Right Section */}
      <div className="flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/20 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-white/20"
        >
          <h2 className="text-2xl font-bold text-black">{title}</h2>
          <p className="text-black/70 mb-6">{subtitle}</p>

          {children}
        </motion.div>
      </div>
    </div>
  );
}