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
// ---------- CORS: multiple allowed origins ----------
// Supports the apex domain, the www subdomain, Vercel's own preview/
// production domain, and local dev — all at once. A single CLIENT_URL
// env var is NOT enough here, since the site is reachable at more than
// one origin (coindrop.shop AND www.coindrop.shop, for example) and the
// browser sends whichever one the user actually typed/clicked.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://coindrop.shop",
  "https://www.coindrop.shop",
  "https://coindrop-rewards.vercel.app",
  "http://localhost:5173",
];

// CLIENT_URL may optionally hold a comma-separated list to extend/override
// the defaults above (e.g. a custom Vercel preview URL) without a code change.
const envOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl / health checks with no Origin header
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      console.warn(`[CORS] Blocked request from disallowed origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
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
