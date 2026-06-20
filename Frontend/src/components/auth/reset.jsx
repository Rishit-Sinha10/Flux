import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AuthLayout from "./auth_layout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      setMessage("❌ Invalid or expired reset link. Please request a new one.");
      console.warn("Missing token or email:", { token, email });
    } else {
      console.log("✅ Reset link valid. Token and email:", { token, email });
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validation
    if (!newPassword || !confirmPassword) {
      setMessage("Please enter both password fields");
      return;
    }

    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    if (!token || !email) {
      setMessage("Invalid reset link. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          newPassword,
        }),
      });

      const data = await response.json();

      console.log("📤 Reset password response:", { status: response.status, data });

      if (response.ok) {
        setMessage("✅ Password reset successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        console.error("❌ Reset failed:", data);
        setMessage(data.error || data.message || "Failed to reset password. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your new password"
    >
      {!token || !email ? (
        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-semibold mb-2">Invalid Reset Link</p>
          <p className="text-red-500 text-sm mb-4">
            The password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Request a new reset link
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded text-sm ${
                message.startsWith("✅")
                  ? "bg-green-100 text-green-700"
                  : message.startsWith("❌")
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token || !email}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full text-center text-sm text-gray-600 hover:text-gray-800 mt-4"
          >
            Back to Login
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
