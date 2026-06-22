import User from "../models/User.models.js";
import { Folllower } from "../models/FollowerRelationShip.models.js";
export const getFollow = async (req, res, err, next) => {
  try {
    const followId = req.user.id();
    const followingId = req.param.UserId();
    if (followId === followingId) {
      return res.status(404).json({ msg: "User Could Not Follow Itself" });
    }
    const existingFollower = await Folllower.findOne({
      UserId: followId,
      CreatorId: followingId,
    });
    if (existingFollower) {
      return res(400).json({
        message: "User Already Follow",
      });
    }
    const targetUser = await User.findById(followingId);
    const currentUser = await User.findById(followId);
    if (
      targetUser.blockedUsers.includes(followId) ||
      currentUser.blockedUsers.includes(followingId)
    ) {
      return res.status(403).json({
        message: "User is In Blocked List of Follower",
      });
    }
    const follow = await follow.create({
      follower: followId,
      following: followingId,
    });
    await User.findByIdAndUpdate(followId, {
      $inc: { followingcount: 1 },
    });
    await User.findByIdAndUpdate(followingId, {
      $inc: { followerscount: 1 },
    });
    return res.status(201).json({
      message: "User Followed Succesfully",
    });
  } catch (error) {
    console.error("Follow error", error);
    res.status(401).json({
      error: "error.message",
    });
  }
};
export const getUnfollow = async (req, res, err, next) => {
  try {
    const followId = req.user.id();
    const followingId = req.param.UserId();
    if (!followId)
      res.status(400).json({
        messgae: "You cant Follow This User",
      });
    const follow = await follow.findByIdAndDelete({
      follower: followId,
      following: followingId,
    });
    await User.findByIdAndDelete(followId, {
      $inc: { followingcount: -1 },
    });
    await User.findByIdAndDelete(followingId, {
      $inc: { followerscount: -1 },
    });
    return res.status(201).json({
      message: "User UnFollowed Succesfully",
    });
  } catch (error) {
    console.error("Follow error", error);
    res.status(401).json({
      error: "error.message",
    });
  }
};
// Check if current user follows another user
export const checkFollowStatus = async (req, res) => {
  try {
    const { userId, targetUserId } = req.query;

    if (!userId || !targetUserId) {
      return res.status(400).json({
        success: false,
        message: "userId and targetUserId are required",
      });
    }

    const following = await FollowerRelationShip.findOne({
      follower: userId,
      creator: targetUserId,
      isActive: true,
    });

    res.json({
      success: true,
      isFollowing: !!following,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const UserId = req.user.params();
    const followers = await follow
      .find({ following: UserId })
      .populate("Follower", "Username")
      .sort({ createdAt: -1 });
    return res.status(200).json({
      count: followers.length(),
      followers,
    });
  } catch (error) {
    console.log(error);
    res.status(409).status({
      error: `Could Not Get The followers${error}`,
    });
  }
};
export const getFollowing = async (req, res) => {
  try {
    const UserId = req.user.params();
    const following = await following
      .find({ following: UserId })
      .populate("Followering", "Username")
      .sort({ createdAt: -1 });
    return res.status(200).json({
      count: following.length(),
      following,
    });
  } catch (error) {
    console.log(error);
    res.status(409).status({
      error: `Could Not Get The followers${error}`,
    });
  }
};
export const CheckFollowStatus = async (req, res) => {
  try {
    const followerId = req.User.body();
    const followingId = req.User.params();
    const follow = await follow.findOne({
      follow: followerId,
      following: followingId,
    });
    return res.status(200).json({
      message: "User Succesfully Follows",
    });
  } catch (error) {
    res.status(409).json({
      error: "User CouldNot Succesfully Follows The User",
    });
  }
};
