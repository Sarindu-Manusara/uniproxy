"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPanel } from "@/components/AdminPanel";
import { AppShell } from "@/components/AppShell";
import { AuthPanel } from "@/components/AuthPanel";
import { DashboardPanel } from "@/components/DashboardPanel";
import { PaymentsPanel } from "@/components/PaymentsPanel";
import { ProxiesPanel } from "@/components/ProxiesPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SupportPanel } from "@/components/SupportPanel";
import { TransactionsPanel } from "@/components/TransactionsPanel";
import { ToastProvider } from "@/components/ToastProvider";
import { api } from "@/lib/api";
import type { Profile, ViewId } from "@/lib/types";

const tokenStorageKey = "uniproxy.authToken";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const storedToken = window.localStorage.getItem(tokenStorageKey);
    if (storedToken) {
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
      setProfile(nextProfile);
    } catch (error) {
      setProfile(null);
      setProfileError(error instanceof Error ? error.message : "Unable to load profile");
    } finally {
      setLoadingProfile(false);
    }
  }, [token]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const handleAuth = (nextToken: string) => {
    window.localStorage.setItem(tokenStorageKey, nextToken);
    setToken(nextToken);
    setActiveView("dashboard");
  };

  const handleLogout = () => {
    window.localStorage.removeItem(tokenStorageKey);
    setToken(null);
    setProfile(null);
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
