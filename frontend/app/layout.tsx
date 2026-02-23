import "./globals.css";
import type { Metadata } from "next";
import AppHeader from "../components/layout/AppHeader";
export const metadata: Metadata = {
  title: "QazTender AI",
  description: "AI-powered tender risk intelligence",
  icons: {
    icon: "/logo_qaztender.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        <AppHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}