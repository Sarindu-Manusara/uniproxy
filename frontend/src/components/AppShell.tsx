"use client";

import { ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import {
  Bookmark,
  ChevronDown,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  RefreshCw,
  ReceiptText,
  Send,
  Shield,
  User,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/api";
import type { Profile, ViewId } from "@/lib/types";

type AppShellProps = {
  children: ReactNode;
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  onLogout: () => void;
  profile: Profile | null;
  onRefreshProfile: () => void;
  loadingProfile: boolean;
};

export function AppShell({
  children,
  activeView,
  onNavigate,
  onLogout,
  profile,
  onRefreshProfile,
  loadingProfile,
}: AppShellProps) {
  const plansActive =
    activeView === "proxies" ||
    activeView === "active-plans" ||
    activeView === "purchase-plans";
  const [plansOpen, setPlansOpen] = useState(plansActive);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (plansActive) {
      setPlansOpen(true);
    }
  }, [plansActive]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  const navigate = (view: ViewId) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <main className="app-layout">
      <aside
        className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}
        id="dashboard-navigation"
      >
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Image src="/uniproxy-logo.png" alt="" width={500} height={500} />
          </div>
          <strong>UniProxy</strong>
          <button
            className="icon-button mobile-sidebar-close"
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
            title="Close navigation"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>

        <p className="sidebar-menu-title">Main menu</p>

        <nav className="nav-list" aria-label="Main navigation">
          <button
            type="button"
            className={activeView === "dashboard" ? "active" : ""}
            onClick={() => navigate("dashboard")}
          >
            <span className="nav-icon">
              <LayoutDashboard aria-hidden="true" size={22} />
            </span>
            Dashboard
          </button>

          <button
            type="button"
            className={activeView === "payments" ? "active" : ""}
            onClick={() => navigate("payments")}
          >
            <span className="nav-icon">
              <WalletCards aria-hidden="true" size={22} />
            </span>
            Deposit Balance
          </button>

          <div className="nav-group">
            <button
              type="button"
              className={`${plansActive ? "active parent-active" : ""} ${
                plansOpen ? "expanded" : ""
              }`}
              aria-expanded={plansOpen}
              onClick={() => setPlansOpen((current) => !current)}
            >
              <span className="nav-icon">
                <Bookmark aria-hidden="true" size={22} />
              </span>
              My Plans
              <ChevronDown aria-hidden="true" className="nav-chevron" size={18} />
            </button>

            <div className={`nav-sublist ${plansOpen ? "open" : ""}`}>
              <button
                type="button"
                className={activeView === "active-plans" ? "active" : ""}
                onClick={() => navigate("active-plans")}
              >
                <CreditCard aria-hidden="true" size={16} />
                Active Plans
              </button>
              <button
                type="button"
                className={
                  activeView === "purchase-plans" || activeView === "proxies"
                    ? "active"
                    : ""
                }
                onClick={() => navigate("purchase-plans")}
              >
                <PackageCheck aria-hidden="true" size={16} />
                Purchase Plans
              </button>
            </div>
          </div>

          <button
            type="button"
            className={activeView === "transactions" ? "active" : ""}
            onClick={() => navigate("transactions")}
          >
            <span className="nav-icon">
              <ReceiptText aria-hidden="true" size={22} />
            </span>
            Invoices
          </button>

          <button
            type="button"
            className={activeView === "settings" ? "active" : ""}
            onClick={() => navigate("settings")}
          >
            <span className="nav-icon">
              <UserRound aria-hidden="true" size={22} />
            </span>
            My Account
            <ChevronDown aria-hidden="true" className="nav-chevron" size={18} />
          </button>

          <a
            className="nav-external"
            href={process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || "https://t.me/UniProxyCC"}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span className="nav-icon">
              <Send aria-hidden="true" size={22} />
            </span>
            Telegram
            <ExternalLink aria-hidden="true" className="nav-chevron" size={17} />
          </a>

          <button
            type="button"
            className={activeView === "support" ? "active" : ""}
            onClick={() => navigate("support")}
          >
            <span className="nav-icon">
              <User aria-hidden="true" size={22} />
            </span>
            Support
            <ChevronDown aria-hidden="true" className="nav-chevron" size={18} />
          </button>

          {profile?.role === "ADMIN" ? (
            <button
              type="button"
              className={activeView === "admin" ? "active" : ""}
              onClick={() => navigate("admin")}
            >
              <span className="nav-icon">
                <Shield aria-hidden="true" size={22} />
              </span>
              Admin
            </button>
          ) : null}
        </nav>

        <button
          className="sidebar-logout"
          type="button"
          onClick={() => {
            setMobileMenuOpen(false);
            onLogout();
          }}
        >
          <span className="nav-icon">
            <LogOut aria-hidden="true" size={22} />
          </span>
          Logout
        </button>
      </aside>

      {mobileMenuOpen ? (
        <button
          className="sidebar-backdrop"
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation"
        />
      ) : null}

      <section className="workspace">
        <div className="dashboard-card">
          <header className="topbar">
            <button
              className="icon-button mobile-menu-button"
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-controls="dashboard-navigation"
              aria-expanded={mobileMenuOpen}
              aria-label="Open navigation"
              title="Open navigation"
            >
              <Menu aria-hidden="true" size={20} />
            </button>
            <div className="profile-pill">
              <User aria-hidden="true" size={16} />
              <span>{profile?.username || "Account"}</span>
              <strong>{formatCurrency(profile?.balance)}</strong>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={onRefreshProfile}
              aria-label="Refresh profile"
              title="Refresh profile"
              disabled={loadingProfile}
            >
              <RefreshCw aria-hidden="true" size={18} />
            </button>
          </header>

          <div className="content-area">{children}</div>
        </div>
      </section>
    </main>
  );
}
