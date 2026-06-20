import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { paymentAPI } from "../../services/apiClient";
import PaymentForm from "../payment/PaymentForm";
import PaymentHistory from "../payment/PaymentHistory";
import PaymentStats from "../payment/PaymentStats";
import { Toast } from "../common/toast";

export default function Payment() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("history");
  const [error, setError] = useState("");

  const fetchPayments = useCallback(async () => {
    try {
      if (!user?.id) return;
      
      const [historyResponse, statsResponse] = await Promise.all([
        paymentAPI.getPaymentHistory(user.id),
        paymentAPI.getPaymentStats(user.id),
      ]);

      setPayments(historyResponse.data?.payments || []);
      setStats(statsResponse.data?.stats || null);
      setError("");
    } catch (err) {
      console.error("Error fetching payment data:", err);
      setError("Failed to load payment information");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      navigate("/login");
      return;
    }
    fetchPayments();
  }, [isLoaded, user, navigate, fetchPayments]);

  const handlePaymentSuccess = async (paymentData) => {
    try {
      const response = await paymentAPI.createPayment({
        ...paymentData,
        userId: user.id,
      });

      if (response.data?.success) {
        Toast.success("Payment initiated successfully!");
        setActiveTab("history");
        fetchPayments();
      }
    } catch (err) {
      console.error("Payment error:", err);
      Toast.error(err.response?.data?.message || "Payment failed");
    }
  };

  const handleDeletePayment = async (transactionId) => {
    if (!window.confirm("Are you sure you want to delete this payment record?")) {
      return;
    }

    try {
      await paymentAPI.deletePayment(transactionId);
      Toast.success("Payment record deleted");
      fetchPayments();
    } catch (err) {
      console.error("Delete error:", err);
      Toast.error("Failed to delete payment");
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error && activeTab !== "new") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-300">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Payments</h1>
          <p className="text-slate-400">Manage your billing and payment methods</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === "history"
                ? "text-blue-400 border-blue-500"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }`}
          >
            Payment History
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === "stats"
                ? "text-blue-400 border-blue-500"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab("new")}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              activeTab === "new"
                ? "text-blue-400 border-blue-500"
                : "text-slate-400 border-transparent hover:text-slate-300"
            }`}
          >
            New Payment
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === "history" && (
            <PaymentHistory 
              payments={payments} 
              onDelete={handleDeletePayment}
              onRefresh={fetchPayments}
            />
          )}

          {activeTab === "stats" && stats && (
            <PaymentStats stats={stats} />
          )}

          {activeTab === "new" && (
            <PaymentForm 
              onSuccess={handlePaymentSuccess}
              userId={user?.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}
