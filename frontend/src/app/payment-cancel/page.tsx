import Image from "next/image";
import Link from "next/link";
import { RotateCcw, XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <main className="payment-result-page">
      <section className="payment-result-card cancelled">
        <div className="payment-result-logo">
          <Image src="/uniproxies-logo.png" alt="" width={828} height={828} />
        </div>
        <XCircle aria-hidden="true" size={42} />
        <p className="eyebrow">Payment cancelled</p>
        <h1>Your payment was not completed.</h1>
        <p>
          No balance was added. You can return to the dashboard and create a new
          crypto payment invoice when you are ready.
        </p>
        <Link className="hero-link" href="/">
          <RotateCcw aria-hidden="true" size={17} />
          Try again
        </Link>
      </section>
    </main>
  );
}
