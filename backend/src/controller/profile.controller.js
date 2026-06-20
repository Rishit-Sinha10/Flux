import User from "../models/User.models.js";
import Stream from "../models/stream.models.js";
// GET USER PROFILE
// ⏱️ TIMEOUT SAFETY: Response guaranteed within 10 seconds
export const getUserProfile = async (req, res) => {
  // 🔐 CRITICAL: Set timeout safety wrapper
  let timeoutHandle = setTimeout(() => {
    if (!res.headersSent) {
      console.error(
        "⏰ [profile] TIMEOUT SAFETY TRIGGERED: Sending error response",
      );
      res.status(504).json({
        error: "Profile fetch timeout - request took too long",
        code: "PROFILE_TIMEOUT",
        note: "This is a failsafe. Backend operations were still running.",
      });
    }
  }, 10000); // 10 second timeout safety net
  try {
    const userId = req.params.userId || req.auth?.userId;
    console.log("📡 [profile] Profile route hit");
    console.log(`   userId from params: ${req.params.userId}`);
    console.log(`   userId from auth: ${req.auth?.userId}`);
    console.log(`   final userId: ${userId}`);
    console.log(`   MongoDB connected: ${global.mongoConnected}`);
    if (!userId) {
      clearTimeout(timeoutHandle);
      console.error("[profile] ❌ No userId found in params or auth");
      return res.status(400).json({
        error: "User ID not provided",
        code: "USER_ID_MISSING",
        debug: {
          params: req.params,
          auth: req.auth,
        },
      });
    }
    // Check MongoDB connection BEFORE querying
    if (!global.mongoConnected) {
      clearTimeout(timeoutHandle);
      console.error("[profile] ❌ MongoDB not connected - cannot fetch user");
      return res.status(503).json({
        error: "Database connection unavailable",
        code: "DB_UNAVAILABLE",
        suggestion: "Restart backend after ensuring MongoDB is running",
      });
    }
    console.log(`[profile] 🔍 Querying User collection for userId: ${userId}`);
    const user = await User.findById(userId)
      .maxTimeMS(5000)
      .lean() // ✅ Optimization: Read-only query
      .select("-password -security.resetToken");

    if (!user) {
      clearTimeout(timeoutHandle);
      console.error(`[profile] ❌ User not found: ${userId}`);
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
        userId,
      });
    }
    console.log(`[profile] ✅ User found, querying streams...`);
    // Get user's stream statistics
    const streams = await Stream.find({ creator: userId })
      .maxTimeMS(5000)
      .lean() // ✅ Optimization: Read-only query
      .select("totalViewers startTime endTime");
    console.log(`[profile] ✅ Found ${streams.length} streams`);
    const totalViewers = streams.reduce(
      (sum, s) => sum + (s.totalViewers || 0),
      0,
    );
    const totalStreams = streams.length;
    const avgViewsPerStream =
      totalStreams > 0 ? Math.round(totalViewers / totalStreams) : 0;
    const totalWatchHours = streams.reduce((sum, s) => {
      if (s.startTime && s.endTime) {
        return sum + (new Date(s.endTime) - new Date(s.startTime)) / 3600000;
      }
      return sum;
    }, 0);
    const profileData = {
      userId: user._id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      bio: user.bio || "",
      email: user.email,
      avatarUrl: user.avatarUrl || "",
      followers: Math.floor(Math.random() * 10000) + 100, // Mock data
      following: Math.floor(Math.random() * 500),
      totalStreams,
      joinedDate: user.createdAt,
      socialLinks: {
        twitter: "",
        youtube: "",
        discord: "",
      },
      stats: {
        totalViewers,
        avgViewsPerStream,
        totalWatchHours: Math.round(totalWatchHours),
      },
    };
    console.log("✅ [profile] Profile fetched successfully");
    clearTimeout(timeoutHandle);
    res.json(profileData);
  } catch (err) {
    clearTimeout(timeoutHandle);
    console.error("❌ [profile] Get profile error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Error fetching profile",
        details: err.message,
        code: "PROFILE_ERROR",
      });
    }
  }
};
// UPDATE USER PROFILE
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.auth?.userId;
    const { firstName, lastName, bio, username, avatarUrl } = req.body;
    if (!userId) {
      return res.status(400).json({
        error: "User ID not provided",
        code: "USER_ID_MISSING",
      });
    }
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (bio !== undefined) updateData.bio = bio;
    if (username !== undefined) updateData.username = username;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    })
      .maxTimeMS(5000)
      .select("-password -security.resetToken")
      .lean();

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({
      error: "Error updating profile",
      details: err.message,
    });
  }
};

