import Analytics from "../models/Analytics.models.js";
import Stream from "../models/stream.models.js";
import User from "../models/User.models.js";
import mongoose from "mongoose";

/**
 * Create or update analytics for a stream
 * POST /api/analytics/create
 */
export const createAnalytics = async (req, res) => {
  try {
    const {
      streamId,
      userId,
      totalViewers,
      peakViewers,
      averageWatchTime,
      category,
      streamDate,
      streamDuration,
      engagementRate,
    } = req.body;

    // Validation
    if (!streamId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Stream ID and User ID are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    // Check if analytics already exists for this stream
    const existingAnalytics = await Analytics.findOne({ streamId }).maxTimeMS(
      5000,
    );

    if (existingAnalytics) {
      // Update existing record
      const updatedAnalytics = await Analytics.findByIdAndUpdate(
        existingAnalytics._id,
        {
          totalViewers: totalViewers || existingAnalytics.totalViewers,
          peakViewers: Math.max(
            peakViewers || 0,
            existingAnalytics.peakViewers,
          ),
          averageWatchTime:
            averageWatchTime || existingAnalytics.averageWatchTime,
          engagementRate: engagementRate || existingAnalytics.engagementRate,
        },
        { new: true },
      );

      return res.status(200).json({
        success: true,
        message: "Analytics updated successfully",
        analytics: updatedAnalytics,
      });
    }

    // Create new analytics record
    const newAnalytics = new Analytics({
      streamId,
      userId,
      totalViewers: totalViewers || 0,
      peakViewers: peakViewers || 0,
      averageWatchTime: averageWatchTime || 0,
      totalWatchTime: totalViewers * (averageWatchTime || 0),
      category: category || "Gaming",
      streamDate: streamDate || new Date(),
      streamDuration: streamDuration || 0,
      engagementRate: engagementRate || 0,
    });

    await newAnalytics.save();

    console.log("✅ Analytics created for stream:", streamId);

    return res.status(201).json({
      success: true,
      message: "Analytics created successfully",
      analytics: newAnalytics,
    });
  } catch (error) {
    console.error("❌ Error creating analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create analytics",
      error: error.message,
    });
  }
};

/**
 * Get detailed analytics for a specific stream
 * GET /api/analytics/stream/:streamId
 */
export const getStreamAnalytics = async (req, res) => {
  try {
    const { streamId } = req.params;

    if (!streamId || !mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream ID format",
        code: "INVALID_STREAM_ID",
      });
    }

    const analytics = await Analytics.findOne({ streamId })
      .maxTimeMS(5000)
      .lean() // ✅ Optimization: Read-only query
      .populate("userId", "name email")
      .populate("streamId", "title category");

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: "Analytics not found for this stream",
        code: "ANALYTICS_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("❌ Error fetching stream analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stream analytics",
      error: error.message,
    });
  }
};
/**
 * Get comprehensive analytics for a specific user
 * GET /api/analytics/user/:userId
 */
