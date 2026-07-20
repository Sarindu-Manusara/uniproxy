"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Gauge,
  History,
  RefreshCw,
  Server,
  ShieldCheck,
} from "lucide-react";
import { api, API_BASE_URL, formatCurrency } from "@/lib/api";
import type { Profile, ViewId } from "@/lib/types";
import { useToast } from "./ToastProvider";

type DashboardPanelProps = {
  token: string;
  profile: Profile | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onNavigate: (view: ViewId) => void;
};

export function DashboardPanel({
  profile,
  loading,
  error,
  onRefresh,
  onNavigate,
}: DashboardPanelProps) {
  const [health, setHealth] = useState("Checking");
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    api
      .health()
      .then((response) => {
        if (!cancelled) {
          setHealth(response.status === "ok" ? "Online" : response.status);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHealth("Offline");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (error) {
      toast.error("Profile unavailable", error);
    }
  }, [error, toast]);

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Proxy account overview</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onRefresh}>
          <RefreshCw aria-hidden="true" size={18} />
          Refresh
        </button>
      </div>

      <div className="metric-grid">
        <article className="metric-card">
          <CreditCard aria-hidden="true" size={22} />
          <span>Balance</span>
          <strong>{loading ? "Loading" : formatCurrency(profile?.balance)}</strong>
        </article>
        <article className="metric-card">
          <ShieldCheck aria-hidden="true" size={22} />
          <span>Role</span>
          <strong>{profile?.role || "USER"}</strong>
        </article>
        <article className="metric-card">
          <Server aria-hidden="true" size={22} />
          <span>Backend</span>
          <strong>{health}</strong>
        </article>
        <article className="metric-card">
          <Gauge aria-hidden="true" size={22} />
          <span>API host</span>
          <strong className="break-text">{API_BASE_URL}</strong>
        </article>
      </div>

      <div className="action-grid">
        <button className="action-tile" type="button" onClick={() => onNavigate("payments")}>
          <CreditCard aria-hidden="true" size={22} />
          <span>Deposit funds</span>
        </button>
        <button className="action-tile" type="button" onClick={() => onNavigate("purchase-plans")}>
          <Server aria-hidden="true" size={22} />
          <span>Purchase proxy</span>
        </button>
        <button
          className="action-tile"
          type="button"
          onClick={() => onNavigate("transactions")}
        >
          <History aria-hidden="true" size={22} />
          <span>View transactions</span>
        </button>
      </div>
    </section>
  );
}
