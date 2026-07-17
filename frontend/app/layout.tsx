import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Diligencify Profile Builder",
    template: "%s | Diligencify",
  },
  description:
    "AI-powered due-diligence profile generation. Instantly surface wealth, affiliations, career history, and concerns for any public figure.",
  keywords: [
    "due diligence",
    "background check",
    "wealth profile",
    "AI research",
    "diligencify",
  ],
  robots: { index: false, follow: false }, // Private tool — no indexing
  openGraph: {
    type: "website",
    title: "Diligencify Profile Builder",
    description:
      "AI-powered due-diligence profile generation for financial and legal professionals.",
    siteName: "Diligencify Profile Builder",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="bg-background text-brand-text antialiased">
        {children}
      </body>
    </html>
  );
}
