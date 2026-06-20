import express from "express";
import {
  createPayment,
  getPaymentHistory,
  verifyPayment,
  updatePaymentStatus,
  getPaymentStats,
  deletePayment,
} from "../controller/payment.controller.js";
import { requireAuth } from "@clerk/express";
const router = express.Router();
/**
 * Payment API Routes
 * Base URL: /api/payment
 */
// ==================== PUBLIC ROUTES ====================
// Verify payment (public - just needs transaction ID)
router.get("/verify/:transactionId", verifyPayment);
// ==================== PROTECTED ROUTES (Clerk Auth) ====================
// Create payment
router.post("/create", requireAuth, createPayment);
// Get payment history for user
router.get("/history/:userId", requireAuth, getPaymentHistory);
// Get payment statistics
router.get("/stats/:userId", requireAuth, getPaymentStats);
// Update payment status
router.put("/status/:transactionId", requireAuth, updatePaymentStatus);
// Delete payment record
router.delete("/:transactionId", requireAuth, deletePayment);
export default router;
