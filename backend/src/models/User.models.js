import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    isLive: {
      type: Boolean,
      default: false,
    },
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: false,
      },
      marketingEmails: {
        type: Boolean,
        default: false,
      },
      dataCollection: {
        type: Boolean,
        default: true,
      },
    },
    settings: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto",
      },
      language: {
        type: String,
        default: "en",
      },
      twoFactorEnabled: {
        type: Boolean,
        default: false,
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastseen: {
      type: Date,
      default: null,
    },
    security: {
      lastLogin: {
        type: Date,
        default: null,
      },
      loginAttempts: {
        type: Number,
        default: 0,
      },
      lockUntil: {
        type: Date,
        default: null,
      },
      resetToken: {
        type: String,
        default: null,
      },
      resetTokenExpiry: {
        type: Date,
        default: null,
      },
    },
    apiKeys: [
      {
        key: String,
        name: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        lastUsed: Date,
      },
    ],
  },
  { timestamps: true },
);

// ✅ CRITICAL INDEXES: Optimize query performance for frequently searched fields
userSchema.index({ clerkId: 1 }); // For finding users by Clerk ID (used in auth & analytics)
userSchema.index({ email: 1 }); // For finding users by email
userSchema.index({ username: 1 }); // For username lookups

const User = mongoose.model("User", userSchema);
export default User;
