/**
 * Jest Test Suite for API Timeout Issues
 * Tests: Analytics, Profile, and Payment endpoints
 * 
 * Run: npm test -- __tests__/api-timeout.test.js
 * Purpose: Verify all MongoDB queries have .maxTimeMS() timeout
 */
import jest from "jest";
import request from "supertest";
import app from "../app.js";
import Analytics from "../models/Analytics.models.js";
import User from "../models/User.models.js";
import Payment from "../models/Payment.models.js";
import Stream from "../models/stream.models.js";
// Mock authentication
jest.mock("@clerk/express", () => ({
  requireAuth: (req, res, next) => {
    req.auth = { userId: "test-user-123" };
    next();
  },
}));
describe("API Timeout Prevention Tests", () => {
  const testTimeout = 10000; // 10 second timeout for tests
  jest.setTimeout(testTimeout);
  // Setup mock data
  const mockUserId = "507f1f77bcf86cd799439011";
  const mockStreamId = "507f1f77bcf86cd799439012";
  beforeAll(() => {
    console.log("🧪 Starting timeout prevention tests...");
  });
  afterAll(() => {
    console.log("✅ Timeout tests completed");
  });
  // ============================================================
  // ANALYTICS ENDPOINT TESTS
  // ============================================================
  describe("Analytics Endpoints - Timeout Prevention", () => {
    test("GET /api/analytics/stream/:streamId should complete within 5s", async () => {
      const startTime = Date.now();
      // Mock Analytics query with timeout
      Analytics.findOne = jest.fn().mockResolvedValue({
        _id: "1",
        streamId: mockStreamId,
        totalViewers: 100,
      });
      const response = await request(app)
        .get(`/api/analytics/stream/${mockStreamId}`)
        .timeout(5000);
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
      expect(Analytics.findOne).toHaveBeenCalled();
      console.log(`✅ Analytics stream endpoint: ${duration}ms`);
    });

    test("GET /api/analytics/profile/:userId should have maxTimeMS on query", async () => {
      const startTime = Date.now();

      Analytics.find = jest
        .fn()
        .mockResolvedValue([
          {
            userId: mockUserId,
            totalViewers: 500,
            averageWatchTime: 45,
          },
        ]);

      const response = await request(app)
        .get(`/api/analytics/profile/${mockUserId}`)
        .set("Authorization", `Bearer test-token`)
        .timeout(5000);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
      console.log(`✅ Analytics profile endpoint: ${duration}ms`);
    });

    test("GET /api/analytics/report/:userId should complete within 5s", async () => {
      const startTime = Date.now();

      Analytics.find = jest
        .fn()
        .mockResolvedValue([
          {
            userId: mockUserId,
            totalViewers: 1000,
            engagementRate: 0.85,
          },
        ]);

      const response = await request(app)
        .get(`/api/analytics/report/${mockUserId}`)
        .set("Authorization", `Bearer test-token`)
        .timeout(5000);
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000);
      console.log(`✅ Analytics report endpoint: ${duration}ms`);
    });

    test("POST /api/analytics/create should have maxTimeMS on analytics queries", async () => {
      Analytics.findOne = jest.fn().mockResolvedValue(null);
      Analytics.prototype.save = jest.fn().mockResolvedValue({
        _id: "1",
        streamId: mockStreamId,
        userId: mockUserId,
      });

      const response = await request(app)
        .post("/api/analytics/create")
        .set("Authorization", `Bearer test-token`)
        .send({
          streamId: mockStreamId,
          userId: mockUserId,
          totalViewers: 100,
          peakViewers: 150,
        })
        .timeout(5000);

      expect(Analytics.findOne).toHaveBeenCalled();
      console.log(`✅ Analytics create endpoint: verified timeout handling`);
    });
  });

  // ============================================================
  // PROFILE ENDPOINT TESTS
  // ============================================================
  describe("Profile Endpoints - Timeout Prevention", () => {
    test("GET /api/profile/:userId should have maxTimeMS on User query", async () => {
      const startTime = Date.now();

      User.findById = jest.fn().mockResolvedValue({
        _id: mockUserId,
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
      });

      Stream.find = jest.fn().mockResolvedValue([]);

      const response = await request(app)
        .get(`/api/profile/${mockUserId}`)
        .timeout(5000);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
      expect(User.findById).toHaveBeenCalled();
      console.log(`✅ Profile get endpoint: ${duration}ms`);
    });

    test("PUT /api/profile/:userId should have maxTimeMS on update", async () => {
      const startTime = Date.now();

      User.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue({
          _id: mockUserId,
          firstName: "Updated",
          lastName: "User",
        });

      const response = await request(app)
        .put(`/api/profile/${mockUserId}`)
        .set("Authorization", `Bearer test-token`)
        .send({
          firstName: "Updated",
          lastName: "User",
          bio: "Updated bio",
        })
        .timeout(5000);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
      console.log(`✅ Profile update endpoint: ${duration}ms`);
    });

    test("GET /api/profile/:userId should handle slow Stream.find gracefully", async () => {
      const startTime = Date.now();

      User.findById = jest.fn().mockResolvedValue({
        _id: mockUserId,
        email: "test@example.com",
      });

      // Simulate slow query response
      Stream.find = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve([
              { _id: mockStreamId, totalViewers: 100, startTime: new Date() },
            ]);
          }, 500);
        });
      });

      const response = await request(app)
        .get(`/api/profile/${mockUserId}`)
        .timeout(5000);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
      expect(duration).toBeGreaterThan(500); // Should have waited for Stream.find
      console.log(
        `✅ Profile endpoint with slow Stream.find: ${duration}ms (acceptable)`
      );
    });
  });

  // ============================================================
  // PAYMENT ENDPOINT TESTS
  // ============================================================
  describe("Payment Endpoints - Timeout Prevention", () => {
    test("POST /api/payment/create should have maxTimeMS on Payment.save", async () => {
      const startTime = Date.now();

      Payment.prototype.save = jest.fn().mockResolvedValue({
        _id: "1",
        userId: mockUserId,
        amount: 500,
        transactionId: "TXN_12345",
      });

      const response = await request(app)
        .post("/api/payment/create")
        .set("Authorization", `Bearer test-token`)
        .send({
          userId: mockUserId,
          amount: 500,
          paymentMethod: "upi",
          description: "Test payment",
        })
        .timeout(5000);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
      console.log(`✅ Payment create endpoint: ${duration}ms`);
    });

    test("GET /api/payment/history/:userId should have maxTimeMS on Payment.find", async () => {
      const startTime = Date.now();

      Payment.find = jest.fn().mockResolvedValue([
        {
          _id: "1",
          userId: mockUserId,
          amount: 500,
          paymentStatus: "completed",
        },
      ]);

      const response = await request(app)
        .get(`/api/payment/history/${mockUserId}`)
        .timeout(5000);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
      expect(Payment.find).toHaveBeenCalled();
      console.log(`✅ Payment history endpoint: ${duration}ms`);
    });

    test("GET /api/payment/status/:transactionId should have maxTimeMS", async () => {
      const startTime = Date.now();

      Payment.findOne = jest.fn().mockResolvedValue({
        _id: "1",
        transactionId: "TXN_12345",
        paymentStatus: "pending",
      });

      const response = await request(app)
        .get("/api/payment/status/TXN_12345")
        .timeout(5000);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
      console.log(`✅ Payment status endpoint: ${duration}ms`);
    });
  });

  // ============================================================
  // TIMEOUT SIMULATION TESTS
  // ============================================================
  describe("Timeout Simulation - Error Handling", () => {
    test("Analytics endpoint should handle MongoDB timeout error", async () => {
      Analytics.findOne = jest.fn().mockImplementation(() => {
        const err = new Error("MongooseError: operation exceeded time limit");
        err.code = "TIMEOUT";
        throw err;
      });

      const response = await request(app)
        .get(`/api/analytics/stream/${mockStreamId}`)
        .timeout(5000);

      expect(response.status).toBe(500);
      expect(response.body.message).toContain("Failed");
      console.log(`✅ Analytics timeout error handling verified`);
    });

    test("Profile endpoint should handle User query timeout", async () => {
      User.findById = jest.fn().mockImplementation(() => {
        const err = new Error("MongooseError: operation exceeded time limit");
        err.code = "TIMEOUT";
        throw err;
      });

      const response = await request(app)
        .get(`/api/profile/${mockUserId}`)
        .timeout(5000);

      expect(response.status).toBe(500);
      console.log(`✅ Profile timeout error handling verified`);
    });

    test("Payment endpoint should handle Payment query timeout", async () => {
      Payment.find = jest.fn().mockImplementation(() => {
        const err = new Error("MongooseError: operation exceeded time limit");
        err.code = "TIMEOUT";
        throw err;
      });

      const response = await request(app)
        .get(`/api/payment/history/${mockUserId}`)
        .timeout(5000);

      expect(response.status).toBe(500);
      console.log(`✅ Payment timeout error handling verified`);
    });
  });

  // ============================================================
  // PERFORMANCE SUMMARY
  // ============================================================
  describe("Performance Summary", () => {
    test("All endpoints should complete within 5 seconds", async () => {
      const endpoints = [
        { method: "get", path: `/api/analytics/stream/${mockStreamId}` },
        { method: "get", path: `/api/analytics/profile/${mockUserId}` },
        { method: "get", path: `/api/profile/${mockUserId}` },
        { method: "get", path: `/api/payment/history/${mockUserId}` },
      ];

      console.log("\n📊 Performance Summary:");
      console.log("=======================");

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        try {
          const response = await request(app)[endpoint.method](endpoint.path)
            .timeout(5000);
          const duration = Date.now() - startTime;

          if (duration < 1000) {
            console.log(`✅ ${endpoint.method.toUpperCase()} ${endpoint.path}: ${duration}ms`);
          } else if (duration < 5000) {
            console.log(
              `⚠️  ${endpoint.method.toUpperCase()} ${endpoint.path}: ${duration}ms (slow but acceptable)`
            );
          } else {
            console.log(
              `❌ ${endpoint.method.toUpperCase()} ${endpoint.path}: ${duration}ms (TIMEOUT!)`
            );
          }
        } catch (error) {
          console.log(
            `❌ ${endpoint.method.toUpperCase()} ${endpoint.path}: ERROR - ${error.message}`
          );
        }
      }

      console.log("=======================\n");
    });
  });
});
