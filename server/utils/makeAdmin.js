/**
 * Usage:
 *   cd server
 *   node utils/makeAdmin.js user@example.com
 *
 * Promotes an already-registered user to role "admin" so they can log
 * into the Admin Panel at /admin on the client.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const email = process.argv[2];

if (!email) {
  console.error("Usage: node utils/makeAdmin.js <email>");
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { role: "admin" },
      { new: true }
    );
    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }
    console.log(`✅ ${user.email} is now an admin.`);
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
