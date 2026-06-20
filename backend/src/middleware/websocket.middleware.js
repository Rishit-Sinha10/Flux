// middleware/websocket.middleware.js
// WebSocket authentication using custom JWT

import { verifyCustomJWT, isTokenRevoked } from "../utils/jwt.utils.js";

/**
 * Middleware for Socket.IO authentication
 * Attach to io.use() for connection-level auth
 */
export const websocketAuth = (redisClient) => {
  return async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        console.log("❌ WebSocket connection rejected: No token");
        return next(
          new Error("WebSocket authentication failed: No token provided"),
        );
      }

      // Verify token
      const decoded = verifyCustomJWT(token, "WEBSOCKET");

      // Check if token is revoked
      const revoked = await isTokenRevoked(decoded.jti, redisClient);
      if (revoked) {
        console.log("❌ WebSocket connection rejected: Token revoked");
        return next(new Error("Token has been revoked"));
      }

      // Attach decoded token to socket
      socket.userId = decoded.userId;
      socket.tokenJti = decoded.jti;
      socket.connectedAt = new Date();

      console.log(`✅ WebSocket authenticated for user: ${decoded.userId}`);
      next();
    } catch (error) {
      console.error("❌ WebSocket authentication error:", error.message);
      next(new Error(`WebSocket authentication failed: ${error.message}`));
    }
  };
};

/**
 * Emit error handler for socket events
 */
export const handleSocketError = (socket, eventName) => {
  return (error) => {
    console.error(`❌ Socket error in ${eventName}:`, error.message);
    socket.emit("error", {
      event: eventName,
      message: error.message,
      code: "SOCKET_ERROR",
    });
  };
};

export default websocketAuth;
