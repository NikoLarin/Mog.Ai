import Link from "next/link";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vanity AI Advisor",
  description: "Upload photos and get structured aesthetic coaching insights."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen w-full max-w-6xl p-6 md:p-10">
          <header className="mb-6 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm">
            <Link href="/" className="font-semibold text-slate-100">Mogmax.org</Link>
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
