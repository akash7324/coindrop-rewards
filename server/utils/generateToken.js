const jwt = require("jsonwebtoken");

/**
 * Signs a JWT for the given user id and sets it as a secure,
 * httpOnly cookie so the token can never be read by client-side JS
 * (mitigates XSS token theft). Also returns the raw token in case the
 * frontend wants it for an Authorization header fallback.
 */
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  const cookieExpiryDays = Number(process.env.JWT_COOKIE_EXPIRES_DAYS || 7);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: cookieExpiryDays * 24 * 60 * 60 * 1000,
    path: "/",
  });

  return token;
};

module.exports = generateTokenAndSetCookie;
