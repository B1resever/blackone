import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "B1 Reserve | Private Luxury Mobility",
  description:
    "Premium chauffeur transportation, airport transfers, hourly service and luxury mobility across South Florida."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
