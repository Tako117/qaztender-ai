import "../styles/globals.css";
import type { Metadata } from "next";
import { AppProviders } from "../components/providers/AppProviders";
import { AppSidebar } from "../components/shell/AppSidebar";
import { TopBar } from "../components/shell/TopBar";

export const metadata: Metadata = {
  title: "QazTender AI",
  description: "AI-powered procurement risk detection for Kazakhstan"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="tg-bg tg-noise min-h-screen">
        <AppProviders>
          <div className="flex min-h-screen">
            <AppSidebar />
            <div className="flex-1">
              <TopBar />
              <main className="px-6 py-6">{children}</main>
            </div>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}