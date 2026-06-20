// utils/jwt.utils.js
// Custom JWT generation and verification for streaming sessions
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
const CUSTOM_JWT_SECRET = process.env.CUSTOM_JWT_SECRET || 'streaming-secret-key';
const TOKEN_JWTID_PREFIX = 'jti_';
/**
 * Generate JWT for live streaming sessions
 * Token is short-lived (15 minutes by default)
 * Used for RTMP broadcasting
 */
export const generateStreamingToken = (
  userId,
  streamId,
  permissions = ['broadcast'],
  expiresIn = '15m'
) => {
  const jti = TOKEN_JWTID_PREFIX + uuidv4();

  try {
    const token = jwt.sign(
      {
        type: 'STREAMING',
        userId,
        streamId,
        permissions,
      },
      CUSTOM_JWT_SECRET,
      {
        expiresIn,
        jwtid: jti,
        algorithm: 'HS256',
        issuer: 'zapv-streaming',
      }
    );

    return { token, jti, expiresIn };
  } catch (error) {
    console.error('❌ Failed to generate streaming token:', error.message);
    throw error;
  }
};

/**
 * Generate JWT for WebSocket connections
 * Token is short-lived (5 minutes)
 * Used for upgrading to WebSocket connection
 */
export const generateWebSocketToken = (userId, expiresIn = '5m') => {
  const jti = TOKEN_JWTID_PREFIX + uuidv4();

  try {
    const token = jwt.sign(
      {
        type: 'WEBSOCKET',
        userId,
      },
      CUSTOM_JWT_SECRET,
      {
        expiresIn,
        jwtid: jti,
        algorithm: 'HS256',
      }
    );

    return { token, jti, expiresIn };
  } catch (error) {
    console.error('❌ Failed to generate WebSocket token:', error.message);
    throw error;
  }
};

/**
 * Generate refresh token for long-lived sessions
 * Token lasts 90 days
 * Implements token family for replay attack prevention
 */
export const generateRefreshToken = (userId, tokenFamily = null) => {
  const jti = TOKEN_JWTID_PREFIX + uuidv4();
  const family = tokenFamily || crypto.randomBytes(16).toString('hex');

  try {
    const token = jwt.sign(
      {
        type: 'REFRESH',
        userId,
        tokenFamily: family,
      },
      CUSTOM_JWT_SECRET,
      {
        expiresIn: '90d',
        jwtid: jti,
        algorithm: 'HS256',
      }
    );

    return { token, jti, tokenFamily: family, expiresIn: '90d' };
  } catch (error) {
    console.error('❌ Failed to generate refresh token:', error.message);
    throw error;
  }
};

/**
 * Generate API key for programmatic access
 * Long-lived token for third-party integrations
 */
export const generateAPIKey = (userId, keyName = 'default') => {
  const jti = TOKEN_JWTID_PREFIX + uuidv4();

  try {
    const token = jwt.sign(
      {
        type: 'API_KEY',
        userId,
        keyName,
      },
      CUSTOM_JWT_SECRET,
      {
        expiresIn: '365d', // 1 year
        jwtid: jti,
        algorithm: 'HS256',
      }
    );

    return { token, jti, expiresIn: '365d' };
  } catch (error) {
    console.error('❌ Failed to generate API key:', error.message);
    throw error;
  }
};

/**
 * Verify custom JWT token
 * Validates signature, expiration, and token type
 */
export const verifyCustomJWT = (token, expectedType = null) => {
  try {
    const decoded = jwt.verify(token, CUSTOM_JWT_SECRET, {
      algorithms: ['HS256'],
    });

    // Check token type if specified
    if (expectedType && decoded.type !== expectedType) {
      throw new Error(
        `Invalid token type. Expected ${expectedType}, got ${decoded.type}`
      );
    }

    return decoded;
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    throw error;
  }
};

/**
 * Decode JWT without verification (for debugging)
 * ONLY use for logged tokens, never for security decisions
 */
export const decodeJWT = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('❌ Failed to decode JWT:', error.message);
    return null;
  }
};
/**
 * Get token expiration time in seconds from now
 */
export const getTokenTTL = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded?.exp) return null;
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now;
    return ttl > 0 ? ttl : 0;
  } catch {
    return null;
  }
};
/**
 * Add token to blacklist / revocation list (Redis)
 * Useful for logout, token revocation
 */
export const revokeToken = async (jti, ttl, redisClient) => {
  if (!redisClient) {
    console.warn('⚠️ Redis client not provided, token revocation failed');
    return false;
  }
  try {
    // Store in Redis with TTL equal to token expiration
    await redisClient.setex(
      `token:blacklist:${jti}`,
      ttl || 3600,
      JSON.stringify({ revokedAt: new Date().toISOString() })
    );
    console.log(`✅ Token revoked: ${jti}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to revoke token:', error.message);
    return false;
  }
};
/**
 * Check if token is revoked
 */
export const isTokenRevoked = async (jti, redisClient) => {
  if (!redisClient) {
    return false; // If no Redis, assume not revoked
  }
  try {
    const revoked = await redisClient.get(`token:blacklist:${jti}`);
    return !!revoked;
  } catch (error) {
    console.error('❌ Failed to check revocation status:', error.message);
    return false;
  }
};
/**
 * Verify token and check if revoked
 */
export const verifyTokenSecure = async (token, expectedType, redisClient) => {
  try {
    // Verify signature and expiration
    const decoded = verifyCustomJWT(token, expectedType);

    // Check if revoked
    const revoked = await isTokenRevoked(decoded.jti, redisClient);
    if (revoked) {
      throw new Error('Token has been revoked');
    }

    return decoded;
  } catch (error) {
    console.error('❌ Secure token verification failed:', error.message);
    throw error;
  }
};

export default {
  generateStreamingToken,
  generateWebSocketToken,
  generateRefreshToken,
  generateAPIKey,
  verifyCustomJWT,
  verifyTokenSecure,
  decodeJWT,
  getTokenTTL,
  revokeToken,
  isTokenRevoked,
};
