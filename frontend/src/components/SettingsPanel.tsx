"use client";

import { FormEvent, useState } from "react";
import { KeyRound, Mail, RefreshCw, User } from "lucide-react";
import { api, formatCurrency } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { useToast } from "./ToastProvider";

type SettingsPanelProps = {
  token: string;
  profile: Profile | null;
  onProfileChanged: () => void;
};

export function SettingsPanel({
  token,
  profile,
  onProfileChanged,
}: SettingsPanelProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.updatePassword(token, oldPassword, newPassword);
      toast.success("Password updated", response);
      setOldPassword("");
      setNewPassword("");
    } catch (requestError) {
      toast.error(
        "Password update failed",
        requestError instanceof Error ? requestError.message : "Unable to update password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Account settings</h1>
        </div>
        <button className="secondary-button" type="button" onClick={onProfileChanged}>
          <RefreshCw aria-hidden="true" size={18} />
          Refresh
        </button>
      </div>

      <div className="profile-grid">
        <div className="profile-item">
          <User aria-hidden="true" size={18} />
          <span>Username</span>
          <strong>{profile?.username || "Unknown"}</strong>
        </div>
        <div className="profile-item">
          <Mail aria-hidden="true" size={18} />
          <span>Email</span>
          <strong>{profile?.email || "Unknown"}</strong>
        </div>
        <div className="profile-item">
          <KeyRound aria-hidden="true" size={18} />
          <span>Balance</span>
          <strong>{formatCurrency(profile?.balance)}</strong>
        </div>
      </div>

      <form className="tool-panel settings-form" onSubmit={updatePassword}>
        <label>
          <span>Current password</span>
          <input
            autoComplete="current-password"
            type="password"
            value={oldPassword}
            onChange={(event) => setOldPassword(event.target.value)}
            required
          />
        </label>
        <label>
          <span>New password</span>
          <input
            autoComplete="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          <KeyRound aria-hidden="true" size={18} />
          Update password
        </button>
      </form>
    </section>
  );
}
