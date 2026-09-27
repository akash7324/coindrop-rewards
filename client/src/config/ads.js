// ============================================================
// ADSTERRA CONFIG
// ============================================================
// Smartlink is a plain redirect URL (NOT a <script> tag), so it can't be
// "embedded" like the Native Banner / Popunder / Social Bar units.
// The standard pattern is: open the Smartlink URL in a NEW TAB the
// instant the user clicks "Watch", while your own 15-second countdown
// keeps running in the current tab. Paste your real Smartlink URL below
// (Adsterra Dashboard → Smartlink → your zone → "Direct Link" URL).
//
// INSERT ADSTERRA SMARTLINK URL HERE
export const ADSTERRA_SMARTLINK_URL = "https://your-smartlink-url.com/xxxxxxx";

// Simple guard so nothing opens until you've actually pasted a real URL.
export const isSmartlinkConfigured = () =>
  Boolean(ADSTERRA_SMARTLINK_URL) && !ADSTERRA_SMARTLINK_URL.includes("your-smartlink-url.com");
