import mongoose from "mongoose";
const PaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      currency: "USD",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "card", "wallet"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    description: String,
  },
  { timestamps: true },
);
const Payment = mongoose.model("Payment", PaymentSchema);
export default Payment;
