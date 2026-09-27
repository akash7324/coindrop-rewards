const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "..", "uploads", "screenshots");
fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = [".png", ".jpg", ".jpeg", ".webp"].includes(ext) ? ext : ".jpg";
    const uniqueName = `${req.user._id}_${Date.now()}_${crypto.randomBytes(6).toString("hex")}${safeExt}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG, JPG, or WEBP screenshots are allowed."));
  }
};

const uploadScreenshot = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES, files: 1 },
});

module.exports = { uploadScreenshot, uploadDir };
