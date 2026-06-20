import { useState, useEffect, useCallback } from "react";
import { UserAvatar, useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { profileAPI } from "../../services/apiClient";
import AuthLayout from "../auth/auth_layout";

export default function Profile() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    username: "",
    avatarUrl: ""
  });
  const [message, setMessage] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;
      
      const response = await profileAPI.getProfile(user.id);
      const data = response.data;
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        bio: data.bio || "",
        username: data.username || "",
        avatarUrl: data.avatarUrl || user.imageUrl || ""
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage("Error loading profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      navigate("/login");
      return;
    }
    fetchProfile();
  }, [isLoaded, user, navigate, fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (!user) return;
      
      const response = await profileAPI.updateProfile(user.id, formData);
      const data = response.data;
      setEditing(false);
      setMessage("✅ Profile updated successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
          <p className="text-slate-400">Manage your profile information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 shadow-lg">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden mb-4 border-4 border-slate-700">
              {formData.avatarUrl ? (
                <UserAvatar alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white text-center">
              {formData.firstName} {formData.lastName}
            </h2>
            <p className="text-slate-400 text-center mt-1">@{formData.username || "username"}</p>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg mb-6 text-center ${
              message.includes("✅") 
                ? "bg-green-900/50 text-green-300 border border-green-700" 
                : "bg-red-900/50 text-red-300 border border-red-700"
            }`}>
              {message}
            </div>
          )}
          {/* Form Fields */}
          <div className="space-y-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!editing}
                className={`w-full px-4 py-2 rounded-lg border ${
                  editing
                    ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    : "bg-slate-700/50 border-slate-600 text-slate-300 cursor-not-allowed"
                } outline-none transition`}
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!editing}
                className={`w-full px-4 py-2 rounded-lg border ${
                  editing
                    ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    : "bg-slate-700/50 border-slate-600 text-slate-300 cursor-not-allowed"
                } outline-none transition`}
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={user?.primaryEmailAddress?.emailAddress || ""}
                disabled
                className="w-full px-4 py-2 rounded-lg border bg-slate-700/50 border-slate-600 text-slate-400 cursor-not-allowed outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">Managed by Clerk OAuth</p>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                disabled={!editing}
                className={`w-full px-4 py-2 rounded-lg border ${
                  editing
                    ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    : "bg-slate-700/50 border-slate-600 text-slate-300 cursor-not-allowed"
                } outline-none transition`}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                disabled={!editing}
                rows="4"
                placeholder="Tell us about yourself..."
                className={`w-full px-4 py-2 rounded-lg border resize-none ${
                  editing
                    ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    : "bg-slate-700/50 border-slate-600 text-slate-300 cursor-not-allowed"
                } outline-none transition`}
              />
            </div>

            {/* Avatar URL */}
            {editing && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Avatar URL</label>
                <input
                  type="text"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-2 rounded-lg border bg-slate-700 border-slate-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate("/settings")}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
                >
                  Settings
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Account ID</p>
            <p className="text-white font-mono text-sm mt-1 break-all">{user?.id}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <p className="text-slate-400 text-sm">Member Since</p>
            <p className="text-white text-sm mt-1">
              {new Date(user?.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