export const getUserAnalytics = async (req, res) => {
  try {
    // ✅ Support both Clerk middleware and URL params
    let userId = req.auth?.userId || req.params.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        code: "NOT_AUTHENTICATED",
      });
    }
    // ✅ Convert Clerk userId to MongoDB ObjectId if needed
    let mongoUserId = userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findOne({ clerkId: userId }).maxTimeMS(5000);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User profile not found",
          code: "USER_NOT_FOUND",
        });
      }
      mongoUserId = user._id;
    }
    const userAnalytics = await Analytics.find({ userId: mongoUserId })
      .maxTimeMS(5000)
      .lean() // ✅ Optimization: Read-only query
      .sort({
        streamDate: -1,
      });

    if (userAnalytics.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No analytics data yet",
        aggregateStats: {
          totalStreams: 0,
          totalViewers: 0,
          peakViewers: 0,
          averageViewsPerStream: 0,
          totalWatchTime: 0,
          averageEngagement: 0,
          totalFollowersGained: 0,
          totalChatMessages: 0,
          totalLikes: 0,
          totalShares: 0,
        },
        recentStreams: [],
      });
    }

    // Calculate aggregate stats
    const aggregateStats = {
      totalStreams: userAnalytics.length,
      totalViewers: userAnalytics.reduce((sum, a) => sum + a.totalViewers, 0),
      peakViewers: Math.max(...userAnalytics.map((a) => a.peakViewers)),
      averageViewsPerStream:
        userAnalytics.reduce((sum, a) => sum + a.totalViewers, 0) /
        userAnalytics.length,
      totalWatchTime: userAnalytics.reduce(
        (sum, a) => sum + a.totalWatchTime,
        0,
      ),
      averageEngagement:
        userAnalytics.reduce((sum, a) => sum + a.engagementRate, 0) /
        userAnalytics.length,
      totalFollowersGained: userAnalytics.reduce(
        (sum, a) => sum + a.followersGained,
        0,
      ),
      totalChatMessages: userAnalytics.reduce(
        (sum, a) => sum + a.chatMessages,
        0,
      ),
      totalLikes: userAnalytics.reduce((sum, a) => sum + a.likes, 0),
      totalShares: userAnalytics.reduce((sum, a) => sum + a.shares, 0),
    };

    return res.status(200).json({
      success: true,
      aggregateStats,
      recentStreams: userAnalytics.slice(0, 10),
      totalRecords: userAnalytics.length,
    });
  } catch (error) {
    console.error("❌ Error fetching user analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user analytics",
      error: error.message,
    });
  }
};

/**
 * Get analytics within a date range
 * GET /api/analytics/range?startDate=&endDate=
 */
export const getAnalyticsByDateRange = async (req, res) => {
  try {
    // ✅ Use Clerk's userId from middleware (query params no longer needed)
    let userId = req.auth?.userId || req.query.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        code: "NOT_AUTHENTICATED",
      });
    }

    // ✅ Convert Clerk userId to MongoDB ObjectId if needed
    let mongoUserId = userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findOne({ clerkId: userId }).maxTimeMS(5000);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User profile not found",
          code: "USER_NOT_FOUND",
        });
      }
      mongoUserId = user._id;
    }

    const { startDate, endDate } = req.query;
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const end = endDate ? new Date(endDate) : new Date();

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date",
        code: "INVALID_DATE_RANGE",
      });
    }

    const analytics = await Analytics.find({
      userId: mongoUserId,
      streamDate: { $gte: start, $lte: end },
    })
      .maxTimeMS(5000)
      .lean() // ✅ Optimization: Read-only query
      .sort({ streamDate: -1 });

    if (analytics.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No analytics in this date range",
        analytics: [],
        stats: {
          totalStreams: 0,
          totalViewers: 0,
          totalWatchTime: 0,
        },
      });
    }

    // Calculate stats for the date range
    const rangeStats = {
      streamsInRange: analytics.length,
      totalViewersInRange: analytics.reduce(
        (sum, a) => sum + a.totalViewers,
        0,
      ),
      averageViewersPerStream:
        analytics.reduce((sum, a) => sum + a.totalViewers, 0) /
        analytics.length,
      peakViewersInRange: Math.max(...analytics.map((a) => a.peakViewers)),
      averageEngagementInRange:
        analytics.reduce((sum, a) => sum + a.engagementRate, 0) /
        analytics.length,
      growthTrend: calculateGrowthTrend(analytics),
    };

    return res.status(200).json({
      success: true,
      dateRange: { start, end },
      rangeStats,
      analytics,
    });
  } catch (error) {
    console.error("❌ Error fetching analytics by date range:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics by date range",
      error: error.message,
    });
  }
};

/**
 * Generate comprehensive analytics report
 * GET /api/analytics/report/:userId
 *
 * ⏱️ TIMEOUT SAFETY: Response guaranteed within 10 seconds
 * ✅ Non-blocking: If analytics generation is slow, returns partial data
 */
