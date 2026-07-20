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
  MessageCircle,
  PackageCheck,
  RefreshCw,
  ReceiptText,
  Send,
  Shield,
  User,
  UserRound,
  WalletCards,
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

  useEffect(() => {
    if (plansActive) {
      setPlansOpen(true);
    }
  }, [plansActive]);

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Image src="/uniproxies-logo.png" alt="" width={828} height={828} />
          </div>
          <strong>UNIPROXIES</strong>
        </div>

        <p className="sidebar-menu-title">Main menu</p>

        <nav className="nav-list" aria-label="Main navigation">
          <button
            type="button"
            className={activeView === "dashboard" ? "active" : ""}
            onClick={() => onNavigate("dashboard")}
          >
            <span className="nav-icon">
              <LayoutDashboard aria-hidden="true" size={22} />
            </span>
            Dashboard
          </button>

          <button
            type="button"
            className={activeView === "payments" ? "active" : ""}
            onClick={() => onNavigate("payments")}
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
                onClick={() => onNavigate("active-plans")}
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
                onClick={() => onNavigate("purchase-plans")}
              >
                <PackageCheck aria-hidden="true" size={16} />
                Purchase Plans
              </button>
            </div>
          </div>

          <button
            type="button"
            className={activeView === "transactions" ? "active" : ""}
            onClick={() => onNavigate("transactions")}
          >
            <span className="nav-icon">
              <ReceiptText aria-hidden="true" size={22} />
            </span>
            Invoices
          </button>

          <button
            type="button"
            className={activeView === "settings" ? "active" : ""}
            onClick={() => onNavigate("settings")}
          >
            <span className="nav-icon">
              <UserRound aria-hidden="true" size={22} />
            </span>
            My Account
            <ChevronDown aria-hidden="true" className="nav-chevron" size={18} />
          </button>

          <a
            className="nav-external"
            href="https://discord.com"
            target="_blank"
            rel="noreferrer"
          >
            <span className="nav-icon">
              <MessageCircle aria-hidden="true" size={22} />
            </span>
            Discord Server
            <ExternalLink aria-hidden="true" className="nav-chevron" size={17} />
          </a>

          <a
            className="nav-external"
            href="https://telegram.org"
            target="_blank"
            rel="noreferrer"
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
            onClick={() => onNavigate("support")}
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
              onClick={() => onNavigate("admin")}
            >
              <span className="nav-icon">
                <Shield aria-hidden="true" size={22} />
              </span>
              Admin
            </button>
          ) : null}
        </nav>

        <button className="sidebar-logout" type="button" onClick={onLogout}>
          <span className="nav-icon">
            <LogOut aria-hidden="true" size={22} />
          </span>
          Logout
        </button>
      </aside>

      <section className="workspace">
        <div className="dashboard-card">
          <header className="topbar">
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
