"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Database,
  Globe2,
  Megaphone,
  Network,
  LogIn,
  Search,
  ShieldCheck,
  Smartphone,
  Store,
  Zap,
  UserPlus,
} from "lucide-react";
import { api } from "@/lib/api";

type AuthPanelProps = {
  onAuthenticated: (token: string) => void;
};

type AuthMode = "login" | "register";

const proxyProducts = [
  {
    icon: Globe2,
    tag: "From $2.5/GB",
    title: "Residential Proxies",
    copy: "Real ISP-assigned IPs with rotating and sticky sessions across global locations.",
    items: ["20M+ IP pool", "195 countries", "HTTP and SOCKS5"],
  },
  {
    icon: Zap,
    tag: "Unlimited bandwidth",
    title: "Unlimited Residential",
    copy: "Flat-rate access for sustained workloads where bandwidth costs need to stay predictable.",
    items: ["1M+ peers", "Unmetered traffic", "Country targeting"],
  },
  {
    icon: Database,
    tag: "From $4.5/day",
    title: "Datacenter Proxies",
    copy: "High-speed server-hosted proxies for performance-heavy automation and scraping.",
    items: ["Fast response", "High volume", "Dedicated options"],
  },
  {
    icon: Smartphone,
    tag: "From $4.5/GB",
    title: "Mobile Proxies",
    copy: "Carrier-grade mobile IPs for workflows that need strong mobile reputation.",
    items: ["4G and 5G", "Auto rotation", "Sticky sessions"],
  },
  {
    icon: Network,
    tag: "From $8/day",
    title: "IPv6 Proxies",
    copy: "Scalable IPv6 infrastructure for modern apps that need efficient IP diversity.",
    items: ["Large IPv6 pool", "Native IPv6 support", "High-volume deployment"],
  },
  {
    icon: ShieldCheck,
    tag: "Static residential IPs",
    title: "ISP Proxies",
    copy: "Static residential trust with datacenter speed for long-running account sessions.",
    items: ["Clean static IPs", "1-3 month sessions", "Unlimited bandwidth"],
  },
];

const enterpriseFeatures = [
  "Backconnect residential infrastructure",
  "Strict no-log account privacy",
  "Daily technical support",
  "Optimized routing and bandwidth",
  "Global targeting controls",
  "99.9% uptime guarantee",
];

const stackLogos = [
  ["semrush", "Semrush"],
  ["bitbrowser", "BitBrowser"],
  ["csharp", "C#"],
  ["lalicat", "Lalicat"],
  ["dolphinantybrowser", "Dolphin Anty"],
  ["selenium", "Selenium"],
  ["gmail", "Gmail"],
  ["mulogin", "MuLogin"],
  ["incogniton", "Incogniton"],
  ["kameleo", "Kameleo"],
  ["nstbrowser", "NSTBrowser"],
  ["undetectable", "Undetectable"],
  ["multilogin", "Multilogin"],
  ["octobrowser", "OctoBrowser"],
  ["gologin", "GoLogin"],
  ["puppeteer", "Puppeteer"],
  ["cpp", "C++"],
  ["playwright", "Playwright"],
  ["doubleverify", "DoubleVerify"],
  ["parsehub", "ParseHub"],
  ["react", "React"],
  ["octoparse", "Octoparse"],
  ["foxyproxy", "FoxyProxy"],
  ["vmlogin", "VMLogin"],
  ["ruby", "Ruby"],
  ["javascript", "JavaScript"],
  ["integralAdscience", "Integral Ad Science"],
  ["adspower", "AdsPower"],
  ["morelogin", "MoreLogin"],
  ["shopify", "Shopify"],
  ["proxifier", "Proxifier"],
  ["ghostbrowser", "Ghost Browser"],
  ["python", "Python"],
];

const industryCards = [
  {
    icon: Store,
    title: "Ecommerce",
    copy: "Track competitor prices, monitor stock changes, and collect structured product data across local markets.",
  },
  {
    icon: Megaphone,
    title: "Social Media Marketing",
    copy: "Manage account workflows with rotating residential sessions that preserve identity consistency.",
  },
  {
    icon: BarChart3,
    title: "Market Research",
    copy: "Collect public data, compare regional pages, and monitor trends with low detection risk.",
  },
  {
    icon: ShieldCheck,
    title: "Ad Tech",
    copy: "Verify placements, inspect creatives, and detect impression issues across global ad networks.",
  },
  {
    icon: Search,
    title: "SEO Monitoring",
    copy: "Retrieve localized search results and rank data from specific countries, cities, or ISPs.",
  },
  {
    icon: Building2,
    title: "Cybersecurity",
    copy: "Run authorized testing and exposure checks through private proxy routes and isolated sessions.",
  },
];

