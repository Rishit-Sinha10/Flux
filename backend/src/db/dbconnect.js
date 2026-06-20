// config/db.js
import mongoose from "mongoose";
const connectDB = async () => {
  try {
    // ✅ Attempt connection with timeout
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB not available
      socketTimeoutMS: 5000,
    });
    // ✅ Set global flag when connection succeeds
    global.mongoConnected = true;
    console.log("✅ MongoDB Connected and ready for queries");
    // Monitor connection events
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB connection lost");
      global.mongoConnected = false;
    });
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err.message);
    });
    return Promise.resolve();
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    global.mongoConnected = false;
    process.exit(1); // stop server if DB fails
  }
};
export default connectDB;
