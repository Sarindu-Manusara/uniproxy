"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Database,
  Megaphone,
  Menu,
  Network,
  LogIn,
  Search,
  ShieldCheck,
  Store,
  UserPlus,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { useToast } from "./ToastProvider";

type AuthPanelProps = {
  onAuthenticated: (token: string, profile: Profile | null) => void;
};

type AuthMode = "login" | "register";

const proxyProducts = [
  {
    icon: Database,
    tag: "Plans from $10",
    title: "Datacenter Proxies",
    copy: "High-speed server-hosted proxies for performance-heavy automation and scraping.",
    items: ["Fast response", "High volume", "Dedicated options"],
  },
  {
    icon: Network,
    tag: "Plans from $10",
    title: "IPv6 Proxies",
    copy: "Scalable IPv6 infrastructure for modern apps that need efficient IP diversity.",
    items: ["Large IPv6 pool", "Native IPv6 support", "High-volume deployment"],
  },
];

const enterpriseFeatures = [
  "Reliable datacenter infrastructure",
  "Strict no-log account privacy",
  "Daily technical support",
  "Optimized routing and bandwidth",
  "Location targeting controls",
  "99.9% uptime guarantee",
];

const stackLogos = [
  ["semrush", "Semrush"],
  ["bitbrowser", "BitBrowser"],
  ["csharp", "C#"],
  ["lalicat", "Lalicat"],
  ["dolphinantybrowser", "Dolphin Anty"],
  ["selenium", "Selenium"],
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
    copy: "Manage account workflows with stable proxy sessions that preserve identity consistency.",
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
    copy: "Retrieve localized search results and rank data from supported countries and cities.",
  },
  {
    icon: Building2,
    title: "Cybersecurity",
    copy: "Run authorized testing and exposure checks through private proxy routes and isolated sessions.",
  },
];

