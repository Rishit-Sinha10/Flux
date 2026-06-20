import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./auth_layout";
import ClerkPopup from "./ClerkPopup";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/react";

export default function Signup() {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  // ✅ Redirect to dashboard when user is signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log("[Signup] User is signed in, redirecting to dashboard in 2 seconds...");
      const timer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn, navigate]);

  // ✅ If already signed in with Clerk, show message
  if (isLoaded && isSignedIn) {
    return (
      <AuthLayout
        title="Already Signed Up"
        subtitle="Your account is active"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
            <p className="text-green-600 font-medium">✅ Account is active!</p>
            <p className="text-green-600/80 text-sm mt-2">Redirecting to dashboard...</p>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout title="Create Account" subtitle="Join our community">
      <div className="space-y-6">
        {/* 🔑 Clerk Authentication (Recommended) */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ClerkPopup />
        </motion.div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300/30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white/5 text-gray-400">Or sign up with email</span>
          </div>
        </div>

        {/* Legacy Email Signup (Disabled) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
        >
          <p className="text-sm text-gray-600 mb-3">
            Email signup is deprecated. Please use the Sign Up button above.
          </p>
          <button
            onClick={() => alert("Email signup is no longer available. Please use the Sign Up button above.")}
            className="w-full bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg text-sm cursor-not-allowed opacity-75"
            disabled
          >
            Email Signup (Disabled)
          </button>
        </motion.div>
        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}