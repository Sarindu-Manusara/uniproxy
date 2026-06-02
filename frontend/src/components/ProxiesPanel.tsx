"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Copy, RefreshCw, Server, ShoppingCart } from "lucide-react";
import { api, formatDate } from "@/lib/api";
import type { UserProxy } from "@/lib/types";

type ProxiesPanelProps = {
  token: string;
  onChanged: () => void;
};

export function ProxiesPanel({ token, onChanged }: ProxiesPanelProps) {
  const [proxies, setProxies] = useState<UserProxy[]>([]);
  const [price, setPrice] = useState("10");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setProxies(await api.proxies(token));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load proxies"
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const purchase = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await api.purchaseProxy(token, price);
      setMessage(response);
      await refresh();
      onChanged();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to purchase proxy"
      );
    } finally {
      setLoading(false);
    }
  };

  const copyProxy = async (proxy: UserProxy) => {
    const value = `${proxy.ip}:${proxy.port}:${proxy.proxyUsername}:${proxy.proxyPassword}`;
    await navigator.clipboard.writeText(value);
    setMessage("Proxy copied.");
  };

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Proxies</p>
          <h1>Proxy inventory</h1>
        </div>
        <button className="secondary-button" type="button" onClick={refresh}>
          <RefreshCw aria-hidden="true" size={18} />
          Refresh
        </button>
      </div>

      <form className="tool-panel compact-form" onSubmit={purchase}>
        <label>
          <span>Price</span>
          <input
            min="1"
            step="0.01"
            type="number"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          <ShoppingCart aria-hidden="true" size={18} />
          Purchase
        </button>
      </form>

      {message ? <p className="form-message">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>IP</th>
              <th>Port</th>
              <th>Username</th>
              <th>Password</th>
              <th>Expiry</th>
              <th>Copy</th>
            </tr>
          </thead>
          <tbody>
            {proxies.map((proxy) => (
              <tr key={proxy.id}>
                <td>{proxy.ip}</td>
                <td>{proxy.port}</td>
                <td>{proxy.proxyUsername}</td>
                <td>{proxy.proxyPassword}</td>
                <td>{formatDate(proxy.expiryDate)}</td>
                <td>
                  <button
                    className="icon-button table-icon"
                    type="button"
                    onClick={() => copyProxy(proxy)}
                    aria-label={`Copy proxy ${proxy.id}`}
                    title="Copy proxy"
                  >
                    <Copy aria-hidden="true" size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && proxies.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  No proxies found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {loading ? (
        <p className="muted-row">
          <Server aria-hidden="true" size={16} />
          Loading proxy data
        </p>
      ) : null}
    </section>
  );
}