const faqs = [
  [
    "Can I keep the same IP for a session?",
    "Yes. Sticky sessions can preserve the same IP for multi-step workflows, while rotation is available when you need fresh IPs.",
  ],
  [
    "Do you accept Monero (XMR)?",
    "Yes we currently accept Monero, Zcash and other crypto.",
  ],
  [
    "What is a proxy server?",
    "A proxy server is an intermediary that routes your internet traffic through a different IP address, hiding your real one so you can access sites without geographic or rate-limit restrictions.",
  ],
  [
    "Can I select specific countries?",
    "Country targeting is available in the dashboard, with room to expand into cities and states.",
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

const telegramUrl =
  process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || "https://t.me/UniProxyCC";

export function AuthPanel({ onAuthenticated }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [publicMenuOpen, setPublicMenuOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    void api.prepareLogin();
  }, []);

  useEffect(() => {
    if (!publicMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPublicMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [publicMenuOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        const response = await api.register(username, email, password);
        toast.success("Account created", response);
        setMode("login");
        return;
      }

      const session = await api.login(username, password);
      onAuthenticated(session.token, session.profile);
    } catch (requestError) {
      toast.error(
        "Authentication failed",
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
            <Image src="/uniproxy-logo.png" alt="" width={500} height={500} />
          </span>
          <strong>UniProxy</strong>
        </a>
        <button
          className="icon-button public-menu-button"
          type="button"
          aria-controls="public-navigation-menu"
          aria-expanded={publicMenuOpen}
          aria-label={publicMenuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setPublicMenuOpen((current) => !current)}
        >
          {publicMenuOpen ? (
            <X aria-hidden="true" size={20} />
          ) : (
            <Menu aria-hidden="true" size={20} />
          )}
        </button>
        <div
          className={`public-menu ${publicMenuOpen ? "open" : ""}`}
          id="public-navigation-menu"
        >
          <div className="public-links">
            <a href="#proxies" onClick={() => setPublicMenuOpen(false)}>Proxies</a>
            <a href="#use-cases" onClick={() => setPublicMenuOpen(false)}>Use Cases</a>
            <a href="#resources" onClick={() => setPublicMenuOpen(false)}>Resources</a>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setPublicMenuOpen(false)}
            >
              Contact
            </a>
          </div>
          <div className="public-actions">
            <a
              href="#auth-form"
              onClick={() => {
                setMode("register");
                setPublicMenuOpen(false);
              }}
            >
              Sign up
            </a>
            <a
              href="#auth-form"
              onClick={() => {
                setMode("login");
                setPublicMenuOpen(false);
              }}
            >
              Login
            </a>
          </div>
        </div>
      </nav>

      <div className="landing-container" id="top">
        <section className="auth-hero">
          <div className="flying-unicorn" aria-hidden="true">
            <Image src="/uniproxy-logo.png" alt="" width={500} height={500} />
          </div>

          <div className="hero-copy">
            <div className="trust-row">
              <span>Trustpilot</span>
              <strong>★★★★★</strong>
              <span>G2</span>
              <small>4.8 · 2,400 reviews</small>
            </div>

            <h1>Datacenter and IPv6 Proxies Built for Speed</h1>
            <p>
              Access fast datacenter and IPv6 proxy plans from one clean
              dashboard. Purchase plans, manage credentials, and start routing
              traffic without a complicated setup.
            </p>

            <ul className="feature-list">
              {[
                "Datacenter and IPv6 plans",
                "Fast delivery and simple credentials",
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
                Get Started
                <ArrowRight aria-hidden="true" size={16} />
              </a>
              <a className="hero-secondary" href="#proxies">
                View Plans
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
                <code>gateway.uniproxy.local:9000</code>
                <code>plan=datacenter · country=US</code>
                <code>HTTP · SOCKS5 · IPv6-ready</code>
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
                    src="/uniproxy-logo.png"
                    alt=""
                    width={500}
                    height={500}
                  />
                </div>
                <div>
                  <p className="eyebrow">Client Portal</p>
                  <h1>
                    {mode === "login" ? "Sign in to UniProxy" : "Create your account"}
                  </h1>
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
            <span>Available proxy plans</span>
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
          <p className="eyebrow">Proxy Network</p>
          <div className="two-column-copy">
            <h2>What Are Datacenter and IPv6 Proxies?</h2>
            <div>
              <h3>Definition</h3>
              <p>
                Datacenter proxies route traffic through fast server-hosted IPs,
                while IPv6 proxies provide scalable modern address pools.
              </p>
              <h3>How They Work</h3>
              <p>
                UniProxy provides plan access and credentials from the dashboard
                so your tools can connect through HTTP or SOCKS5.
              </p>
            </div>
          </div>
        </section>

        <section className="marketing-section" id="proxies">
          <p className="eyebrow">Proxy Solutions</p>
          <div className="section-title-row">
            <h2>Available proxy types, one platform</h2>
            <p>
              Choose datacenter or IPv6 proxies for automation, research, and
              account workflows.
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
            <h2>Enterprise-Grade Proxy Network</h2>
            <p>
              Built for automation, scalable workloads, and professional data
              access through Datacenter and IPv6 plans.
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
              Proxy infrastructure for automation, privacy, and reliable data
              access across demanding workflows.
            </p>
          </div>
          <div className="industry-layout">
            <div className="industry-art" aria-hidden="true">
              <div className="industry-orbit">
                <Image
                  src="/uniproxy-logo.png"
                  alt=""
                  width={500}
                  height={500}
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

        <section className="marketing-section comparison-section" id="resources">
          <p className="eyebrow">Proxy Comparison</p>
          <h2>Datacenter Proxies vs IPv6 Proxies</h2>
          <div className="comparison-table">
            {[
              ["IP Source", "Server-hosted IPv4 pools", "Native IPv6 pools"],
              ["Speed", "Fast", "Fast"],
              ["Best For", "Automation and scraping", "IPv6-ready workflows"],
              ["Scale", "Dedicated package sizes", "Large address diversity"],
              ["Protocols", "HTTP and SOCKS5", "HTTP and SOCKS5"],
            ].map(([label, datacenter, ipv6]) => (
              <div key={label}>
                <strong>{label}</strong>
                <span>{datacenter}</span>
                <span>{ipv6}</span>
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
              Test the proxy network before committing to a plan.
              No credit card required.
            </p>
            <span>Free trial · No credit card</span>
          </div>
          <div className="cta-actions">
            <a className="hero-link" href="#auth-form">
              Get Started Free
              <ArrowRight aria-hidden="true" size={16} />
            </a>
            <a
              className="hero-secondary"
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
            >
              Contact via Telegram
            </a>
          </div>
        </section>

        <section className="marketing-section faq-section">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>Frequently Asked Questions</h2>
            <p>
              Common setup answers for UniProxy customers.
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
                  src="/uniproxy-logo.png"
                  alt=""
                  width={500}
                  height={500}
                />
              </span>
              <strong>UniProxy</strong>
            </div>
            <p>Datacenter and IPv6 proxies from one clean dashboard.</p>
          </div>
          <div className="footer-columns">
            <div>
              <h3>Contact</h3>
              <a href={telegramUrl} target="_blank" rel="noreferrer">
                Telegram Support
              </a>
            </div>
            <div>
              <h3>Proxies</h3>
              <a href="#proxies">Datacenter Proxies</a>
              <a href="#proxies">IPv6 Proxies</a>
            </div>
            <div>
              <h3>Solutions</h3>
              <a href="#use-cases">Ecommerce</a>
              <a href="#use-cases">Market Research</a>
              <a href="#use-cases">SEO Monitoring</a>
              <a href="#use-cases">Ad Tech</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 UniProxy. All rights reserved.</span>
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
