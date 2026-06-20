import Payment from "../models/Payment.models.js";
import mongoose from "mongoose";
/**
 * Create a new payment record
 * POST /api/payment/create
 */
export const createPayment = async (req, res) => {
  try {
    const { userId, amount, paymentMethod, description } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        code: "MISSING_USER_ID",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
        code: "INVALID_AMOUNT",
      });
    }

    if (!paymentMethod || !["upi", "card", "wallet"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Valid payment method is required (upi, card, wallet)",
        code: "INVALID_METHOD",
      });
    }

    // Check if userId is valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        code: "INVALID_USER_ID",
      });
    }
    // Generate transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;
    // Create payment
    const newPayment = new Payment({
      userId,
      amount,
      paymentMethod,
      paymentStatus: "pending",
      transactionId,
      description: description || "Payment for platform services",
    });
    await newPayment.save();
    console.log("✅ Payment created:", transactionId);
    return res.status(201).json({
      success: true,
      message: "Payment initiated successfully",
      payment: newPayment,
      transactionId,
    });
  } catch (error) {
    console.error("❌ Payment creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error.message,
    });
  }
};
/**
 * Get payment history for a user
 * GET /api/payment/history/:userId
 *
 * ⏱️ TIMEOUT SAFETY: Response guaranteed within 10 seconds
 */
export const getPaymentHistory = async (req, res) => {
  // 🔐 CRITICAL: Set timeout safety wrapper
  let timeoutHandle = setTimeout(() => {
    if (!res.headersSent) {
      console.error(
        "⏰ [payment] TIMEOUT SAFETY TRIGGERED: Sending error response",
      );
      return res.status(504).json({
        success: false,
        message: "Payment history fetch timeout - request took too long",
        code: "PAYMENT_HISTORY_TIMEOUT",
        payments: [], // Return empty array for graceful degradation
      });
    }
  }, 10000); // 10 second timeout safety net

  try {
    console.log(
      "📡 [payment] Payment history route hit for userId:",
      req.params.userId,
    );

    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      clearTimeout(timeoutHandle);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        code: "INVALID_USER_ID",
      });
    }

    const payments = await Payment.find({ userId })
      .maxTimeMS(5000)
      .lean() // ✅ Optimization: Read-only query
      .sort({ createdAt: -1 });

    console.log("✅ [payment] Found", payments.length, "payment records");
    clearTimeout(timeoutHandle);

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    clearTimeout(timeoutHandle);
    console.error(
      "❌ [payment] Error fetching payment history:",
      error.message,
    );
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch payment history",
        error: error.message,
        code: "PAYMENT_ERROR",
        payments: [], // Graceful degradation
      });
    }
  }
};
/**
 * Verify payment status
 * GET /api/payment/verify/:transactionId
 */
export const verifyPayment = async (req, res) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required",
        code: "MISSING_TRANSACTION_ID",
      });
    }

    const payment = await Payment.findOne({ transactionId })
      .maxTimeMS(5000)
      .lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
        code: "PAYMENT_NOT_FOUND",
      });
    }
    return res.status(200).json({
      success: true,
      payment,
      status: payment.paymentStatus,
    });
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};
/**
 * Update payment status
 * PUT /api/payment/status/:transactionId
 */
export const updatePaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { paymentStatus } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required",
        code: "MISSING_TRANSACTION_ID",
      });
    }

    if (
      !paymentStatus ||
      !["pending", "success", "failed"].includes(paymentStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid payment status is required (pending, success, failed)",
        code: "INVALID_STATUS",
      });
    }
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId },
      { paymentStatus },
      { new: true },
    ).maxTimeMS(5000);
    if (!updatedPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
        code: "PAYMENT_NOT_FOUND",
      });
    }
    console.log(
      `✅ Payment ${transactionId} status updated to ${paymentStatus}`,
    );
    return res.status(200).json({
      success: true,
      message: "Payment status updated",
      payment: updatedPayment,
    });
  } catch (error) {
    console.error("❌ Error updating payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payment status",
      error: error.message,
    });
  }
};
/**
 * Get payment statistics for a user
 * GET /api/payment/stats/:userId
 */
export const getPaymentStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        code: "INVALID_USER_ID",
      });
    }
    const payments = await Payment.find({ userId }).maxTimeMS(5000);
    const stats = {
      totalPayments: payments.length,
      totalAmountSpent: payments.reduce((sum, p) => sum + p.amount, 0),
      successfulPayments: payments.filter((p) => p.paymentStatus === "success")
        .length,
      failedPayments: payments.filter((p) => p.paymentStatus === "failed")
        .length,
      pendingPayments: payments.filter((p) => p.paymentStatus === "pending")
        .length,
      paymentMethods: {
        upi: payments.filter((p) => p.paymentMethod === "upi").length,
        card: payments.filter((p) => p.paymentMethod === "card").length,
        wallet: payments.filter((p) => p.paymentMethod === "wallet").length,
      },
    };
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("❌ Error fetching payment stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment statistics",
      error: error.message,
    });
  }
};
/**
 * Delete a payment record
 * DELETE /api/payment/:transactionId
 */
export const deletePayment = async (req, res) => {
  try {
    const { transactionId } = req.params;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required",
        code: "MISSING_TRANSACTION_ID",
      });
    }
    const deletedPayment = await Payment.findOneAndDelete({
      transactionId,
    }).maxTimeMS(5000);
    if (!deletedPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
        code: "PAYMENT_NOT_FOUND",
      });
    }
    console.log(`✅ Payment ${transactionId} deleted`);
    return res.status(200).json({
      success: true,
      message: "Payment deleted successfully",
      payment: deletedPayment,
    });
  } catch (error) {
    console.error("❌ Error deleting payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete payment",
      error: error.message,
    });
  }
};
