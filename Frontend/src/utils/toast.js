// Simple toast utilities
let toastContainer = null;

if (typeof window !== 'undefined') {
  // Create toast container if it doesn't exist
  if (!document.getElementById('toast-container')) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '20px';
    toastContainer.style.left = '20px';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }
}

const showToast = (message, type = 'info', duration = 3000) => {
  if (typeof window === 'undefined') return;

  const container = document.getElementById('toast-container') || toastContainer;
  if (!container) return;

  const toast = document.createElement('div');
  const bgColor = {
    success: 'bg-green-900/80 border-green-700',
    error: 'bg-red-900/80 border-red-700',
    info: 'bg-blue-900/80 border-blue-700',
    warning: 'bg-yellow-900/80 border-yellow-700',
  }[type] || 'bg-slate-900/80 border-slate-700';

  const textColor = {
    success: 'text-green-100',
    error: 'text-red-100',
    info: 'text-blue-100',
    warning: 'text-yellow-100',
  }[type] || 'text-slate-100';

  toast.className = `${bgColor} ${textColor} border rounded-lg px-4 py-3 mb-2 backdrop-blur-sm animate-slide-in`;
  toast.textContent = message;

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.style.animation = 'slide-out 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

export const toast = {
  success: (message, duration) => showToast(message, 'success', duration),
  error: (message, duration) => showToast(message, 'error', duration),
  info: (message, duration) => showToast(message, 'info', duration),
  warning: (message, duration) => showToast(message, 'warning', duration),
};

export default toast;
