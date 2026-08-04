"use client";

import { useCallback, useEffect, useState } from "react";
import { HelpCircle, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { SupportFaq } from "@/lib/types";
import { useToast } from "./ToastProvider";

type SupportPanelProps = {
  token: string;
};

const telegramUrl =
  process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || "https://t.me/uniproxies";

export function SupportPanel({ token }: SupportPanelProps) {
  const [faqs, setFaqs] = useState<SupportFaq[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const loadFaqs = useCallback(async () => {
    setLoading(true);

    try {
      setFaqs(await api.supportFaqs(token));
    } catch (requestError) {
      toast.error(
        "FAQs unavailable",
        requestError instanceof Error ? requestError.message : "Unable to load FAQs"
      );
    } finally {
      setLoading(false);
    }
  }, [toast, token]);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Support</p>
          <h1>Support</h1>
        </div>
      </div>

      <div className="tool-panel support-contact-panel">
        <a
          className="primary-button"
          href={telegramUrl}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle aria-hidden="true" size={18} />
          Contact via Telegram
        </a>
      </div>

      <section className="faq-section-panel" aria-labelledby="faq-heading">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 id="faq-heading">Frequently asked questions</h2>
          </div>
        </div>

        <div className="faq-list support-faq-list">
          {faqs.map((faq) => (
            <details key={faq.id}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}

          {!loading && faqs.length === 0 ? (
            <div className="empty-table-state faq-empty-state">
              <HelpCircle aria-hidden="true" size={22} />
              <strong>No FAQs available</strong>
              <span>Frequently asked questions will appear here soon.</span>
            </div>
          ) : null}

          {loading ? <p className="muted-row">Loading FAQs</p> : null}
        </div>
      </section>
    </section>
  );
}
