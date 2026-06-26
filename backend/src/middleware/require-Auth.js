import { jwtDecode } from "jwt-decode";
export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized - No token provided",
      });
    }
    const token = authHeader.slice(7);
    const decoded = jwtDecode(token);
    // Check expiry
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return res.status(401).json({
        success: false,
        error: "Token expired - Please sign in again",
      });
    }
    // Check issuer is Clerk
    if (!decoded.iss || !decoded.iss.includes("clerk")) {
      return res.status(401).json({
        success: false,
        error: "Invalid token issuer",
      });
    }
    // Attach userId to req — same shape Clerk middleware uses
    req.auth = { userId: decoded.sub };
    req.userId = decoded.sub;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
};
