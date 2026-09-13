"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AppShell } from "@/components/AppShell";
import { AuthPanel } from "@/components/AuthPanel";
import { DashboardPanel } from "@/components/DashboardPanel";
import { ToastProvider } from "@/components/ToastProvider";
import { api } from "@/lib/api";
import type { Profile, ViewId } from "@/lib/types";

const tokenStorageKey = "uniproxy.authToken";
const frontendCurrentUserBalance = 50;
const frontendBalanceUsername = "demo";

const AdminPanel = dynamic(() => import("@/components/AdminPanel").then((module) => module.AdminPanel));
const PaymentsPanel = dynamic(() => import("@/components/PaymentsPanel").then((module) => module.PaymentsPanel));
const ProxiesPanel = dynamic(() => import("@/components/ProxiesPanel").then((module) => module.ProxiesPanel));
const SettingsPanel = dynamic(() => import("@/components/SettingsPanel").then((module) => module.SettingsPanel));
const SupportPanel = dynamic(() => import("@/components/SupportPanel").then((module) => module.SupportPanel));
const TransactionsPanel = dynamic(() => import("@/components/TransactionsPanel").then((module) => module.TransactionsPanel));

const withFrontendCurrentUserBalance = (profile: Profile): Profile => {
  if (profile.username.trim().toLowerCase() !== frontendBalanceUsername) {
    return profile;
  }

  return {
    ...profile,
    balance: frontendCurrentUserBalance,
  };
};

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const currentToken = useRef<string | null>(null);
  const profileLoadedToken = useRef<string | null>(null);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(tokenStorageKey);
    if (storedToken) {
      currentToken.current = storedToken;
      setToken(storedToken);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoadingProfile(true);
    setProfileError("");

    try {
      const nextProfile = await api.profile(token);
      if (currentToken.current === token) {
        setProfile(withFrontendCurrentUserBalance(nextProfile));
      }
    } catch (error) {
      if (currentToken.current === token) {
        setProfile(null);
        setProfileError(error instanceof Error ? error.message : "Unable to load profile");
      }
    } finally {
      if (currentToken.current === token) {
        setLoadingProfile(false);
      }
    }
  }, [token]);

  useEffect(() => {
    if (token && profileLoadedToken.current !== token) {
      void refreshProfile();
    }
  }, [token, refreshProfile]);

  const handleAuth = (nextToken: string, nextProfile: Profile | null) => {
    window.localStorage.setItem(tokenStorageKey, nextToken);
    currentToken.current = nextToken;
    profileLoadedToken.current = nextProfile ? nextToken : null;
    setProfile(nextProfile ? withFrontendCurrentUserBalance(nextProfile) : null);
    setProfileError("");
    setLoadingProfile(false);
    setToken(nextToken);
    setActiveView("dashboard");
  };

  const handleLogout = () => {
    window.localStorage.removeItem(tokenStorageKey);
    currentToken.current = null;
    profileLoadedToken.current = null;
    setToken(null);
    setProfile(null);
    setLoadingProfile(false);
    setProfileError("");
    setActiveView("dashboard");
  };

  const view = useMemo(() => {
    if (!token) {
      return null;
    }

    switch (activeView) {
      case "support":
        return <SupportPanel token={token} />;
      case "proxies":
        return <ProxiesPanel token={token} onChanged={refreshProfile} />;
      case "payments":
        return <PaymentsPanel token={token} onChanged={refreshProfile} />;
      case "active-plans":
        return (
          <ProxiesPanel
            token={token}
            onChanged={refreshProfile}
            viewMode="active"
          />
        );
      case "purchase-plans":
        return (
          <ProxiesPanel
            token={token}
            onChanged={refreshProfile}
            viewMode="purchase"
          />
        );
      case "transactions":
        return <TransactionsPanel token={token} />;
      case "settings":
        return (
          <SettingsPanel
            token={token}
            profile={profile}
            onProfileChanged={refreshProfile}
          />
        );
      case "admin":
        return <AdminPanel token={token} />;
      default:
        return (
          <DashboardPanel
            token={token}
            profile={profile}
            loading={loadingProfile}
            error={profileError}
            onRefresh={refreshProfile}
            onNavigate={setActiveView}
          />
        );
    }
  }, [
    activeView,
    loadingProfile,
    profile,
    profileError,
    refreshProfile,
    token,
  ]);

  if (!token) {
    return (
      <ToastProvider>
        <AuthPanel onAuthenticated={handleAuth} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <AppShell
        activeView={activeView}
        onNavigate={setActiveView}
        onLogout={handleLogout}
        profile={profile}
        onRefreshProfile={refreshProfile}
        loadingProfile={loadingProfile}
      >
        {view}
      </AppShell>
    </ToastProvider>
  );
}
