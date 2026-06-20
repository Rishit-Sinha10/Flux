import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "../src/context/auth_context";
import { AsyncErrorProvider } from "./components/common/asyncerrorhandler";
import App from "./App";
import "./index.css";
import { ClerkProvider } from "@clerk/react";

// ✅ NEW: Clerk Token Setup (BEFORE rendering AppProvider)
import { useAuth } from "@clerk/react";
import { setClerkTokenProvider } from "./services/apiClient";

function ClerkTokenInit({ children }) {
  const { getToken, isSignedIn } = useAuth();
  const [isReady, setIsReady] = useState(false);

  // Set token provider once, at the earliest possible moment
  React.useEffect(() => {
    if (getToken && isSignedIn) {
      console.log(
        "[ClerkTokenInit] ✅ User signed in, setting Clerk token provider",
      );
      setClerkTokenProvider(getToken);
      setIsReady(true);
    } else if (getToken && !isSignedIn) {
      console.log(
        "[ClerkTokenInit] ⏳ Clerk initialized but user not signed in yet",
      );
      setClerkTokenProvider(getToken);
      setIsReady(true);
    }
  }, [getToken, isSignedIn]);

  // Wait until token provider is ready, but don't block indefinitely
  if (!getToken) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#0f172a",
        }}
      >
        <div style={{ color: "#fff", textAlign: "center" }}>
          <p>Initializing Clerk authentication...</p>
        </div>
      </div>
    );
  }

  return children;
}

// ✅ Clerk Configuration with Validation and Error Handling
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Validate Publishable Key
if (!PUBLISHABLE_KEY || !PUBLISHABLE_KEY.startsWith("pk_")) {
  console.error("❌ Clerk: Invalid or missing VITE_CLERK_PUBLISHABLE_KEY");
  console.error("Expected format: pk_test_xxx or pk_live_xxx");
  console.error("Current value:", PUBLISHABLE_KEY);
}

// Add error handler for Clerk script loading failures
window.addEventListener("error", (event) => {
  if (event.filename && event.filename.includes("clerk")) {
    console.error("🔴 Clerk Script Error:", event.message);
    // Attempt to reload Clerk if it fails
    setTimeout(() => {
      console.log("🔄 Retrying Clerk initialization...");
      window.location.reload();
    }, 3000);
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: "#000000",
        },
      }}
    >
      <AsyncErrorProvider>
        <ClerkTokenInit>
          <BrowserRouter
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <AppProvider>
              <App />
            </AppProvider>
          </BrowserRouter>
        </ClerkTokenInit>
      </AsyncErrorProvider>
    </ClerkProvider>
  </React.StrictMode>,
);
