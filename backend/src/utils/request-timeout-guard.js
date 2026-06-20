/**
 * Request Timeout Guard Middleware
 * Prevents requests from hanging indefinitely
 * Logs slow requests for diagnostics
 * 
 * Usage: Add to app.js before other middleware:
 *   app.use(requestTimeoutGuard(30000)); // 30 second max
 */

export const requestTimeoutGuard = (maxTimeMs = 30000) => {
  return (req, res, next) => {
    const startTime = Date.now();
    const requestId = `${req.method}-${req.path}-${Date.now()}`;
    
    // Set hard timeout
    const timeout = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      console.error(`⏱️  [TIMEOUT] Request hanging: ${req.method} ${req.path}`);
      console.error(`   Request ID: ${requestId}`);
      console.error(`   Duration: ${elapsed}ms (max: ${maxTimeMs}ms)`);
      console.error(`   Query params:`, req.query);
      console.error(`   Body:`, req.body);
      
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: "Request timeout - backend is slow or hanging",
          code: "REQUEST_TIMEOUT",
          requestId,
          elapsed,
          maxTime: maxTimeMs
        });
      }
    }, maxTimeMs);
    
    // Track slow requests
    const originalSend = res.send;
    res.send = function(data) {
      const elapsed = Date.now() - startTime;
      clearTimeout(timeout);
      
      if (elapsed > maxTimeMs * 0.7) {
        console.warn(`⚠️  [SLOW] ${req.method} ${req.path} took ${elapsed}ms`);
      } else if (elapsed > 1000) {
        console.log(`ℹ️  [REQUEST] ${req.method} ${req.path} → ${res.statusCode} (${elapsed}ms)`);
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};
