require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const adRoutes = require("./routes/adRoutes");
const redeemRoutes = require("./routes/redeemRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

connectDB();

const app = express();

// ---------- Security middleware ----------
app.set("trust proxy", 1); // needed for correct req.ip behind a proxy/host
app.use(helmet()); // sets secure HTTP headers
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // allow the httpOnly auth cookie to be sent
  })
);
app.use(express.json({ limit: "10kb" })); // body size limit
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . from user input (NoSQL injection)
app.use(xss()); // sanitizes user input from malicious HTML/JS
app.use(hpp()); // prevents HTTP parameter pollution

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Global rate limiter (extra endpoint-specific limiters live in route files)
const globalLimiter = rateLimit({
  windowMs: (Number(process.env.RATE_LIMIT_WINDOW_MIN) || 15) * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});
app.use("/api", globalLimiter);

// Serve uploaded redemption-proof screenshots as static files.
// Only image files land here (enforced by multer's fileFilter).
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- Routes ----------
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "CoinDrop Rewards API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/ads", adRoutes);
app.use("/api/redeem", redeemRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// ---------- Error handling ----------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SERVER] CoinDrop Rewards API listening on port ${PORT} (${process.env.NODE_ENV || "development"})`);
});
