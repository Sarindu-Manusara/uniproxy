"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Save, Shield, Trash2, Users, X } from "lucide-react";
import { api, formatCurrency } from "@/lib/api";
import type { AdminUser, SupportFaq, SupportFaqInput } from "@/lib/types";
import { useToast } from "./ToastProvider";

type AdminPanelProps = {
  token: string;
};

export function AdminPanel({ token }: AdminPanelProps) {
  const [revenue, setRevenue] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [faqs, setFaqs] = useState<SupportFaq[]>([]);
  const [faqForm, setFaqForm] = useState<SupportFaqInput>({
    question: "",
    answer: "",
    active: true,
    sortOrder: 0,
  });
  const [editingFaqId, setEditingFaqId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);
  const toast = useToast();

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const [nextRevenue, nextUsers, nextFaqs] = await Promise.all([
        api.adminRevenue(token),
        api.adminUsers(token),
        api.adminFaqs(token),
      ]);
      setRevenue(nextRevenue);
      setUsers(nextUsers);
      setFaqs(nextFaqs);
    } catch (requestError) {
      toast.error(
        "Admin data unavailable",
        requestError instanceof Error ? requestError.message : "Unable to load admin data"
      );
    } finally {
      setLoading(false);
    }
  }, [toast, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const resetFaqForm = () => {
    setFaqForm({
      question: "",
      answer: "",
      active: true,
      sortOrder: 0,
    });
    setEditingFaqId(null);
  };

  const submitFaq = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingFaq(true);

    try {
      if (editingFaqId) {
        await api.adminUpdateFaq(token, editingFaqId, faqForm);
        toast.success("FAQ updated", "The question and answer were saved.");
      } else {
        await api.adminCreateFaq(token, faqForm);
        toast.success("FAQ added", "The new question is now available.");
      }

      resetFaqForm();
      setFaqs(await api.adminFaqs(token));
    } catch (requestError) {
      toast.error(
        "FAQ not saved",
        requestError instanceof Error ? requestError.message : "Unable to save FAQ"
      );
    } finally {
      setSavingFaq(false);
    }
  };

  const editFaq = (faq: SupportFaq) => {
    setEditingFaqId(faq.id);
    setFaqForm({
      question: faq.question,
      answer: faq.answer,
      active: faq.active,
      sortOrder: faq.sortOrder,
    });
  };

  const deleteFaq = async (faq: SupportFaq) => {
    if (!window.confirm(`Delete FAQ: ${faq.question}?`)) {
      return;
    }

    setSavingFaq(true);

    try {
      await api.adminDeleteFaq(token, faq.id);
      toast.success("FAQ deleted", "The question was removed.");
      setFaqs(await api.adminFaqs(token));

      if (editingFaqId === faq.id) {
        resetFaqForm();
      }
    } catch (requestError) {
      toast.error(
        "FAQ not deleted",
        requestError instanceof Error ? requestError.message : "Unable to delete FAQ"
      );
    } finally {
      setSavingFaq(false);
    }
  };

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

      <div className="admin-faq-section">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Support FAQ</p>
            <h2>Frequently asked questions</h2>
          </div>
        </div>

        <form className="tool-panel settings-form admin-faq-form" onSubmit={submitFaq}>
          <label>
            <span>Question</span>
            <input
              value={faqForm.question}
              onChange={(event) =>
                setFaqForm((current) => ({
                  ...current,
                  question: event.target.value,
                }))
              }
              placeholder="Example: How long does activation take?"
              required
            />
          </label>

          <label>
            <span>Answer</span>
            <textarea
              value={faqForm.answer}
              onChange={(event) =>
                setFaqForm((current) => ({
                  ...current,
                  answer: event.target.value,
                }))
              }
              placeholder="Write the answer customers should see."
              rows={5}
              required
            />
          </label>

          <div className="admin-faq-options">
            <label>
              <span>Display order</span>
              <input
                type="number"
                value={faqForm.sortOrder}
                onChange={(event) =>
                  setFaqForm((current) => ({
                    ...current,
                    sortOrder: Number(event.target.value) || 0,
                  }))
                }
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={faqForm.active}
                onChange={(event) =>
                  setFaqForm((current) => ({
                    ...current,
                    active: event.target.checked,
                  }))
                }
              />
              <span>Show on support page</span>
            </label>
          </div>

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={savingFaq}>
              {editingFaqId ? (
                <Save aria-hidden="true" size={18} />
              ) : (
                <Plus aria-hidden="true" size={18} />
              )}
              {editingFaqId ? "Save FAQ" : "Add FAQ"}
            </button>

            {editingFaqId ? (
              <button
                className="secondary-button"
                type="button"
                onClick={resetFaqForm}
                disabled={savingFaq}
              >
                <X aria-hidden="true" size={18} />
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Question</th>
                <th>Answer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqs.map((faq) => (
                <tr key={faq.id}>
                  <td>{faq.sortOrder}</td>
                  <td>{faq.question}</td>
                  <td>{faq.answer}</td>
                  <td>{faq.active ? "Visible" : "Hidden"}</td>
                  <td>
                    <div className="table-action-row">
                      <button
                        className="icon-button table-icon"
                        type="button"
                        onClick={() => editFaq(faq)}
                        aria-label={`Edit FAQ ${faq.id}`}
                        title="Edit FAQ"
                      >
                        <Pencil aria-hidden="true" size={16} />
                      </button>
                      <button
                        className="icon-button table-icon danger-icon"
                        type="button"
                        onClick={() => deleteFaq(faq)}
                        aria-label={`Delete FAQ ${faq.id}`}
                        title="Delete FAQ"
                      >
                        <Trash2 aria-hidden="true" size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && faqs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    No FAQs added yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
