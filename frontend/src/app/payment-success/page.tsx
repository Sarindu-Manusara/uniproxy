import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, LayoutDashboard } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <main className="payment-result-page">
      <section className="payment-result-card">
        <div className="payment-result-logo">
          <Image src="/uniproxy-logo.png" alt="" width={500} height={500} />
        </div>
        <CheckCircle2 aria-hidden="true" size={42} />
        <p className="eyebrow">Payment successful</p>
        <h1>Your payment is being processed.</h1>
        <p>
          Your account will update after the crypto network confirmation. Plan
          purchases will appear in Active Plans when activation is complete.
        </p>
        <Link className="hero-link" href="/">
          <LayoutDashboard aria-hidden="true" size={17} />
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
