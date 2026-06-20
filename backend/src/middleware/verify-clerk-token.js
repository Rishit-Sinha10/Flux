/**
 * Clerk Token Validator Middleware
 * Validates Clerk JWT token and extracts user data
 *
 * Usage:
 *   import { verifyClerkToken } from "./middleware/verify-clerk-token.js";
 *   app.use(verifyClerkToken);
 */
import { jwtDecode } from "jwt-decode";
export const verifyClerkToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    // No token provided
    if (!authHeader) {
      console.warn("[verifyClerkToken] ⚠️ No Authorization header provided");
      // Don't fail here — let requireAuth() handle it
      return next();
    }
    // Extract token from "Bearer <token>"
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      console.warn(
        "[verifyClerkToken] ⚠️ Authorization header missing Bearer token",
      );
      return next();
    }

    // Decode token (without verification for now — clerkMiddleware will verify)
    let decoded;
    try {
      decoded = jwtDecode(token);
      console.log("[verifyClerkToken] ✅ Token decoded successfully");
      console.log(`[verifyClerkToken] Token sub (userId): ${decoded.sub}`);
      console.log(`[verifyClerkToken] Token iss (issuer): ${decoded.iss}`);
      console.log(
        `[verifyClerkToken] Token exp: ${new Date(decoded.exp * 1000).toISOString()}`,
      );
    } catch (decodeErr) {
      console.error(
        "[verifyClerkToken] ❌ Failed to decode token:",
        decodeErr.message,
      );
      return res.status(401).json({
        success: false,
        msg: "Token decoding failed",
        error: "Invalid JWT format",
      });
    }

    // Check if token is expired
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.warn("[verifyClerkToken] ⚠️ Token has expired");
      return res.status(401).json({
        success: false,
        msg: "Token expired",
        error: "Please sign in again",
      });
    }
    // Verify token is from Clerk
    const clerkDomain = process.env.CLERK_FRONTEND_API || "clerk.example.com";
    if (!decoded.iss || !decoded.iss.includes("clerk")) {
      console.error("[verifyClerkToken] ❌ Token issuer is not Clerk");
      return res.status(401).json({
        success: false,
        msg: "Invalid token issuer",
        error: "Token must be issued by Clerk",
      });
    }
    // Store decoded info in req for debugging
    req.clerkToken = {
      decoded,
      raw: token.substring(0, 20) + "...",
    };
    next();
  } catch (err) {
    console.error("[verifyClerkToken] ❌ Unexpected error:", err.message);
    res.status(500).json({
      success: false,
      msg: "Token validation error",
      error: err.message,
    });
  }
};
