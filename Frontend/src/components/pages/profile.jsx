import { useState, useEffect, useCallback } from "react";
import { UserAvatar, useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import Navbar from "../common/navbar";
import Sidebar from "../common/sidebar";
import { profileAPI, Follow } from "../../services/apiClient";
import { Users, UserPlus, UserMinus, X, Settings } from "lucide-react";

function FollowerModal({ title, users, onClose, onUnfollow }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md mx-4 max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {users.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No users yet</p>
          ) : users.map((u, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <img src={u.avatarUrl || `https://picsum.photos/seed/${u._id}/40/40`} alt="" className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{u.username || "Unknown"}</p>
                  <p className="text-xs text-gray-400">{u.firstName || ""} {u.lastName || ""}</p>
                </div>
              </div>
              {onUnfollow && (
                <button onClick={() => onUnfollow(u._id)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 font-medium">
                  Unfollow
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", bio: "", username: "", avatarUrl: ""
  });
  const [message, setMessage] = useState("");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      if (!user) return;
      const response = await profileAPI.getProfile();
      const data = response.data || {};
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        bio: data.bio || "",
        username: data.username || "",
        avatarUrl: data.avatarUrl || user.imageUrl || ""
      });
    } catch (err) {
      console.error("Error fetching profile:", err);
      setMessage("Error loading profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchSocial = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [fRes, folRes] = await Promise.all([
        Follow.getFollowers(user.id),
        Follow.getFollowing(user.id)
      ]);
      const fData = fRes.data || [];
      const folData = folRes.data || [];
      setFollowers(fData);
      setFollowing(folData);
      setFollowersCount(fData.length);
      setFollowingCount(folData.length);
    } catch (err) {
      console.error("Error fetching social data:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { navigate("/login"); return; }
    fetchProfile();
    fetchSocial();
  }, [isLoaded, user, navigate, fetchProfile, fetchSocial]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (!user) return;
      await profileAPI.updateProfile(formData);
      setEditing(false);
      setMessage("Profile updated successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setMessage("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (targetId) => {
    try {
      await Follow.unfollow(targetId);
      setFollowing(prev => prev.filter(u => u._id !== targetId));
      setFollowingCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error unfollowing:", err);
    }
  };

  const initials = (formData.firstName?.[0] || formData.username?.[0] || "U").toUpperCase();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? "ml-0" : "ml-64"}`}>
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-500 text-sm mt-1">Manage your profile information</p>
            </div>

            {message && (
              <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                {message}
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-md">
                  {formData.avatarUrl ? <img src={formData.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" /> : initials}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{formData.firstName} {formData.lastName}</h2>
                <p className="text-sm text-gray-500">@{formData.username || "username"}</p>
                {formData.bio && <p className="text-sm text-gray-600 mt-2 text-center max-w-md">{formData.bio}</p>}
              </div>

              <div className="flex justify-center gap-6 mb-6">
                <button onClick={() => setShowFollowers(true)} className="text-center group">
                  <p className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition">{followersCount}</p>
                  <p className="text-xs text-gray-500 group-hover:text-gray-700 transition">Followers</p>
                </button>
                <button onClick={() => setShowFollowing(true)} className="text-center group">
                  <p className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition">{followingCount}</p>
                  <p className="text-xs text-gray-500 group-hover:text-gray-700 transition">Following</p>
                </button>
              </div>

              {!editing ? (
                <div className="flex gap-3">
                  <button onClick={() => setEditing(true)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition text-sm">
                    Edit Profile
                  </button>
                  <button onClick={() => navigate("/settings")} className="flex items-center justify-center gap-1.5 flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition text-sm">
                    <Settings size={14} /> Settings
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button onClick={handleSave} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition text-sm disabled:opacity-50">
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button onClick={() => setEditing(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition text-sm">
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Account Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">First Name</label>
                  {editing ? (
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none" />
                  ) : (
                    <p className="text-sm text-gray-900">{formData.firstName || "—"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Last Name</label>
                  {editing ? (
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none" />
                  ) : (
                    <p className="text-sm text-gray-900">{formData.lastName || "—"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                  <p className="text-sm text-gray-900">{user?.primaryEmailAddress?.emailAddress || "—"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Managed by Clerk OAuth</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
                  {editing ? (
                    <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none" />
                  ) : (
                    <p className="text-sm text-gray-900">@{formData.username || "—"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bio</label>
                  {editing ? (
                    <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3} placeholder="Tell us about yourself..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none" />
                  ) : (
                    <p className="text-sm text-gray-600">{formData.bio || "No bio added"}</p>
                  )}
                </div>
                {editing && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Avatar URL</label>
                    <input type="text" name="avatarUrl" value={formData.avatarUrl} onChange={handleInputChange} placeholder="https://example.com/avatar.jpg" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {showFollowers && (
        <FollowerModal title={`${followersCount} Followers`} users={followers} onClose={() => setShowFollowers(false)} />
      )}
      {showFollowing && (
        <FollowerModal title={`${followingCount} Following`} users={following} onClose={() => setShowFollowing(false)} onUnfollow={handleUnfollow} />
      )}
    </div>
  );
}
