import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import Navbar from "../common/navbar";
import Sidebar from "../common/sidebar";
import { paymentAPI } from "../../services/apiClient";
import PaymentForm from "../payment/PaymentForm";
import PaymentHistory from "../payment/PaymentHistory";
import PaymentStats from "../payment/PaymentStats";
import { Toast } from "../common/toast";

export default function Payment() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
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
    if (!user) { navigate("/login"); return; }
    fetchPayments();
  }, [isLoaded, user, navigate, fetchPayments]);

  const handlePaymentSuccess = async (paymentData) => {
    try {
      const response = await paymentAPI.createPayment({ ...paymentData, userId: user.id });
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
    if (!window.confirm("Are you sure you want to delete this payment record?")) return;
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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-t-transparent mb-4 mx-auto" />
          <p className="text-gray-500">Loading payment information...</p>
        </div>
      </div>
    );
  }

  const content = (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your billing and payment methods</p>
      </div>

      {error && activeTab !== "new" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-6">{error}</div>
      )}

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {[
          { key: "history", label: "Payment History" },
          { key: "stats", label: "Statistics" },
          { key: "new", label: "New Payment" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition ${
              activeTab === tab.key
                ? "text-red-600 border-red-500"
                : "text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "history" && <PaymentHistory payments={payments} onDelete={handleDeletePayment} onRefresh={fetchPayments} />}
      {activeTab === "stats" && stats && <PaymentStats stats={stats} />}
      {activeTab === "new" && <PaymentForm onSuccess={handlePaymentSuccess} userId={user?.id} />}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${isCollapsed ? "ml-0" : "ml-64"}`}>
        <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {content}
        </main>
      </div>
    </div>
  );
}
