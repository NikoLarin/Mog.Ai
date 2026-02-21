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
        <main className="mx-auto min-h-screen w-full max-w-6xl p-6 md:p-10">{children}</main>
      </body>
    </html>
  );
}
