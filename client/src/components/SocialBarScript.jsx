export default function SocialBarScript() {
  // This floating notification-style ad slot is now effectively covered
  // by the Monetag Multitag already loaded globally in client/index.html
  // (its in-page-push / push-notification formats serve the same purpose
  // Adsterra's Social Bar used to). No separate script needed here.
  //
  // If you later want a distinct floating unit again, paste a real
  // <script> tag via a useEffect (same pattern as PopunderScript.jsx)
  // and remove the placeholder <div> below.
  return <div className="social-bar-placeholder">Social Bar Ad Zone</div>;
}
