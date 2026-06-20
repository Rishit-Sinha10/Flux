import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/auth/login";
import Signup from "./components/auth/signup";
import ForgotPassword from "./components/auth/forgot";
import ResetPassword from "./components/auth/reset";
import EmailSent from "./components/auth/mail";
import SmartSearchBar from "./components/common/searchbar";
import Navbar from "./components/common/navbar";
import ProtectedRoute from "./components/common/protectedroute";
import AboutUs from "./components/pages/Aboutus";
import { ErrorBoundary } from "./components/common/errorboundary";
import Layout from "./components/ui_layout/ui_layout";
import GoLiveLayout from "./components/ui_layout/ui_layout_go";
import ExploreLayout from "./components/ui_layout/ui_layout_explore";
import ProfileLayout from "./components/ui_layout/ui_layout_profile";
import StreamLayout from "./components/ui_layout/ui_layout_stream";
import StreamPage from "./components/profile/stream";
import Profile from "./components/pages/profile";
import Settings from "./components/pages/settings";
import AnalyticsDashboard from "./components/pages/analyticsDashboard";
import PaymentForm from "./components/payment/PaymentForm";
import PaymentHistory from "./components/payment/PaymentHistory";
import PaymentStats from "./components/payment/PaymentStats";
import Payment from "./components/pages/payment"

export default function App() {
  return (
    <>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<AboutUs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-sent" element={<EmailSent />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
          <Route path="/Live" element={<ProtectedRoute><GoLiveLayout /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
          <Route path="/Profile" element={<ProtectedRoute><ProfileLayout /></ProtectedRoute>} />
          <Route path="/Explore" element={<ProtectedRoute><ExploreLayout /></ProtectedRoute>} />
          <Route path="/Watch" element={<ProtectedRoute><StreamLayout /></ProtectedRoute>} />
          <Route path="/stream/:id" element={<ProtectedRoute><StreamPage /></ProtectedRoute>} />
          <Route path="/Payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/Payment/form" element={<ProtectedRoute><PaymentForm /></ProtectedRoute>} />
          <Route path="/Payment/History" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />
          <Route path="/payment/stats" element={<ProtectedRoute><PaymentStats /></ProtectedRoute>} />
          <Route path="*" element={<div>404 Page</div>} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}