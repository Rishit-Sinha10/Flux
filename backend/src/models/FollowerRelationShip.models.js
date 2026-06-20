import mongoose from "mongoose";
const FollowerRelationShipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    CreatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: Boolean,
      default: false,
      required: true,
      enum: ["Online", "Inactive"],
    },
  },
  {
    timestamps: true,
  },
);
FollowerRelationShipSchema.index({
  userId: 1,
  CreatorId: 1,
  unique: true,
});
export const Folllower = mongoose.model("Follower", FollowerRelationShipSchema);