// GET USER SETTINGS
export const getUserSettings = async (req, res) => {
  try {
    const userId = req.params.userId || req.auth?.userId;

    if (!userId) {
      return res.status(400).json({
        error: "User ID not provided",
        code: "USER_ID_MISSING",
      });
    }

    const user = await User.findById(userId)
      .maxTimeMS(5000)
      .select("notifications settings")
      .lean();

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    const settings = {
      userId,
      emailNotifications: user.notifications?.emailNotifications ?? true,
      pushNotifications: user.notifications?.pushNotifications ?? false,
      marketingEmails: user.notifications?.marketingEmails ?? false,
      twoFactorEnabled: user.notifications?.twoFactorEnabled ?? false,
      privacy: {
        profileVisibility: "public",
        allowMessages: true,
        allowComments: true,
      },
      streaming: {
        autoRecord: true,
        quality: "1080p",
        bitrate: 6000,
      },
    };

    res.json(settings);
  } catch (err) {
    console.error("❌ Get settings error:", err);
    res.status(500).json({
      error: "Error fetching settings",
      details: err.message,
    });
  }
};
// UPDATE USER SETTINGS
export const updateUserSettings = async (req, res) => {
  try {
    const userId = req.params.userId || req.auth?.userId;
    const {
      emailNotifications,
      pushNotifications,
      marketingEmails,
      twoFactorEnabled,
    } = req.body;
    if (!userId) {
      return res.status(400).json({
        error: "User ID not provided",
        code: "USER_ID_MISSING",
      });
    }
    const updateData = {
      notifications: {},
    };
    if (emailNotifications !== undefined)
      updateData.notifications.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined)
      updateData.notifications.pushNotifications = pushNotifications;
    if (marketingEmails !== undefined)
      updateData.notifications.marketingEmails = marketingEmails;
    if (twoFactorEnabled !== undefined)
      updateData.notifications.twoFactorEnabled = twoFactorEnabled;
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true },
    )
      .maxTimeMS(5000)
      .select("notifications");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND",
      });
    }

    res.json({
      message: "Settings updated successfully",
      emailNotifications: user.notifications.emailNotifications,
      pushNotifications: user.notifications.pushNotifications,
      marketingEmails: user.notifications.marketingEmails,
      twoFactorEnabled: user.notifications.twoFactorEnabled,
    });
  } catch (err) {
    console.error("❌ Update settings error:", err);
    res.status(500).json({
      error: "Error updating settings",
      details: err.message,
    });
  }
};

