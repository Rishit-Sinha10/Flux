import { Link } from "react-router-dom";
import AuthLayout from "./auth_layout";
export default function EmailSent(){
  return (
    <AuthLayout
      title="Check your email"
      subtitle="We've sent a reset link"
    >
      <div className="text-center">
        <div className="text-green-500 text-4xl mb-4">
          ✓
        </div>
        <p className="text-gray-600 text-sm">
          Please check your inbox and follow the instructions.
        </p>
        <Link
          to="/login"
          className="block mt-6 bg-indigo-600 text-white py-3 rounded-lg"
        >
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}