import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api.js';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.getProfile();
      setProfile(response);
      setFormData({
        firstName: response.firstName,
        lastName: response.lastName,
        bio: response.bio || '',
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    try {
      await api.updateProfile(formData);
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Profile</h1>
          <button
            onClick={() => setEditing(!editing)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {/* Profile Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600">First Name</label>
            {editing ? (
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border rounded mt-1"
              />
            ) : (
              <p className="text-lg mt-1">{profile?.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Last Name</label>
            {editing ? (
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border rounded mt-1"
              />
            ) : (
              <p className="text-lg mt-1">{profile?.lastName}</p>
            )}
          </div>
        </div>
        {/* Bio */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600">Bio</label>
          {editing ? (
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2 border rounded mt-1 h-24"
            />
          ) : (
            <p className="text-lg mt-1">{profile?.bio || 'No bio added'}</p>
          )}
        </div>
        {/* Status Info */}
        <div className="pt-6 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <label className="font-medium">Email</label>
              <p>{profile?.email}</p>
            </div>
            <div>
              <label className="font-medium">Username</label>
              <p>{profile?.username || 'Not set'}</p>
            </div>
            <div>
              <label className="font-medium">Joined</label>
              <p>{new Date(profile?.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="font-medium">Last Login</label>
              <p>{new Date(profile?.security?.lastLogin).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        {/* Save Button (if editing) */}
        {editing && (
          <button
            onClick={handleSave}
            className="mt-6 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save Changes
          </button>
        )}
      </div>
    </div>
  );
}