export const generateAnalyticsReport = async (req, res) => {
  const startTime = Date.now();
  const timings = {};

  // 🔐 CRITICAL: Set timeout safety wrapper
  // This ensures we ALWAYS respond, even if MongoDB query hangs
  let timeoutHandle = setTimeout(() => {
    if (!res.headersSent) {
      console.error(
        "⏰ [analytics] TIMEOUT SAFETY TRIGGERED: Sending error response",
      );
      console.error("[analytics] Partial timings:", timings);
      res.status(504).json({
        success: false,
        message: "Analytics report generation timeout - request took too long",
        code: "ANALYTICS_TIMEOUT",
        note: "This is a failsafe. Backend operations were still running.",
        timings, // Include partial timings for debugging
      });
    }
  }, 10000); // 10 second timeout safety net

  try {
    // ✅ Fails fast if MongoDB is not connected
    if (!global.mongoConnected) {
      clearTimeout(timeoutHandle);
      timings.total = Date.now() - startTime;
      console.error(
        "❌ [analytics] MongoDB not connected. Total time:",
        timings.total + "ms",
      );
      return res.status(503).json({
        success: false,
        message: "Database is not connected. Please check MongoDB.",
        code: "DB_DISCONNECTED",
        timings,
      });
    }
    timings.mongoCheck = Date.now() - startTime;

    console.log(
      "📡 [analytics] Analytics report route hit for userId:",
      req.auth?.userId || req.params.userId,
    );

    // ✅ Support both:
    // 1. Clerk userId from middleware (req.auth.userId) — prefer this
    // 2. userId from URL params (for backward compatibility)
    let userId = req.auth?.userId || req.params.userId;
    if (!userId) {
      clearTimeout(timeoutHandle);
      timings.total = Date.now() - startTime;
      console.error(
        "❌ [analytics] No userId provided. Total time:",
        timings.total + "ms",
      );
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        code: "NOT_AUTHENTICATED",
        timings,
      });
    }
    timings.userIdCheck = Date.now() - startTime;

    // ✅ If userId is a Clerk string ID, look up the MongoDB user by clerkId
    let mongoUserId = userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      // This is a Clerk ID (string), find the MongoDB user
      console.log("🔍 [analytics] Converting Clerk ID to MongoDB ID:", userId);
      const clerkLookupStart = Date.now();
      const user = await User.findOne({ clerkId: userId }).maxTimeMS(5000);
      timings.clerkUserLookup = Date.now() - clerkLookupStart;
      console.log(
        `⏱️  [analytics] Clerk user lookup took ${timings.clerkUserLookup}ms`,
      );

      if (!user) {
        clearTimeout(timeoutHandle);
        timings.total = Date.now() - startTime;
        console.error(
          "❌ [analytics] User profile not found. Total time:",
          timings.total + "ms",
          "Timings:",
          timings,
        );
        return res.status(404).json({
          success: false,
          message:
            "User profile not found. Please complete your profile setup.",
          code: "USER_NOT_FOUND",
          timings,
          clerkId: userId,
        });
      }
      mongoUserId = user._id;
      console.log("✅ [analytics] Found MongoDB user:", mongoUserId);
    } else {
      timings.mongoIdProvided = Date.now() - startTime;
    }

    console.log(
      "📊 [analytics] Fetching analytics for MongoDB user:",
      mongoUserId,
    );
    const analyticsStart = Date.now();
    const userAnalytics = await Analytics.find({ userId: mongoUserId })
      .maxTimeMS(5000)
      .lean() // ✅ Optimization: Read-only query
      .sort({
        streamDate: -1,
      });
    timings.analyticsFetch = Date.now() - analyticsStart;
    console.log(
      `⏱️  [analytics] Analytics fetch took ${timings.analyticsFetch}ms, found ${userAnalytics.length} records`,
    );

    if (userAnalytics.length === 0) {
      clearTimeout(timeoutHandle);
      timings.total = Date.now() - startTime;
      console.warn(
        "⚠️ [analytics] No analytics data for user:",
        userId,
        "Time:",
        timings.total + "ms",
      );
      return res.status(404).json({
        success: false,
        message: "No analytics data available for report",
        code: "NO_DATA",
        timings,
      });
    }

    console.log(
      "✅ [analytics] Found",
      userAnalytics.length,
      "analytics records",
    );

    // Comprehensive report generation
    const reportStart = Date.now();
    const report = {
      userId,
      generatedAt: new Date(),
      summary: {
        totalStreams: userAnalytics.length,
        totalViewers: userAnalytics.reduce((sum, a) => sum + a.totalViewers, 0),
        totalWatchTime: userAnalytics.reduce(
          (sum, a) => sum + a.totalWatchTime,
          0,
        ),
        averageViewersPerStream:
          userAnalytics.reduce((sum, a) => sum + a.totalViewers, 0) /
          userAnalytics.length,
        peakViewers: Math.max(...userAnalytics.map((a) => a.peakViewers)),
        averageEngagementRate:
          userAnalytics.reduce((sum, a) => sum + a.engagementRate, 0) /
          userAnalytics.length,
      },
      engagement: {
        totalFollowersGained: userAnalytics.reduce(
          (sum, a) => sum + a.followersGained,
          0,
        ),
        totalFollowersLost: userAnalytics.reduce(
          (sum, a) => sum + a.followersLost,
          0,
        ),
        netFollowersGained:
          userAnalytics.reduce((sum, a) => sum + a.followersGained, 0) -
          userAnalytics.reduce((sum, a) => sum + a.followersLost, 0),
        totalChatMessages: userAnalytics.reduce(
          (sum, a) => sum + a.chatMessages,
          0,
        ),
        totalLikes: userAnalytics.reduce((sum, a) => sum + a.likes, 0),
        totalShares: userAnalytics.reduce((sum, a) => sum + a.shares, 0),
      },
      deviceBreakdown: calculateDeviceBreakdown(userAnalytics),
      topRegions: calculateTopRegions(userAnalytics),
      categoryData: calculateCategoryData(userAnalytics),
      topPerformingStreams: userAnalytics
        .sort((a, b) => b.totalViewers - a.totalViewers)
        .slice(0, 5)
        .map((a) => ({
          streamId: a.streamId,
          viewers: a.totalViewers,
          engagementRate: a.engagementRate,
          date: a.streamDate,
        })),
      trends: {
        weeklyGrowth: calculateWeeklyGrowth(userAnalytics),
        monthlyGrowth: calculateMonthlyGrowth(userAnalytics),
      },
    };
    timings.reportGeneration = Date.now() - reportStart;
    timings.total = Date.now() - startTime;

    console.log(
      `✅ [analytics] Report generated successfully in ${timings.total}ms`,
      timings,
    );
    clearTimeout(timeoutHandle); // ✅ Cancel timeout since we're responding
    return res.status(200).json({
      success: true,
      report,
      timings, // Include timings for debugging
    });
  } catch (error) {
    clearTimeout(timeoutHandle);
    timings.total = Date.now() - startTime;
    console.error(
      "❌ [analytics] Error generating analytics report:",
      error.message,
    );
    console.error("⏱️  [analytics] Error occurred after", timings.total + "ms");
    console.error("[analytics] Partial timings:", timings);

    // Failsafe: Don't block UI if there's an error
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate analytics report",
        error: error.message,
        code: "ANALYTICS_ERROR",
        note: "Dashboard will still render with partial data",
        timings,
      });
    }
  }
};

