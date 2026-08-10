"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ROUTES } from "@/constants";
import "./landing.css";

/* ─── Counter animation hook ────────────────────────── */
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, start: () => setStarted(true) };
}

/* ─── IntersectionObserver for scroll animations ────── */
function useInView(threshold = 0.15) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(ref);
    return () => obs.disconnect();
  }, [ref, threshold]);

  return { setRef, inView };
}

/* ─── Data ──────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "📊",
    title: "Smart Dashboard",
    desc: "Real-time overview of your income, expenses, and net worth with beautiful visualizations.",
    stat: "24/7",
    statLabel: "Monitoring",
  },
  {
    icon: "🎯",
    title: "Budget & Goals",
    desc: "Set spending limits per category and track progress toward your savings goals effortlessly.",
    stat: "100+",
    statLabel: "Categories",
  },
  {
    icon: "🤖",
    title: "AI Assistant",
    desc: "Get personalized financial advice and insights powered by advanced AI analysis.",
    stat: "3s",
    statLabel: "Response Time",
  },
];

const STATS_DATA = [
  { value: 50000, suffix: "+", label: "Active Users" },
  { value: 12, suffix: "M+", label: "Transactions Tracked" },
  { value: 99.9, suffix: "%", label: "Uptime" },
  { value: 4.9, suffix: "/5", label: "User Rating" },
];

const INTEGRATIONS = [
  { name: "GCash", icon: "💚" },
  { name: "Maya", icon: "💜" },
  { name: "BPI", icon: "🏦" },
  { name: "BDO", icon: "🏛️" },
  { name: "UnionBank", icon: "🔶" },
  { name: "MetroBank", icon: "🔷" },
];

const TESTIMONIALS = [
  {
    name: "Anna Cruz",
    role: "Freelance Designer",
    text: "Casha-Ba transformed how I manage my finances. The AI insights helped me save 30% more each month.",
    avatar: "AC",
  },
  {
    name: "Miguel Santos",
    role: "Small Business Owner",
    text: "Finally, a finance app that understands the Philippine market. The GCash integration is seamless!",
    avatar: "MS",
  },
  {
    name: "Sofia Reyes",
    role: "Software Engineer",
    text: "The budgeting tools are incredibly intuitive. I've been able to hit all my savings goals consistently.",
    avatar: "SR",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "₱0",
    period: "/forever",
    features: ["Basic dashboard", "Manual transactions", "3 budget categories", "Monthly reports"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₱299",
    period: "/month",
    features: ["Smart dashboard", "Bank sync (auto)", "Unlimited categories", "AI assistant", "Priority support"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Business",
    price: "₱799",
    period: "/month",
    features: ["Everything in Pro", "Team accounts", "Invoice management", "API access", "Dedicated manager"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

/* ─── Component ─────────────────────────────────────── */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Counter hooks for stats */
  const counters = STATS_DATA.map((s) => useCounter(s.value, 2200));
  const statsView = useInView(0.3);

  useEffect(() => {
    if (statsView.inView) counters.forEach((c) => c.start());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsView.inView]);

  return (
    <div className="landing-root">
      {/* ─── Navbar ─────────────────────────────── */}
      <header className={`landing-nav${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <Link href="/" className="nav-brand">
            <span className="brand-icon">₱</span>
            Casha<span className="brand-accent">-Ba</span>
          </Link>

          <nav className={`nav-links${menuOpen ? " open" : ""}`}>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#pricing">Pricing</a>
            <a href="#testimonials">Reviews</a>
          </nav>

          <div className="nav-actions">
            <Link href={ROUTES.LOGIN} className="nav-login">Log In</Link>
            <Link href={ROUTES.SIGNUP} className="nav-cta">Get Started Free</Link>
          </div>

          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg-shapes">
          <div className="shape shape-1" />
          <div className="shape shape-2" />
          <div className="shape shape-3" />
        </div>
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot" />
              Now Available in the Philippines
            </div>
            <h1 className="hero-title">
              Effortless Finance<br />
              <span className="hero-gradient-text">Management for Everyone</span>
            </h1>
            <p className="hero-subtitle">
              Track expenses, set budgets, and grow your savings — all in one beautiful app.
              Powered by AI to give you personalized financial insights.
            </p>
            <div className="hero-buttons">
              <Link href={ROUTES.SIGNUP} className="btn-hero-primary">
                Start for Free
                <span className="btn-arrow">→</span>
              </Link>
              <a href="#features" className="btn-hero-secondary">
                <span className="play-icon">▶</span>
                See How It Works
              </a>
            </div>
            <div className="hero-trust">
              <div className="trust-avatars">
                <span className="trust-avatar" style={{ background: "#22c55e" }}>AC</span>
                <span className="trust-avatar" style={{ background: "#16a34a" }}>MS</span>
                <span className="trust-avatar" style={{ background: "#15803d" }}>SR</span>
                <span className="trust-avatar" style={{ background: "#166534" }}>JD</span>
              </div>
              <p className="trust-text">
                <strong>50,000+</strong> users managing smarter finances
              </p>
            </div>
          </div>

          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="preview-topbar">
                <div className="preview-dots">
                  <span /><span /><span />
                </div>
                <span className="preview-title">Dashboard</span>
              </div>
              <div className="preview-body">
                <div className="preview-stat-row">
                  <div className="preview-stat">
                    <span className="ps-label">Balance</span>
                    <span className="ps-value">₱24,580</span>
                  </div>
                  <div className="preview-stat">
                    <span className="ps-label">Income</span>
                    <span className="ps-value green">₱45,000</span>
                  </div>
                  <div className="preview-stat">
                    <span className="ps-label">Expenses</span>
                    <span className="ps-value red">₱18,420</span>
                  </div>
                </div>
                <div className="preview-chart">
                  <div className="chart-bar" style={{ height: "40%" }} />
                  <div className="chart-bar" style={{ height: "65%" }} />
                  <div className="chart-bar" style={{ height: "50%" }} />
                  <div className="chart-bar active" style={{ height: "85%" }} />
                  <div className="chart-bar" style={{ height: "70%" }} />
                  <div className="chart-bar" style={{ height: "55%" }} />
                  <div className="chart-bar" style={{ height: "75%" }} />
                </div>
                <div className="preview-transactions">
                  <div className="ptx">
                    <span className="ptx-icon income">↓</span>
                    <span className="ptx-label">Salary</span>
                    <span className="ptx-amount green">+₱45,000</span>
                  </div>
                  <div className="ptx">
                    <span className="ptx-icon expense">↑</span>
                    <span className="ptx-label">Groceries</span>
                    <span className="ptx-amount red">-₱1,240</span>
                  </div>
                  <div className="ptx">
                    <span className="ptx-icon expense">↑</span>
                    <span className="ptx-label">Electric Bill</span>
                    <span className="ptx-amount red">-₱2,100</span>
                  </div>
                </div>
              </div>
            </div>
            {/* floating elements */}
            <div className="float-card float-1">
              <span className="float-icon">🎯</span>
              <div>
                <span className="float-title">Savings Goal</span>
                <span className="float-val">78% reached</span>
              </div>
            </div>
            <div className="float-card float-2">
              <span className="float-icon">📈</span>
              <div>
                <span className="float-title">This Month</span>
                <span className="float-val green">+₱26,580</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ──────────────────────────── */}
      <section className="stats-bar" ref={statsView.setRef}>
        <div className="stats-inner">
          {STATS_DATA.map((s, i) => (
            <div key={s.label} className="stat-item">
              <span className="stat-number">
                {counters[i].count % 1 === 0
                  ? counters[i].count.toLocaleString()
                  : counters[i].count.toFixed(1)}
                {s.suffix}
              </span>
              <span className="stat-desc">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ───────────────────────────── */}
      <section className="features-section" id="features">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-tag">Features</span>
            <h2 className="section-title">Everything You Need to<br /><span className="gradient-text">Master Your Money</span></h2>
            <p className="section-subtitle">
              Powerful tools designed to simplify your financial life and help you make smarter decisions.
            </p>
          </div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon-wrap">
                  <span className="feature-icon">{f.icon}</span>
                </div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
                <div className="feature-stat">
                  <span className="fs-value">{f.stat}</span>
                  <span className="fs-label">{f.statLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ───────────────────────── */}
      <section className="how-section" id="how-it-works">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-tag">How It Works</span>
            <h2 className="section-title">Get Started in <span className="gradient-text">3 Simple Steps</span></h2>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-line" />
              <h3 className="step-title">Create Your Account</h3>
              <p className="step-desc">Sign up in seconds with your email. No credit card required to get started.</p>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-line" />
              <h3 className="step-title">Connect Your Wallets</h3>
              <p className="step-desc">Link GCash, Maya, or your bank accounts for automatic transaction tracking.</p>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-line" />
              <h3 className="step-title">Watch Your Money Grow</h3>
              <p className="step-desc">Set budgets, track goals, and get AI-powered insights to save more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Integrations ───────────────────────── */}
      <section className="integrations-section">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-tag">Integrations</span>
            <h2 className="section-title">Seamless <span className="gradient-text">Bank & Wallet</span> Connections</h2>
            <p className="section-subtitle">Connect your favorite financial services in one click.</p>
          </div>
          <div className="integrations-grid">
            {INTEGRATIONS.map((ig) => (
              <div key={ig.name} className="integration-card">
                <span className="integration-icon">{ig.icon}</span>
                <span className="integration-name">{ig.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ────────────────────────────── */}
      <section className="pricing-section" id="pricing">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-tag">Pricing</span>
            <h2 className="section-title">Simple, <span className="gradient-text">Transparent Pricing</span></h2>
            <p className="section-subtitle">Start free, upgrade when you&apos;re ready. No hidden fees.</p>
          </div>
          <div className="pricing-grid">
            {PRICING.map((p) => (
              <div key={p.name} className={`pricing-card${p.highlighted ? " highlighted" : ""}`}>
                {p.highlighted && <div className="pricing-badge">Most Popular</div>}
                <h3 className="pricing-name">{p.name}</h3>
                <div className="pricing-price">
                  {p.price}<span className="pricing-period">{p.period}</span>
                </div>
                <ul className="pricing-features">
                  {p.features.map((f) => (
                    <li key={f}>
                      <span className="check">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={ROUTES.SIGNUP}
                  className={`pricing-cta${p.highlighted ? " primary" : ""}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ───────────────────────── */}
      <section className="testimonials-section" id="testimonials">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-tag">Testimonials</span>
            <h2 className="section-title">Loved by <span className="gradient-text">Thousands</span></h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
                <div className="testimonial-author">
                  <span className="testimonial-avatar">{t.avatar}</span>
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to Take Control of Your Finances?</h2>
          <p className="cta-desc">Join 50,000+ Filipinos who are already saving smarter with Casha-Ba.</p>
          <div className="cta-buttons">
            <Link href={ROUTES.SIGNUP} className="btn-cta-primary">
              Create Free Account
              <span className="btn-arrow">→</span>
            </Link>
            <Link href={ROUTES.LOGIN} className="btn-cta-secondary">Log In</Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">
              <span className="brand-icon">₱</span>
              Casha<span className="brand-accent">-Ba</span>
            </span>
            <p className="footer-tagline">Personal finance, made simple.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#how-it-works">How It Works</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <a href="#">Help Center</a>
              <a href="#">Contact Us</a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Casha-Ba. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