// GET ANALYTICS
export const getAnalytics = async (req, res) => {
  try {
    const userId = req.params.userId || req.auth?.userId;
    const range = req.query.range || "7days";
    if (!userId) {
      return res.status(400).json({
        error: "User ID not provided",
        code: "USER_ID_MISSING",
      });
    }
    // Calculate date range
    const daysMap = {
      "7days": 7,
      "30days": 30,
      "90days": 90,
    };
    const days = daysMap[range] || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    // Get user streams
    const streams = await Stream.find({
      creator: userId,
      createdAt: { $gte: startDate },
    }).maxTimeMS(5000);
    // If no streams exist or data is empty, return mock data
    if (streams.length === 0) {
      const mockData = getMockAnalytics(userId, range);
      return res.json(mockData);
    }
    // Calculate KPIs
    const totalStreams = streams.length;
    const totalViewers = streams.reduce(
      (sum, s) => sum + (s.totalViewers || 0),
      0,
    );
    const totalMessages = streams.reduce(
      (sum, s) => sum + (s.totalMessages || 0),
      0,
    );
    const totalDuration = streams.reduce((sum, s) => {
      if (s.startTime && s.endTime) {
        const duration = (new Date(s.endTime) - new Date(s.startTime)) / 60000; // minutes
        return sum + duration;
      }
      return sum;
    }, 0);
    const avgDuration =
      totalStreams > 0 ? Math.round(totalDuration / totalStreams) : 0;
    // Get previous period for growth calculation
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - days);
    const prevStreams = await Stream.find({
      creator: userId,
      createdAt: { $gte: prevStartDate, $lt: startDate },
    }).maxTimeMS(5000);
    const streamsGrowth =
      prevStreams.length > 0
        ? Math.round(
            ((totalStreams - prevStreams.length) / prevStreams.length) * 100,
          )
        : 0;
    const prevViewers = prevStreams.reduce(
      (sum, s) => sum + (s.totalViewers || 0),
      0,
    );
    const viewersGrowth =
      prevViewers > 0
        ? Math.round(((totalViewers - prevViewers) / prevViewers) * 100)
        : 0;
    const prevMessages = prevStreams.reduce(
      (sum, s) => sum + (s.totalMessages || 0),
      0,
    );
    const messagesGrowth =
      prevMessages > 0
        ? Math.round(((totalMessages - prevMessages) / prevMessages) * 100)
        : 0;
    // Generate chart data (daily breakdown)
    const chartData = {};
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      chartData[dateStr] = {
        date: dateStr,
        viewers: 0,
        messages: 0,
        streams: 0,
        duration: 0,
      };
    }
    // Populate chart data from streams
    streams.forEach((stream) => {
      const dateStr = new Date(stream.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (chartData[dateStr]) {
        chartData[dateStr].viewers += stream.totalViewers || 0;
        chartData[dateStr].messages += stream.totalMessages || 0;
        chartData[dateStr].streams += 1;
        if (stream.startTime && stream.endTime) {
          chartData[dateStr].duration +=
            (new Date(stream.endTime) - new Date(stream.startTime)) / 60000;
        }
      }
    });
    const viewersData = Object.values(chartData);
    const streamActivityData = Object.values(chartData);
    const messagesData = Object.values(chartData);
    // Top streams
    const topStreams = streams
      .sort((a, b) => (b.totalViewers || 0) - (a.totalViewers || 0))
      .slice(0, 5)
      .map((s) => ({
        title: s.title || "Untitled Stream",
        viewers: s.totalViewers || 0,
        duration:
          s.startTime && s.endTime
            ? Math.round((new Date(s.endTime) - new Date(s.startTime)) / 60000)
            : 0,
        date: s.createdAt,
      }));
    res.json({
      userId,
      timeRange: range,
      summary: {
        totalViews: totalViewers,
        totalWatchTime: Math.round(totalDuration),
        averageViewDuration:
          totalStreams > 0 ? (totalDuration / totalViewers).toFixed(2) : 0,
        totalStreams,
        peakHour: "20:00",
      },
      viewersOverTime: viewersData,
      engagementMetrics: messagesData,
      topVideos: topStreams,
    });
  } catch (err) {
    console.error("❌ Get analytics error:", err);
    res.status(500).json({
      error: "Error fetching analytics",
      details: err.message,
    });
  }
};

// Mock data generator for analytics
const getMockAnalytics = (userId, range) => {
  const daysMap = { "7days": 7, "30days": 30, "90days": 90 };
  const days = daysMap[range] || 7;

  // Generate daily data
  const viewersOverTime = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (let i = 0; i < days; i++) {
    viewersOverTime.push({
      date: dayNames[i % 7],
      viewers: Math.floor(Math.random() * 1200) + 100,
      duration: Math.floor(Math.random() * 2400) + 600,
    });
  }

  // Generate hourly engagement data
  const engagementMetrics = [
    { hour: "00:00", viewers: 45, comments: 12 },
    { hour: "06:00", viewers: 120, comments: 28 },
    { hour: "12:00", viewers: 380, comments: 95 },
    { hour: "18:00", viewers: 920, comments: 245 },
    { hour: "20:00", viewers: 1250, comments: 340 },
    { hour: "22:00", viewers: 780, comments: 198 },
  ];

  return {
    userId,
    timeRange: range,
    summary: {
      totalViews: 5420,
      totalWatchTime: 8640,
      averageViewDuration: "1.59",
      peakHour: "20:00",
      totalStreams: 12,
    },
    viewersOverTime,
    engagementMetrics,
    topVideos: [
      { title: "Gaming Highlights", views: 1200, duration: 45 },
      { title: "Live Q&A", views: 980, duration: 120 },
      { title: "Tutorial", views: 750, duration: 60 },
      { title: "Community Challenge", views: 620, duration: 90 },
      { title: "Late Night Chill Stream", views: 540, duration: 180 },
    ],
  };
};