/**
 * Update analytics engagement metrics
 * PUT /api/analytics/engagement/:streamId
 */
export const updateEngagementMetrics = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { likes, shares, chatMessages } = req.body;

    if (!streamId || !mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream ID format",
        code: "INVALID_STREAM_ID",
      });
    }

    const updatedAnalytics = await Analytics.findOneAndUpdate(
      { streamId },
      {
        $inc: {
          likes: likes || 0,
          shares: shares || 0,
          chatMessages: chatMessages || 0,
        },
      },
      { new: true },
    ).maxTimeMS(5000);
    if (!updatedAnalytics) {
      return res.status(404).json({
        success: false,
        message: "Analytics not found",
        code: "ANALYTICS_NOT_FOUND",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Engagement metrics updated",
      analytics: updatedAnalytics,
    });
  } catch (error) {
    console.error("❌ Error updating engagement metrics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update engagement metrics",
      error: error.message,
    });
  }
};

// ============== HELPER FUNCTIONS ==============

function calculateGrowthTrend(analytics) {
  if (analytics.length < 2) return 0;
  const recentAvg =
    analytics
      .slice(0, Math.ceil(analytics.length / 2))
      .reduce((sum, a) => sum + a.totalViewers, 0) /
    Math.ceil(analytics.length / 2);
  const earlierAvg =
    analytics
      .slice(Math.ceil(analytics.length / 2))
      .reduce((sum, a) => sum + a.totalViewers, 0) /
    Math.floor(analytics.length / 2);
  return (((recentAvg - earlierAvg) / earlierAvg) * 100).toFixed(2);
}

