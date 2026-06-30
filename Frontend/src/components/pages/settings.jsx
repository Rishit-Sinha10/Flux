import { useState, useEffect, useCallback } from "react";
import { useUser, useClerk } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import Navbar from "../common/navbar";
import Sidebar from "../common/sidebar";
import { settingsAPI } from "../../services/apiClient";

export default function Settings() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
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
      const response = await settingsAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { navigate("/login"); return; }
    fetchSettings();
  }, [isLoaded, user, navigate, fetchSettings]);

  const handleToggle = async (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    try {
      if (!user) return;
      await settingsAPI.updateSettings(newSettings);
      setMessage("Settings updated");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Error updating settings:", error);
      setMessage("Failed to update settings");
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      setMessage("Failed to logout");
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  const tabs = ["account", "security", "notifications", "privacy"];

  const content = (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 font-semibold capitalize text-sm border-b-2 transition ${
              activeTab === tab
                ? "border-red-500 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {message && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${
          message.includes("Failed") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
        }`}>
          {message}
        </div>
      )}

      {activeTab === "account" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                <p className="text-gray-900">{user?.firstName} {user?.lastName}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                <p className="text-gray-900">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Member Since</label>
                <p className="text-gray-900">{new Date(user?.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Account Status</label>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                  <p className="text-sm text-gray-700">Active & Verified</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Password & Auth</h3>
            <p className="text-sm text-gray-500 mb-4">Your password is managed by Clerk OAuth</p>
            <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition text-sm">
              Manage Password
            </button>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${settings.twoFactorEnabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {settings.twoFactorEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition text-sm">
              {settings.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Active Sessions</h3>
            <div className="mb-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Current Device</p>
                  <p className="text-xs text-gray-500">This browser</p>
                </div>
                <span className="text-xs text-green-600 font-medium">Active</span>
              </div>
            </div>
            <button onClick={handleSignOutAllDevices} className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition text-sm">
              Sign Out All Devices
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">API Keys</h3>
            <p className="text-sm text-gray-500 mb-4">Generate API keys for programmatic access</p>
            <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition text-sm">
              Generate New API Key
            </button>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Notification Preferences</h3>
          <div className="space-y-4">
            {[
              { key: "emailNotifications", label: "Email Notifications", desc: "Get updates about your streams and account" },
              { key: "pushNotifications", label: "Push Notifications", desc: "Browser push notifications for live streams" },
              { key: "marketingEmails", label: "Marketing Emails", desc: "New features, promotions, and tips" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer" onClick={() => handleToggle(item.key)}>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <div className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${settings[item.key] ? "bg-red-500" : "bg-gray-300"}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${settings[item.key] ? "translate-x-6" : "translate-x-1"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "privacy" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Privacy & Data</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-1">Download Your Data</p>
              <p className="text-xs text-gray-500 mb-3">Get a copy of all your data in JSON format</p>
              <button className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition text-sm">
                Download Data
              </button>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-1">Delete Account</p>
              <p className="text-xs text-gray-500 mb-3">Permanently delete your account and all associated data</p>
              <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <button onClick={handleLogout} disabled={loading} className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-2.5 rounded-lg transition text-sm disabled:opacity-50">
          {loading ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? "ml-0" : "ml-64"}`}>
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {content}
        </main>
      </div>
    </div>
  );
}
