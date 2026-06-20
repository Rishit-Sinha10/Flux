import { useState } from "react";
import { paymentAPI } from "../../services/apiClient";
import { Toast } from "../common/toast";

export default function PaymentHistory({ payments, onDelete, onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);
  const [verifying, setVerifying] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "bg-green-900/30 text-green-300 border-green-700";
      case "pending":
        return "bg-yellow-900/30 text-yellow-300 border-yellow-700";
      case "failed":
        return "bg-red-900/30 text-red-300 border-red-700";
      default:
        return "bg-slate-700/30 text-slate-300 border-slate-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return "✓";
      case "pending":
        return "⏱";
      case "failed":
        return "✕";
      default:
        return "?";
    }
  };

  const handleVerifyPayment = async (transactionId) => {
    setVerifying(transactionId);
    try {
      const response = await paymentAPI.verifyPayment(transactionId);
      if (response.data?.success) {
        Toast.success(`Payment status: ${response.data?.status}`);
        onRefresh?.();
      }
    } catch (err) {
      console.error("Verify error:", err);
      Toast.error("Failed to verify payment");
    } finally {
      setVerifying(null);
    }
  };

  const handleDelete = async (transactionId) => {
    onDelete?.(transactionId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (payments.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
        <div className="text-slate-400">
          <div className="text-4xl mb-2">💳</div>
          <p className="text-lg">No payments found</p>
          <p className="text-sm mt-1">Create your first payment to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-4">Payment History</h2>
      
      <div className="grid gap-4">
        {payments.map((payment) => (
          <div
            key={payment._id}
            className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition"
          >
            {/* Main Row */}
            <div
              onClick={() =>
                setExpandedId(expandedId === payment._id ? null : payment._id)
              }
              className="p-4 cursor-pointer hover:bg-slate-700/30 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">
                    {payment.paymentMethod === "card"
                      ? "💳"
                      : payment.paymentMethod === "upi"
                      ? "📱"
                      : "👛"}
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      ${payment.amount.toFixed(2)}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {payment.paymentMethod.charAt(0).toUpperCase() +
                        payment.paymentMethod.slice(1)}{" "}
                      • {formatDate(payment.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={`px-3 py-1 rounded-full border text-sm font-semibold flex items-center gap-2 ${getStatusColor(
                      payment.paymentStatus
                    )}`}
                  >
                    <span>{getStatusIcon(payment.paymentStatus)}</span>
                    {payment.paymentStatus.charAt(0).toUpperCase() +
                      payment.paymentStatus.slice(1)}
                  </div>
                  <span
                    className={`text-slate-400 transition ${
                      expandedId === payment._id ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === payment._id && (
              <div className="bg-slate-900/50 border-t border-slate-700 p-4">
                <div className="grid md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <p className="text-slate-400 text-sm">Transaction ID</p>
                    <p className="text-white font-mono text-sm break-all">
                      {payment.transactionId}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Payment Method</p>
                    <p className="text-white">
                      {payment.paymentMethod.charAt(0).toUpperCase() +
                        payment.paymentMethod.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Amount</p>
                    <p className="text-white font-semibold">
                      ${payment.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Status</p>
                    <p className="text-white">
                      {payment.paymentStatus.charAt(0).toUpperCase() +
                        payment.paymentStatus.slice(1)}
                    </p>
                  </div>
                  {payment.description && (
                    <div className="md:col-span-2">
                      <p className="text-slate-400 text-sm">Description</p>
                      <p className="text-white">{payment.description}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerifyPayment(payment.transactionId)}
                    disabled={verifying === payment.transactionId}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-lg font-semibold transition text-sm"
                  >
                    {verifying === payment.transactionId
                      ? "Verifying..."
                      : "Verify Payment"}
                  </button>
                  {payment.paymentStatus === "pending" && (
                    <button
                      onClick={() => handleDelete(payment.transactionId)}
                      className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg font-semibold transition border border-red-700 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
