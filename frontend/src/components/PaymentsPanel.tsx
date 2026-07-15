"use client";

import { FormEvent, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import { api } from "@/lib/api";

type PaymentsPanelProps = {
  token: string;
  onChanged: () => void;
};

function friendlyPaymentError(value: string) {
  const message = value.toLowerCase();

  if (message.includes("invalid_api_key") || message.includes("invalid api key")) {
    return "Payment redirect is unavailable because the payment gateway is not configured correctly. Please contact support.";
  }

  if (message.includes("not configured") || message.includes("payment gateway authentication")) {
    return "Payment redirect is unavailable because the payment gateway is not configured correctly. Please contact support.";
  }

  if (message.includes("403") || message.includes("forbidden")) {
    return "Payment redirect is unavailable right now. Please contact support.";
  }

  if (message.includes("error creating payment")) {
    return "Payment redirect could not be created. Please try again later.";
  }

  return value;
}

function isPaymentErrorResponse(value: string) {
  const message = value.toLowerCase();
  return (
    message.includes("error creating payment") ||
    message.includes("invalid_api_key") ||
    message.includes("invalid api key") ||
    message.includes("not configured") ||
    message.includes("payment gateway authentication") ||
    message.includes("forbidden")
  );
}

export function PaymentsPanel({ token, onChanged }: PaymentsPanelProps) {
  const [amount, setAmount] = useState("25");
  const [paymentResponse, setPaymentResponse] = useState("");
  const [accountResponse, setAccountResponse] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const createPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setPaymentResponse("");

    try {
      const response = await api.createPayment(token, amount);

      if (isPaymentErrorResponse(response)) {
        setError(friendlyPaymentError(response));
        return;
      }

      setPaymentResponse(response);
      onChanged();

      if (response.trim().startsWith("http")) {
        window.location.href = response.trim();
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? friendlyPaymentError(requestError.message)
          : "Payment redirect could not be created. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async () => {
    setLoading(true);
    setError("");
    setAccountResponse("");

    try {
      const response = await api.createNowPaymentsAccount(token);

      if (isPaymentErrorResponse(response)) {
        setError(friendlyPaymentError(response));
        return;
      }

      setAccountResponse(response);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? friendlyPaymentError(requestError.message)
          : "Unable to initialize NOWPayments"
      );
    } finally {
      setLoading(false);
    }
  };

  const paymentUrl = paymentResponse.trim().startsWith("http")
    ? paymentResponse.trim()
    : "";

  return (
    <section className="page-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Payments</p>
          <h1>Balance deposits</h1>
        </div>
      </div>

      <form className="tool-panel compact-form" onSubmit={createPayment}>
        <label>
          <span>Amount USD</span>
          <input
            min="1"
            step="0.01"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          <Wallet aria-hidden="true" size={18} />
          Create payment
        </button>
      </form>

      <div className="tool-panel split-panel">
        <div>
          <p className="eyebrow">NOWPayments</p>
          <h2>Account connection</h2>
        </div>
        <button className="secondary-button" type="button" onClick={createAccount} disabled={loading}>
          <UserCheck aria-hidden="true" size={18} />
          Initialize
        </button>
      </div>

      {paymentUrl ? (
        <a className="external-link" href={paymentUrl}>
          <CreditCard aria-hidden="true" size={18} />
          Open payment invoice
          <ExternalLink aria-hidden="true" size={16} />
        </a>
      ) : paymentResponse ? (
        <p className="form-message">{paymentResponse}</p>
      ) : null}

      {accountResponse ? (
        <div className="payment-alert success" role="status">
          <CheckCircle2 aria-hidden="true" size={20} />
          <div>
            <strong>Payment gateway ready</strong>
            <span>{accountResponse}</span>
          </div>
          <button type="button" onClick={() => setAccountResponse("")} aria-label="Dismiss">
            <X aria-hidden="true" size={16} />
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="payment-alert error" role="alert">
          <AlertTriangle aria-hidden="true" size={20} />
          <div>
            <strong>Payment redirect unavailable</strong>
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss">
            <X aria-hidden="true" size={16} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
