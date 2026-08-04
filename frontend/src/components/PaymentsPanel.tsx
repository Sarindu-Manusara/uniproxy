"use client";

import { FormEvent, useState } from "react";
import {
  Wallet,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "./ToastProvider";

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
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const createPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.createPayment(token, amount);

      if (isPaymentErrorResponse(response)) {
        toast.error("Payment redirect unavailable", friendlyPaymentError(response));
        return;
      }

      onChanged();

      if (response.trim().startsWith("http")) {
        toast.info("Opening payment invoice", "Redirecting to secure checkout.");
        window.location.href = response.trim();
      } else {
        toast.success("Payment created", response);
      }
    } catch (requestError) {
      toast.error(
        "Payment redirect unavailable",
        requestError instanceof Error
          ? friendlyPaymentError(requestError.message)
          : "Payment redirect could not be created. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

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
    </section>
  );
}
