import { useState, useEffect, useCallback } from "react";
import { useUser, useClerk } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { settingsAPI } from "../../services/apiClient";

export default function Settings() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    twoFactorEnabled: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      if (!user) return;
      const response = await settingsAPI.getSettings(user.id);
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      navigate("/login");
      return;
    }
    fetchSettings();
  }, [isLoaded, user, navigate, fetchSettings]);

  const handleToggle = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);

    try {
      if (!user) return;
      await settingsAPI.updateSettings(user.id, newSettings);
      setMessage("✅ Settings updated");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Error updating settings:", error);
      setMessage("❌ Failed to update settings");
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      setMessage("❌ Failed to logout");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOutAllDevices = async () => {
    if (confirm("Sign out from all devices? You'll need to login again.")) {
      await handleLogout();
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-700">
          {["account", "security", "notifications", "privacy"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold capitalize border-b-2 transition ${
                activeTab === tab
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes("✅")
              ? "bg-green-900/50 text-green-300 border border-green-700"
              : "bg-red-900/50 text-red-300 border border-red-700"
          }`}>
            {message}
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="space-y-6">
            {/* Account Info Card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                  <p className="text-white text-lg">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Email Address</label>
                  <p className="text-white text-lg">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Member Since</label>
                  <p className="text-white text-lg">
                    {new Date(user?.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Account Status</label>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <p className="text-white">Active & Verified</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Password & Auth</h3>
              <p className="text-slate-400 mb-4">Your password is managed by Clerk OAuth</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                Manage Password
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-6">
            {/* 2FA Card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Two-Factor Authentication</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  settings.twoFactorEnabled
                    ? "bg-green-900/50 text-green-300"
                    : "bg-slate-700 text-slate-400"
                }`}>
                  {settings.twoFactorEnabled ? "Enabled" : "Disabled"}
                </div>
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                {settings.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
              </button>
            </div>

            {/* Active Sessions Card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">Active Sessions</h3>
              <div className="mb-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-semibold">Current Device</p>
                    <p className="text-slate-400 text-sm">This browser</p>
                  </div>
                  <div className="text-green-400 text-sm">Active</div>
                </div>
              </div>
              <button
                onClick={handleSignOutAllDevices}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition"
              >
                Sign Out All Devices
              </button>
            </div>

            {/* API Keys Card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-4">API Keys</h3>
              <p className="text-slate-400 mb-4">Generate API keys for programmatic access</p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                Generate New API Key
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>
              
              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition cursor-pointer"
                  onClick={() => handleToggle("emailNotifications")}>
                  <div>
                    <p className="text-white font-semibold">Email Notifications</p>
                    <p className="text-slate-400 text-sm">Get updates about your streams and account</p>
                  </div>
                  <div className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    settings.emailNotifications ? "bg-green-600" : "bg-slate-600"
                  }`}>
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                        settings.emailNotifications ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </div>
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition cursor-pointer"
                  onClick={() => handleToggle("pushNotifications")}>
                  <div>
                    <p className="text-white font-semibold">Push Notifications</p>
                    <p className="text-slate-400 text-sm">Browser push notifications for live streams</p>
                  </div>
                  <div className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    settings.pushNotifications ? "bg-green-600" : "bg-slate-600"
                  }`}>
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                        settings.pushNotifications ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </div>
                </div>

                {/* Marketing Emails */}
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition cursor-pointer"
                  onClick={() => handleToggle("marketingEmails")}>
                  <div>
                    <p className="text-white font-semibold">Marketing Emails</p>
                    <p className="text-slate-400 text-sm">New features, promotions, and tips</p>
                  </div>
                  <div className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                    settings.marketingEmails ? "bg-green-600" : "bg-slate-600"
                  }`}>
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                        settings.marketingEmails ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === "privacy" && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-xl font-bold text-white mb-6">Privacy & Data</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-white font-semibold mb-2">📥 Download Your Data</p>
                  <p className="text-slate-400 text-sm mb-3">Get a copy of all your data in JSON format</p>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                    Download Data
                  </button>
                </div>

                <div className="p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-white font-semibold mb-2">🗑️ Delete Account</p>
                  <p className="text-slate-400 text-sm mb-3">Permanently delete your account and all associated data</p>
                  <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logout Section */}
        <div className="mt-8 pt-8 border-t border-slate-700">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  );
}
