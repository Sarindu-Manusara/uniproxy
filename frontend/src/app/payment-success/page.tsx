import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, LayoutDashboard } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <main className="payment-result-page">
      <section className="payment-result-card">
        <div className="payment-result-logo">
          <Image src="/uniproxies-logo.png" alt="" width={828} height={828} />
        </div>
        <CheckCircle2 aria-hidden="true" size={42} />
        <p className="eyebrow">Payment successful</p>
        <h1>Your deposit is being processed.</h1>
        <p>
          Thank you. Your payment was completed successfully. Your balance will
          update after the crypto network confirmation and webhook processing.
        </p>
        <Link className="hero-link" href="/">
          <LayoutDashboard aria-hidden="true" size={17} />
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
