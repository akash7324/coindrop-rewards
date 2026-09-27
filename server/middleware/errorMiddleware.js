// Catches 404s that fall through all routes
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

// Centralized error handler — never leaks stack traces in production
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Internal Server Error";

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource identifier.";
  }

  // Mongoose duplicate key (e.g. duplicate email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || { field: "value" })[0];
    message = `That ${field} is already in use.`;
  }

  // Multer upload errors (bad file type, too large, etc.)
  if (err.name === "MulterError" || /Only PNG, JPG, or WEBP/.test(err.message || "")) {
    statusCode = 400;
    message = err.message;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(" ");
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
