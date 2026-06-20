const API_BASE_URL = import.meta.env.VITE_API_URL;
// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem("token");
};
// Helper function for API calls
const apiCall = async (endpoint, method = "GET", data = null) => {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAuthToken()}`,
    },
  };
  if (data) {
    options.body = JSON.stringify(data);
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.msg || `Error: ${response.status}`);
  }
  return response.json();
};
// ==================== AUTH ENDPOINTS ====================
export const authAPI = {
  register: (username, email, password, firstName, lastName) =>
    fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, firstName, lastName }),
    }).then((res) => res.json()),

  login: (email, password) =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then((res) => res.json()),
};
// ==================== PROFILE ENDPOINTS ====================
export const profileAPI = {
  // Get user profile
  getProfile: (userId) =>
    apiCall(`/auth/profile/${userId}`),
  // Update profile information
  updateProfile: (userId, profileData) =>
    apiCall(`/auth/profile/${userId}`, "PUT", profileData),
  // Update profile avatar
  updateAvatar: (userId, avatarUrl) =>
    apiCall(`/auth/profile/${userId}`, "PUT", { avatarUrl }),
  // Update password
  updatePassword: (userId, currentPassword, newPassword) =>
    apiCall(`/auth/password/${userId}`, "PUT", {
      currentPassword,
      newPassword,
    }),
  // Get security information
  getSecurityInfo: (userId) =>
    apiCall(`/auth/security/${userId}`),
  // Update settings and preferences
  updateSettings: (userId, settings) =>
    apiCall(`/auth/settings/${userId}`, "PUT", settings),
  // Update notification preferences
  updateNotifications: (userId, notifications) =>
    apiCall(`/auth/settings/${userId}`, "PUT", { notifications }),
  // Update theme preference
  updateTheme: (userId, theme) =>
    apiCall(`/auth/settings/${userId}`, "PUT", {
      settings: { theme },
    }),
  // Update language preference
  updateLanguage: (userId, language) =>
    apiCall(`/auth/settings/${userId}`, "PUT", {
      settings: { language },
    }),
};
// ==================== API KEY ENDPOINTS ====================
export const apiKeyAPI = {
  // Generate new API key
  generateAPIKey: (userId, name) =>
    apiCall(`/auth/apikey/${userId}`, "POST", { name }),

  // Delete API key
  deleteAPIKey: (userId, keyId) =>
    apiCall(`/auth/apikey/${userId}`, "DELETE", { keyId }),
};
// ==================== STREAM ENDPOINTS ====================

export const streamAPI = {
  getStreams: () =>
    fetch(`${API_BASE_URL}/streams`).then((res) => res.json()),

  getStream: (streamId) =>
    fetch(`${API_BASE_URL}/streams/${streamId}`).then((res) => res.json()),

  createStream: (streamData) =>
    apiCall(`/streams`, "POST", streamData),

  updateStream: (streamId, streamData) =>
    apiCall(`/streams/${streamId}`, "PUT", streamData),

  deleteStream: (streamId) =>
    apiCall(`/streams/${streamId}`, "DELETE"),

  startStream: (streamId) =>
    apiCall(`/streams/${streamId}/start`, "POST"),

  endStream: (streamId) =>
    apiCall(`/streams/${streamId}/end`, "POST"),
};
// ==================== UTILITY FUNCTIONS ====================
export const setAuthToken = (token) => {
  localStorage.setItem("authToken", token);
};
export const clearAuthToken = () => {
  localStorage.removeItem("authToken");
};
export const isAuthenticated = () => {
  return !!localStorage.getItem("authToken");
};
export default {
  authAPI,
  profileAPI,
  apiKeyAPI,
  streamAPI,
  setAuthToken,
  clearAuthToken,
  isAuthenticated,
};
