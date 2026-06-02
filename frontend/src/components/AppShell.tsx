"use client";

import { ReactNode } from "react";
import Image from "next/image";
import {
  CreditCard,
  Gauge,
  History,
  LifeBuoy,
  LogOut,
  RefreshCw,
  Server,
  Settings,
  Shield,
  User,
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

const navItems: Array<{
  id: ViewId;
  label: string;
  icon: typeof Gauge;
  adminOnly?: boolean;
}> = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "support", label: "Support", icon: LifeBuoy },
  { id: "proxies", label: "Proxies", icon: Server },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "transactions", label: "Transactions", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "admin", label: "Admin", icon: Shield, adminOnly: true },
];

export function AppShell({
  children,
  activeView,
  onNavigate,
  onLogout,
  profile,
  onRefreshProfile,
  loadingProfile,
}: AppShellProps) {
  const visibleNav = navItems.filter(
    (item) => !item.adminOnly || profile?.role === "ADMIN"
  );

  return (
    <main className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Image src="/uniproxies-logo.png" alt="" width={828} height={828} />
          </div>
          <div>
            <p className="eyebrow">UniProxy</p>
            <strong>Operations</strong>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={activeView === item.id ? "active" : ""}
                onClick={() => onNavigate(item.id)}
              >
                <Icon aria-hidden="true" size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button className="ghost-button sidebar-logout" type="button" onClick={onLogout}>
          <LogOut aria-hidden="true" size={18} />
          Logout
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Account</p>
            <h2>{profile?.username || "Loading account"}</h2>
          </div>

          <div className="topbar-actions">
            <div className="profile-pill">
              <User aria-hidden="true" size={16} />
              <span>{profile?.role || "USER"}</span>
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
          </div>
        </header>

        <div className="content-area">{children}</div>
      </section>
    </main>
  );
}