function calculateDeviceBreakdown(analytics) {
  const breakdown = {
    mobile: 0,
    desktop: 0,
    tablet: 0,
  };

  analytics.forEach((a) => {
    breakdown.mobile += a.deviceTypes.mobile || 0;
    breakdown.desktop += a.deviceTypes.desktop || 0;
    breakdown.tablet += a.deviceTypes.tablet || 0;
  });

  return breakdown;
}

function calculateTopRegions(analytics) {
  const regions = {};

  analytics.forEach((a) => {
    a.regions?.forEach((region) => {
      regions[region.country] = (regions[region.country] || 0) + region.viewers;
    });
  });

  return Object.entries(regions)
    .map(([country, viewers]) => ({ country, viewers }))
    .sort((a, b) => b.viewers - a.viewers)
    .slice(0, 10);
}

function calculateCategoryData(analytics) {
  const categories = {};

  analytics.forEach((a) => {
    if (a.category) {
      categories[a.category] = (categories[a.category] || 0) + a.totalViewers;
    }
  });

  return Object.entries(categories).map(([category, viewers]) => ({
    category,
    viewers,
  }));
}

function calculateWeeklyGrowth(analytics) {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const thisWeek = analytics
    .filter((a) => new Date(a.streamDate) >= weekAgo)
    .reduce((sum, a) => sum + a.totalViewers, 0);

  const lastWeek = analytics
    .filter(
      (a) =>
        new Date(a.streamDate) >= new Date(weekAgo - 7 * 24 * 60 * 60 * 1000) &&
        new Date(a.streamDate) < weekAgo,
    )
    .reduce((sum, a) => sum + a.totalViewers, 0);

  return lastWeek > 0
    ? (((thisWeek - lastWeek) / lastWeek) * 100).toFixed(2)
    : 0;
}

function calculateMonthlyGrowth(analytics) {
  const now = new Date();
  const monthAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    now.getDate(),
  );

  const thisMonth = analytics
    .filter((a) => new Date(a.streamDate) >= monthAgo)
    .reduce((sum, a) => sum + a.totalViewers, 0);

  const lastMonth = analytics
    .filter(
      (a) =>
        new Date(a.streamDate) >=
          new Date(
            monthAgo.getFullYear(),
            monthAgo.getMonth() - 1,
            monthAgo.getDate(),
          ) && new Date(a.streamDate) < monthAgo,
    )
    .reduce((sum, a) => sum + a.totalViewers, 0);

  return lastMonth > 0
    ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(2)
    : 0;
}
