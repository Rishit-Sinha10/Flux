import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./auth_layout";
import { useUser } from "@clerk/react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState(""); // For dev mode
  const navigate = useNavigate();
  const { user } = useUser();

  // Check if user's email is verified
  const isEmailVerified = user?.primaryEmailAddress?.verification?.status === "verified";

  // If user has an account and email is not verified, show warning
  if (user && !isEmailVerified) {
    return (
      <AuthLayout
        title="Email Not Verified"
        subtitle="Please verify your email first"
      >
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Your email address needs to be verified before you can reset your password.
          </p>
          <p className="text-sm text-gray-600">
            Check your inbox for a verification link from Clerk.
          </p>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    try {
      const emailToReset = email || user?.primaryEmailAddress?.emailAddress;
      
      if (!emailToReset) {
        setMessage("Please enter an email address");
        setLoading(false);
        return;
      }

      // ✅ CORRECT ENDPOINT: /api/auth/forgot-password (NOT password/:userId)
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToReset }),
      });

      const data = await response.json();

      if (response.ok || data.sent) {
        setMessage("✅ Password reset link sent to your email. Check your inbox!");
        
        // Extract devToken from response and redirect with parameters
        if (data.devToken) {
          // Dev mode: token is in response - show link to user and redirect
          const resetLink = `http://localhost:5173/reset-password?token=${data.devToken}&email=${emailToReset}`;
          setResetLink(resetLink);
          console.log("📧 Dev Mode - Reset link:", resetLink);
          console.log("🔗 Copy this link and open it in your browser");
          
          // Auto-navigate after delay
          setTimeout(() => navigate(`/reset-password?token=${data.devToken}&email=${emailToReset}`), 2500);
        } else {
          // Production mode: user gets email with link
          console.log("📧 Check your email for the reset link");
          setTimeout(() => navigate("/reset-password"), 2500);
        }
      } else {
        setMessage(data.error || "Failed to send reset link. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      setMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="We will send a reset link to your email"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            required
            placeholder="Enter your email"
            value={email || user?.primaryEmailAddress?.emailAddress || ""}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {message && (
          <div className={`p-3 rounded text-sm ${message.includes("sent") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {message}
          </div>
        )}

        {resetLink && (
          <div className="p-3 rounded text-sm bg-yellow-50 border border-yellow-200">
            <p className="text-yellow-800 font-semibold mb-2">🔗 Dev Mode - Click or copy the link:</p>
            <a
              href={resetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline break-all"
            >
              {resetLink}
            </a>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(resetLink);
                alert("Link copied to clipboard!");
              }}
              className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </AuthLayout>
  );
}