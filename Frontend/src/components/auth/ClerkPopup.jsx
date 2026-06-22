import { SignInButton } from "@clerk/react";

/**
 * ClerkPopup - Sign In Button
 * 
 * This component only renders the Clerk sign-in button.
 * Navigation to dashboard is handled by login.jsx and signup.jsx
 * which watch for isSignedIn changes and redirect accordingly.
 */
export default function ClerkPopup() {
  return (
    <SignInButton mode="modal">
      <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
        Sign In
      </button>
    </SignInButton>
  );
}