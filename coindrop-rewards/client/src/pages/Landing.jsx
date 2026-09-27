import { useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const FEATURES = [
  {
    icon: "🎬",
    title: "Watch & Earn",
    desc: "Watch short Premium Video Ads and earn +40 points per completed, server-verified view.",
  },
  {
    icon: "🔒",
    title: "Bank-Grade Security",
    desc: "Passwords are hashed, sessions use httpOnly JWT cookies, and every point is calculated server-side — never trusted from your browser.",
  },
  {
    icon: "🎁",
    title: "Real Redemptions",
    desc: "Cash out 25,000 points for a ₹50 Google Play code. Attach a screenshot to speed up approval.",
  },
  {
    icon: "📊",
    title: "Live Transaction Log",
    desc: "Track every redemption request in real time — Pending, Approved, or Rejected.",
  },
  {
    icon: "🌗",
    title: "Dark & Light Mode",
    desc: "A premium emerald dark theme by default, with a full light mode one tap away.",
  },
  {
    icon: "📱",
    title: "Fully Mobile-Ready",
    desc: "Built mobile-first — every page, form, and modal is fully responsive.",
  },
];

const STEPS = [
  { num: 1, title: "Create your account", desc: "Sign up in seconds with just your name, email, and password." },
  { num: 2, title: "Watch video ads", desc: "Tap Watch, let the 15-second timer finish, and earn +40 points instantly." },
  { num: 3, title: "Redeem your reward", desc: "Hit 25,000 points and cash out for a real ₹50 Google Play code." },
];

const FAQS = [
  {
    q: "Is CoinDrop Rewards free to use?",
    a: "Yes — creating an account and earning points by watching ads is completely free, always.",
  },
  {
    q: "How do I earn points?",
    a: "Watch a Premium Video Ad on your Dashboard. Once the 15-second timer completes, our server verifies the view and credits +40 points to your account automatically.",
  },
  {
    q: "How does redemption work?",
    a: "Once your balance reaches 25,000 points, go to the Redeem page, enter the email where you'd like your Google Play code sent, and optionally attach a screenshot. Your request is logged as Pending until an admin reviews and approves it.",
  },
  {
    q: "Are there app downloads, surveys, or check-in tasks?",
    a: "No. CoinDrop Rewards strictly offers Premium Video Ads only — we do not include app-install offers, surveys, or daily check-in tasks of any kind.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Your password is hashed and never stored in plain text, your session uses a secure httpOnly cookie, and your points balance is only ever changed by our server after independent verification.",
  },
  {
    q: "Can I track my redemption status?",
    a: "Yes — your History & Profile page shows a live status log for every redemption request: Pending, Approved, or Rejected.",
  },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={onToggle}>
        <span>{item.q}</span>
        <span className={`faq-icon ${isOpen ? "open" : ""}`}>＋</span>
      </button>
      <div className={`faq-answer ${isOpen ? "open" : ""}`}>{item.a}</div>
    </div>
  );
}

export default function Landing() {
  const { theme, toggleTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0); // first FAQ open by default

  const toggleFaq = (idx) => setOpenFaqIndex((prev) => (prev === idx ? -1 : idx));

  return (
    <div className="landing-wrapper">
      {/* ================= HEADER / NAV ================= */}
      <header className="landing-header">
        <div className="landing-brand">
          🪙 CoinDrop <span className="logo-dot">Rewards</span>
        </div>

        <nav className="landing-nav">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#faq">FAQ</a>
        </nav>

        <div className="landing-header-actions">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle dark / light mode"
            title="Toggle dark / light mode"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <Link to="/login" className="btn btn-outline btn-sm">
            Log In
          </Link>
          <button
            className="hamburger-btn"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileNavOpen ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* Mobile nav drawer — toggled on small screens */}
      {mobileNavOpen && (
        <div className="mobile-nav-drawer">
          <a href="#features" onClick={() => setMobileNavOpen(false)}>
            Features
          </a>
          <a href="#how-it-works" onClick={() => setMobileNavOpen(false)}>
            How It Works
          </a>
          <a href="#faq" onClick={() => setMobileNavOpen(false)}>
            FAQ
          </a>
          <Link to="/signup" onClick={() => setMobileNavOpen(false)}>
            Sign Up
          </Link>
        </div>
      )}

      {/* ================= MAIN ================= */}
      <main>
        {/* ---- Hero ---- */}
        <section className="hero">
          <span className="hero-badge">✨ Now open — no invite needed</span>
          <h1>
            Watch Ads. <span>Earn Points.</span> Redeem Real Rewards.
          </h1>
          <p className="hero-sub">
            CoinDrop Rewards pays you real points for watching short Premium Video Ads —
            no app downloads, no surveys, no check-ins. Just watch, earn, and cash out.
          </p>
          <div className="hero-cta-row">
            <Link to="/signup" className="btn btn-primary">
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn-outline">
              I already have an account
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num">+40</div>
              <div className="label">pts / video ad</div>
            </div>
            <div className="hero-stat">
              <div className="num">15s</div>
              <div className="label">avg. watch time</div>
            </div>
            <div className="hero-stat">
              <div className="num">₹50</div>
              <div className="label">per 25,000 pts</div>
            </div>
          </div>
        </section>

        {/* ---- Features ---- */}
        <section className="landing-section" id="features">
          <div className="section-heading">
            <h2>Everything you need, nothing you don't</h2>
            <p>A clean, secure, single-purpose rewards experience.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- How it works ---- */}
        <section className="landing-section" id="how-it-works">
          <div className="section-heading">
            <h2>How It Works</h2>
            <p>Three simple steps to your first redemption.</p>
          </div>
          <div className="steps-row">
            {STEPS.map((s) => (
              <div className="step-card" key={s.num}>
                <div className="step-num">{s.num}</div>
                <h3 style={{ fontSize: 15, margin: "0 0 6px 0" }}>{s.title}</h3>
                <p className="muted small">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---- FAQ (accordion, mobile-friendly) ---- */}
        <section className="landing-section" id="faq">
          <div className="section-heading">
            <h2>Frequently Asked Questions</h2>
            <p>Tap a question to expand its answer.</p>
          </div>
          <div className="faq-list">
            {FAQS.map((item, idx) => (
              <FaqItem
                key={item.q}
                item={item}
                isOpen={openFaqIndex === idx}
                onToggle={() => toggleFaq(idx)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-col">
            <h4>🪙 CoinDrop Rewards</h4>
            <p className="muted small" style={{ maxWidth: 280, lineHeight: 1.6 }}>
              A secure, server-verified rewards app. Watch Premium Video Ads, earn points,
              and redeem real Google Play codes.
            </p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Log In</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© {new Date().getFullYear()} CoinDrop Rewards. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
