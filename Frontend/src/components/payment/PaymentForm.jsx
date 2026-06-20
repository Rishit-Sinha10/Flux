import { useState } from "react";
import { paymentAPI } from "../../services/apiClient";
import { Toast } from "../common/toast";
export default function PaymentForm({ onSuccess, userId }) {
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "card",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = "Please select a payment method";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await paymentAPI.createPayment({
        userId,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        description: formData.description || undefined,
      });

      if (response.data?.success) {
        Toast.success("Payment created successfully!");
        setFormData({
          amount: "",
          paymentMethod: "card",
          description: "",
        });
        onSuccess?.(response.data?.payment);
      }
    } catch (err) {
      console.error("Payment error:", err);
      const errorMsg = err.response?.data?.message || "Failed to create payment";
      Toast.error(errorMsg);
      setErrors({ submit: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Create Payment</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Amount (USD) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-slate-400">$</span>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`w-full pl-7 pr-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
                errors.amount
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-600 focus:ring-blue-500"
              }`}
            />
          </div>
          {errors.amount && (
            <p className="text-red-400 text-sm mt-1">{errors.amount}</p>
          )}
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Payment Method *
          </label>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 ${
              errors.paymentMethod
                ? "border-red-500 focus:ring-red-500"
                : "border-slate-600 focus:ring-blue-500"
            }`}
          >
            <option value="card">Credit Card</option>
            <option value="upi">UPI</option>
            <option value="wallet">Digital Wallet</option>
          </select>
          {errors.paymentMethod && (
            <p className="text-red-400 text-sm mt-1">{errors.paymentMethod}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter payment description"
            rows="3"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300">
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition"
        >
          {loading ? "Processing..." : "Create Payment"}
        </button>
      </form>

      {/* Payment Info */}
      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <p className="text-blue-300 text-sm">
          <strong>ℹ️ Note:</strong> Your payment will be securely processed. You will receive a transaction ID for reference.
        </p>
      </div>
    </div>
  );
}
