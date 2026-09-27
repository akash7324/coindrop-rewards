const mongoose = require("mongoose");

/**
 * Connects to MongoDB using Mongoose.
 * All user + point + transaction data lives here, on the server's
 * own database — never in client-side storage.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`[DB] Connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
