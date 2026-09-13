"use client";

import { ExternalLink, HelpCircle, MessageCircle } from "lucide-react";

const telegramUrl =
  process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/UniProxy";

const faqs = [
  {
    question: "What proxy protocols are supported?",
    answer:
      "UniProxy supports HTTP, HTTPS, and SOCKS5 credentials from one customer dashboard.",
  },
  {
    question: "Can I keep the same IP for a session?",
    answer:
      "Yes. Sticky sessions can keep one IP for multi-step workflows, while rotation is available when fresh IPs are needed.",
  },
  {
    question: "Do I need a credit card to create an account?",
    answer:
      "No. You can create an account and review the dashboard before adding funds or purchasing a plan.",
  },
  {
    question: "Which proxy types are available?",
    answer:
      "UniProxy currently offers datacenter and IPv6 proxy plans through the dashboard.",
  },
];

export function SupportPanel() {
  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Support</p>
          <h1>How can we help?</h1>
        </div>
      </div>

      <article className="tool-panel support-contact-card">
        <div>
          <MessageCircle aria-hidden="true" size={24} />
          <h2>Contact via Telegram</h2>
          <p>Reach the UniProxy support team directly on Telegram.</p>
        </div>
        <a
          className="primary-button"
          href={telegramUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open Telegram
          <ExternalLink aria-hidden="true" size={16} />
        </a>
      </article>

      <article className="tool-panel">
        <div className="support-faq-heading">
          <HelpCircle aria-hidden="true" size={22} />
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>Frequently Asked Questions</h2>
          </div>
        </div>

        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </article>
    </section>
  );
}
