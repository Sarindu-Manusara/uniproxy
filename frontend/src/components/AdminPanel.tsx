"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Shield, Users } from "lucide-react";
import { api, formatCurrency } from "@/lib/api";
import type { AdminUser } from "@/lib/types";

type AdminPanelProps = {
  token: string;
};

export function AdminPanel({ token }: AdminPanelProps) {
  const [revenue, setRevenue] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [nextRevenue, nextUsers] = await Promise.all([
        api.adminRevenue(token),
        api.adminUsers(token),
      ]);
      setRevenue(nextRevenue);
      setUsers(nextUsers);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load admin data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Platform controls</h1>
        </div>
        <button className="secondary-button" type="button" onClick={refresh}>
          <RefreshCw aria-hidden="true" size={18} />
          Refresh
        </button>
      </div>

      <div className="metric-grid two-up">
        <article className="metric-card">
          <Shield aria-hidden="true" size={22} />
          <span>Revenue</span>
          <strong>{revenue || "Loading"}</strong>
        </article>
        <article className="metric-card">
          <Users aria-hidden="true" size={22} />
          <span>Users</span>
          <strong>{users.length}</strong>
        </article>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{formatCurrency(user.balance)}</td>
              </tr>
            ))}
            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">
                  No users found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
