/**
 * DISABLED — the Adsterra popunder script that used to be injected here
 * has been replaced by the Monetag Multitag (see client/index.html <head>
 * and the paired client/public/sw.js service worker), per instruction to
 * swap the Adsterra ad units for Monetag.
 *
 * Running two independent popunder/vignette-style scripts at once (one
 * from Adsterra, one from Monetag) would fire competing pop-ups on the
 * same click and looks like invalid/spammy traffic to both networks'
 * fraud detection — so this component is now a no-op, kept only so
 * App.jsx doesn't need to change its import.
 *
 * To bring Adsterra's popunder back later, restore the script-injection
 * code (git history has it) and remove the Monetag <script> tag in
 * index.html instead — don't run both at the same time.
 */
export default function PopunderScript() {
  return null;
}
