"use client";

import { useCallback, useEffect, useState } from "react";
import { History, RefreshCw } from "lucide-react";
import { api, formatCurrency, formatDate } from "@/lib/api";
import type { Transaction } from "@/lib/types";

type TransactionsPanelProps = {
  token: string;
};

export function TransactionsPanel({ token }: TransactionsPanelProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setTransactions(await api.transactions(token));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load transactions"
      );
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
          <p className="eyebrow">Transactions</p>
          <h1>Payment history</h1>
        </div>
        <button className="secondary-button" type="button" onClick={refresh}>
          <RefreshCw aria-hidden="true" size={18} />
          Refresh
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={`${transaction.paymentId}-${transaction.createdAt}`}>
                <td className="break-text">{transaction.paymentId}</td>
                <td>{formatCurrency(transaction.amount)}</td>
                <td>
                  <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                    {transaction.status}
                  </span>
                </td>
                <td>{formatDate(transaction.createdAt)}</td>
              </tr>
            ))}
            {!loading && transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-cell">
                  No transactions found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {loading ? (
        <p className="muted-row">
          <History aria-hidden="true" size={16} />
          Loading transaction data
        </p>
      ) : null}
    </section>
  );
}
