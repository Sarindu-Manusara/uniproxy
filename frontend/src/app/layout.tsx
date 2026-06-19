import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UniProxy Operations",
  description: "UniProxy customer and admin dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
