import mongoose from "mongoose";
const ChatMessageSchema = new mongoose.Schema(
  {
    UserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    chatMessage: {
      required: true,
      type: String,
      default: " ",
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
    },
    file: {
      type: String,
      default: "",
    },
    fileurl: {
      type: String,
      default: "",
    },
    reactions: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      emoji: String,
    },
    status: {
      type: String,
      enum: ["Deleiverd", "Seen", "Unseen"],
      default: "",
      required: true,
    },
    idEdited: {
      type: Boolean,
      required: true,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    moderation: {
      flagged: {
        type: Boolean,
        default: false,
      },
      reason: String,
      score: Number,
    },
  },
  {
    timestamps: true,
  },
);

// ✅ INDEXES: Optimize chat message queries
ChatMessageSchema.index({ category: 1 }); // For finding messages in a chat room
ChatMessageSchema.index({ sender: 1 }); // For finding messages by sender
ChatMessageSchema.index({ UserId: 1 }); // For finding user's messages
ChatMessageSchema.index({ category: 1, createdAt: -1 }); // For sorted message retrieval

export const Message = mongoose.model("Message", ChatMessageSchema);