const faqs = [
  [
    "What proxy protocols are supported?",
    "UNIPROXIES supports HTTP, HTTPS, and SOCKS5 credentials from one client dashboard.",
  ],
  [
    "Can I keep the same IP for a session?",
    "Yes. Sticky sessions can preserve the same IP for multi-step workflows, while rotation is available when you need fresh IPs.",
  ],
  [
    "Do I need a credit card for the trial?",
    "No. You can create an account and test the dashboard before committing to a paid plan.",
  ],
  [
    "Which targets can I select?",
    "Country targeting is available in the dashboard, with room to expand into city, state, and ISP controls.",
  ],
];

const cryptoPayments = [
  ["bitcoin", "Bitcoin"],
  ["ethereum", "Ethereum"],
  ["usdt", "USDT"],
  ["usdc", "USDC"],
  ["litecoin", "Litecoin"],
  ["solana", "Solana"],
];

export function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (mode === "register") {
        const response = await api.register(username, email, password);
        setMessage(response);
        setMode("login");
        return;
      }

      const token = await api.login(username, password);
      onAuthenticated(token);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Request failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <nav className="public-nav" aria-label="Public navigation">
        <a className="public-logo" href="#top">
          <span className="public-logo-mark">
            <Image src="/uniproxies-logo.png" alt="" width={828} height={828} />
          </span>
          <strong>UNIPROXIES</strong>
        </a>
        <div className="public-links">
          <a href="#proxies">Proxies</a>
          <a href="#pricing">Pricing</a>
          <a href="#use-cases">Use Cases</a>
          <a href="#resources">Resources</a>
          <a href="#support">Contact</a>
        </div>
        <div className="public-actions">
          <a href="#auth-form">Sign up</a>
          <a href="#auth-form">Login</a>
        </div>
      </nav>

      <div className="landing-container" id="top">
        <section className="auth-hero">
          <div className="flying-unicorn" aria-hidden="true">
            <Image src="/uniproxies-logo.png" alt="" width={828} height={828} />
          </div>

          <div className="hero-copy">
            <div className="trust-row">
              <span>Trustpilot</span>
              <strong>★★★★★</strong>
              <span>G2</span>
              <small>4.8 · 2,400 reviews</small>
            </div>

            <h1>Residential Proxies That Do Not Get Blocked</h1>
            <p>
              Access clean residential IPs across worldwide locations. Rotating
              proxies, sticky sessions, backconnect support, and a simple
              dashboard for purchasing and managing credentials.
            </p>

            <ul className="feature-list">
              {[
                "20M+ Residential IPs · 195 Countries",
                "Rotating and Sticky Sessions · Backconnect",
                "HTTP and SOCKS5 Support",
              ].map((item) => (
                <li key={item}>
                  <Check aria-hidden="true" size={14} />
                  {item}
                </li>
              ))}
            </ul>

            <div className="hero-actions">
              <a className="hero-link" href="#auth-form">
                Start Free Trial
                <ArrowRight aria-hidden="true" size={16} />
              </a>
              <a className="hero-secondary" href="#pricing">
                View Pricing
              </a>
            </div>
            <p className="hero-note">Free trial · No credit card required</p>
          </div>

          <div className="hero-stack">
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-node hero-node-top">
                <span />
                <strong>IP Pool</strong>
                <small>20M+ IPs</small>
              </div>
              <div className="hero-terminal">
                <div />
                <code>gateway.uniproxies.local:9000</code>
                <code>session=sticky · country=US</code>
                <code>HTTP · SOCKS5 · Backconnect</code>
              </div>
              <div className="hero-node hero-node-bottom">
                <span />
                <strong>Avg Response</strong>
                <small>~0.5s</small>
              </div>
            </div>

            <section className="auth-shell" aria-label="Authentication">
              <div className="auth-brand">
                <div className="brand-mark">
                  <Image
                    src="/uniproxies-logo.png"
                    alt=""
                    width={828}
                    height={828}
                  />
                </div>
                <div>
                  <p className="eyebrow">Client Portal</p>
                  <h1>Start your session</h1>
                </div>
              </div>



              <div
                className="segmented"
                role="tablist"
                aria-label="Authentication mode"
                id="auth-form"
              >
                <button
                  className={mode === "login" ? "active" : ""}
                  type="button"
                  onClick={() => setMode("login")}
                >
                  <LogIn aria-hidden="true" size={16} />
                  Login
                </button>
                <button
                  className={mode === "register" ? "active" : ""}
                  type="button"
                  onClick={() => setMode("register")}
                >
                  <UserPlus aria-hidden="true" size={16} />
                  Register
                </button>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                  <span>Username</span>
                  <input
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                </label>

                {mode === "register" ? (
                  <label>
                    <span>Email</span>
                    <input
                      autoComplete="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </label>
                ) : null}

                <label>
                  <span>Password</span>
                  <input
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </label>

                {error ? <p className="form-error">{error}</p> : null}
                {message ? <p className="form-message">{message}</p> : null}

                <button
                  className="primary-button wide-button"
                  type="submit"
                  disabled={loading}
                >
                  {mode === "login" ? (
                    <LogIn aria-hidden="true" size={18} />
                  ) : (
                    <UserPlus aria-hidden="true" size={18} />
                  )}
                  {loading
                    ? "Working"
                    : mode === "login"
                      ? "Login"
                      : "Create account"}
                </button>
              </form>

              <div className="security-note">
                <ShieldCheck aria-hidden="true" size={17} />
                <span>No credit card required · Cancel anytime</span>
              </div>
            </section>
          </div>
        </section>

        <section className="stat-strip" aria-label="Network statistics">
          <div>
            <strong>20M+</strong>
            <span>Residential IPs</span>
          </div>
          <div>
            <strong>195</strong>
            <span>Countries covered</span>
          </div>
          <div>
            <strong>99.9%</strong>
            <span>Uptime guarantee</span>
          </div>
          <div>
            <strong>5,000+</strong>
            <span>Happy clients</span>
          </div>
        </section>

        <section className="marketing-section intro-section">
          <p className="eyebrow">Residential Proxies</p>
          <div className="two-column-copy">
            <h2>What Are Residential Proxies?</h2>
            <div>
              <h3>Definition</h3>
              <p>
                Residential proxies route requests through IPs assigned to real
                homes, making traffic look more natural than server-hosted IPs.
              </p>
              <h3>How They Work</h3>
              <p>
                A backconnect gateway rotates IPs automatically, while sticky
                sessions keep the same IP when multi-step workflows need
                continuity.
              </p>
            </div>
          </div>
        </section>

        <section className="marketing-section" id="proxies">
          <p className="eyebrow">Proxy Solutions</p>
          <div className="section-title-row">
            <h2>Every proxy type, one platform</h2>
            <p>
              Choose residential, unlimited, datacenter, or mobile proxies for
              scraping, automation, research, and account workflows.
            </p>
          </div>
          <div className="proxy-card-grid">
            {proxyProducts.map((product) => {
              const Icon = product.icon;
              return (
                <article className="proxy-card" key={product.title}>
                  <div className="proxy-card-top">
                    <Icon aria-hidden="true" size={22} />
                    <span>{product.tag}</span>
                  </div>
                  <h3>{product.title}</h3>
                  <p>{product.copy}</p>
                  <ul>
                    {product.items.map((item) => (
                      <li key={item}>
                        <Check aria-hidden="true" size={13} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <a href="#auth-form">
                    Learn more
                    <ArrowRight aria-hidden="true" size={15} />
                  </a>
                </article>
              );
            })}
          </div>
        </section>

        <section className="feature-band" id="use-cases">
          <div>
            <p className="eyebrow">Built for Professional Use</p>
            <h2>Enterprise-Grade Residential Proxy Network</h2>
            <p>
              Built for rotating and sticky sessions, large-scale scraping
              operations, and professional data access at any volume.
            </p>
          </div>
          <div className="feature-list-grid">
            {enterpriseFeatures.map((feature) => (
              <div key={feature}>
                <ShieldCheck aria-hidden="true" size={18} />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="marketing-section industries-section">
          <p className="eyebrow">Built for Scale Across Industries</p>
          <div className="section-title-row">
            <h2>Every Industry. One Network.</h2>
            <p>
              Residential proxy infrastructure for automation, anonymity, and
              reliable data access across high-sensitivity workflows.
            </p>
          </div>
          <div className="industry-layout">
            <div className="industry-art" aria-hidden="true">
              <div className="industry-orbit">
                <Image
                  src="/uniproxies-logo.png"
                  alt=""
                  width={828}
                  height={828}
                />
              </div>
              <span>global routing</span>
            </div>
            <div className="industry-grid">
              {industryCards.map((industry) => {
                const Icon = industry.icon;
                return (
                  <article key={industry.title}>
                    <Icon aria-hidden="true" size={20} />
                    <h3>{industry.title}</h3>
                    <p>{industry.copy}</p>
                    <a href="#auth-form">
                      Explore use case
                      <ArrowRight aria-hidden="true" size={14} />
                    </a>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="marketing-section">
          <p className="eyebrow">Quick Start</p>
          <div className="section-title-row">
            <h2>From signup to first request in under 5 minutes.</h2>
            <p>No complex setup. No waiting.</p>
          </div>
          <div className="quickstart-grid">
            {[
              ["01", "Create Your Account", "Sign up in seconds and get access to the client portal."],
              ["02", "Choose Your Proxy Type", "Select a plan and configure targeting by country or session."],
              ["03", "Connect and Start", "Copy credentials and integrate with HTTP or SOCKS5."],
            ].map(([step, title, copy]) => (
              <article key={step}>
                <strong>{step}</strong>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pricing-panel" id="pricing">
          <div>
            <p className="eyebrow">Unlimited Plan</p>
            <h2>Unlimited Rotating Residential Proxies</h2>
            <p>
              For operations that need continuous access without tracking
              bandwidth consumption, unlimited rotating residential proxies keep
              pricing predictable.
            </p>
            <a className="hero-link" href="#auth-form">
              Get Unlimited Access
              <ArrowRight aria-hidden="true" size={16} />
            </a>
          </div>
          <div className="price-card">
            <span>Starting from</span>
            <strong>$70/day</strong>
            <p>No per-GB billing. Unlimited traffic.</p>
            <div>
              <span>1 Day</span>
              <strong>$250/day</strong>
            </div>
            <div>
              <span>7 Days</span>
              <strong>$100/day</strong>
            </div>
            <div>
              <span>30 Days</span>
              <strong>$70/day</strong>
            </div>
          </div>
        </section>

        <section className="marketing-section comparison-section" id="resources">
          <p className="eyebrow">Proxy Comparison</p>
          <h2>Residential Proxies vs Datacenter Proxies</h2>
          <div className="comparison-table">
            {[
              ["IP Source", "Real residential devices", "Server-hosted IPs"],
              ["Detection Risk", "Low", "Higher"],
              ["Speed", "Moderate", "Fast"],
              ["Best For", "Scraping and account management", "Speed-sensitive tasks"],
              ["Targeting", "Country, state, city, ISP", "Country level"],
            ].map(([label, residential, datacenter]) => (
              <div key={label}>
                <strong>{label}</strong>
                <span>{residential}</span>
                <span>{datacenter}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="marketing-section stack-section">
          <p className="eyebrow">Integrations</p>
          <h2>Compatible With Your Existing Stack</h2>
          <div className="stack-logo-grid" aria-label="Compatible tools">
            {stackLogos.map(([fileName, label]) => (
              <div className="stack-logo-card" key={fileName} title={label}>
                <Image
                  src={`/stack-logos/${fileName}.svg`}
                  alt={label}
                  width={100}
                  height={100}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="cta-band" id="support">
          <div>
            <Building2 aria-hidden="true" size={28} />
            <h2>Start With a Free Trial</h2>
            <p>
              Test the residential proxy network before committing to a plan.
              No credit card required.
            </p>
            <span>Free trial · No credit card</span>
          </div>
          <div className="cta-actions">
            <a className="hero-link" href="#auth-form">
              Get Started Free
              <ArrowRight aria-hidden="true" size={16} />
            </a>
            <a className="hero-secondary" href="mailto:support@uniproxies.com">
              Talk to Sales
            </a>
          </div>
        </section>

        <section className="marketing-section faq-section">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>Frequently Asked Questions</h2>
            <p>
              Can&apos;t find an answer? Contact the UNIPROXIES team for
              setup help.
            </p>
          </div>
          <div className="faq-list">
            {faqs.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="landing-footer">
          <div className="footer-brand">
            <div>
              <span className="public-logo-mark">
                <Image
                  src="/uniproxies-logo.png"
                  alt=""
                  width={828}
                  height={828}
                />
              </span>
              <strong>UNIPROXIES</strong>
            </div>
            <p>Residential, datacenter, mobile, IPv6, and ISP proxies from one clean dashboard.</p>
          </div>
          <div className="footer-columns">
            <div>
              <h3>Contact</h3>
              <a href="mailto:support@uniproxies.com">support@uniproxies.com</a>
              <span>Live chat support</span>
            </div>
            <div>
              <h3>Proxies</h3>
              <a href="#proxies">Residential Proxies</a>
              <a href="#proxies">Unlimited Residential</a>
              <a href="#proxies">Datacenter Proxies</a>
              <a href="#proxies">Mobile Proxies</a>
            </div>
            <div>
              <h3>Solutions</h3>
              <a href="#use-cases">Ecommerce</a>
              <a href="#use-cases">Market Research</a>
              <a href="#use-cases">SEO Monitoring</a>
              <a href="#use-cases">Ad Tech</a>
            </div>
            <div>
              <h3>Legal</h3>
              <a href="#support">Terms and Conditions</a>
              <a href="#support">Privacy Policy</a>
              <a href="#support">Refund Policy</a>
              <a href="#support">Fair Usage Policy</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 UNIPROXIES. All rights reserved.</span>
            <div className="payment-logo-row" aria-label="Accepted crypto payments">
              {cryptoPayments.map(([fileName, label]) => (
                <span key={fileName} title={label}>
                  <Image
                    src={`/payment-logos/${fileName}.svg`}
                    alt={label}
                    width={64}
                    height={64}
                  />
                </span>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
