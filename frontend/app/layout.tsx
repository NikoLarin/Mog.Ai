import Link from "next/link";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MMax – AI Vanity Scan & Looksmaxxing Advisor",
  description: "Upload your photos. Get brutally honest AI physique analysis & maxxing advice. Unlock your full potential.",
  metadataBase: new URL("https://mmax.org"),
  openGraph: {
    title: "MogMax – AI Vanity Scan & Looksmaxxing Advisor",
    description: "Upload your photos. Get brutally honest AI physique analysis & maxxing advice. Unlock your full potential.",
    url: "https://mogmax.org",
    siteName: "MogMax",
    images: [
      {
        url: "/og-image.jpg",           // ← this is the key image
        width: 1200,
        height: 630,
        alt: "MogMax AI Vanity Scan Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MogMax – AI Vanity Scan & Looksmaxxing",
    description: "Upload photos → Get brutally honest AI physique analysis.",
    images: ["/og-image.jpg"],
  },
  // ... your existing icons / other metadata
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-6xl p-6 md:p-10">
          <header className="mb-6 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm">
            <Link href="/" className="font-semibold text-slate-100">Mmax.org</Link>
            <nav className="flex items-center gap-4 text-slate-300">
              <Link href="/" className="hover:text-teal-300">Scan</Link>
              <Link href="/features" className="hover:text-teal-300">Features & FAQ</Link>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
