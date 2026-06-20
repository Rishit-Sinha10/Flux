export default function PaymentStats({ stats }) {
  const StatCard = ({ icon, label, value, color = "bg-blue" }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`text-3xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-4">Payment Statistics</h2>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon="💰"
          label="Total Amount Spent"
          value={`$${stats.totalAmountSpent?.toFixed(2) || "0.00"}`}
          color="text-emerald-400"
        />
        <StatCard
          icon="📊"
          label="Total Payments"
          value={stats.totalPayments || 0}
          color="text-blue-400"
        />
        <StatCard
          icon="✅"
          label="Successful Payments"
          value={stats.successfulPayments || 0}
          color="text-green-400"
        />
        <StatCard
          icon="⏱"
          label="Pending Payments"
          value={stats.pendingPayments || 0}
          color="text-yellow-400"
        />
        <StatCard
          icon="❌"
          label="Failed Payments"
          value={stats.failedPayments || 0}
          color="text-red-400"
        />
        <StatCard
          icon="📈"
          label="Success Rate"
          value={
            stats.totalPayments > 0
              ? `${((stats.successfulPayments / stats.totalPayments) * 100).toFixed(1)}%`
              : "0%"
          }
          color="text-purple-400"
        />
      </div>

      {/* Payment Methods Breakdown */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Payment Methods</h3>
        <div className="space-y-4">
          <MethodItem
            icon="💳"
            name="Credit Card"
            count={stats.paymentMethods?.card || 0}
            total={stats.totalPayments}
          />
          <MethodItem
            icon="📱"
            name="UPI"
            count={stats.paymentMethods?.upi || 0}
            total={stats.totalPayments}
          />
          <MethodItem
            icon="👛"
            name="Digital Wallet"
            count={stats.paymentMethods?.wallet || 0}
            total={stats.totalPayments}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-700/50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-2">Summary</h3>
        <ul className="space-y-2 text-slate-300 text-sm">
          <li>
            • You have made{" "}
            <span className="text-white font-semibold">
              {stats.totalPayments || 0}
            </span>{" "}
            payment(s)
          </li>
          <li>
            • Total amount spent:{" "}
            <span className="text-white font-semibold">
              ${stats.totalAmountSpent?.toFixed(2) || "0.00"}
            </span>
          </li>
          <li>
            • Success rate:{" "}
            <span className="text-white font-semibold">
              {stats.totalPayments > 0
                ? `${((stats.successfulPayments / stats.totalPayments) * 100).toFixed(1)}%`
                : "N/A"}
            </span>
          </li>
          <li>
            • Most used method:{" "}
            <span className="text-white font-semibold">
              {getMostUsedMethod(stats.paymentMethods)}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function MethodItem({ icon, name, count, total }) {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="text-white font-semibold">{name}</span>
        </div>
        <div className="text-right">
          <p className="text-white font-semibold">{count}</p>
          <p className="text-slate-400 text-sm">{percentage}%</p>
        </div>
      </div>
      <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-500 h-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function getMostUsedMethod(methods) {
  if (!methods) return "None";
  const max = Math.max(
    methods.card || 0,
    methods.upi || 0,
    methods.wallet || 0
  );
  if (max === 0) return "None";
  if (methods.card === max) return "Credit Card";
  if (methods.upi === max) return "UPI";
  return "Digital Wallet";
}
