"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="w-full border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo_qaztender.jpeg"
            alt="QazTender AI Logo"
            width={40}
            height={40}
            className="rounded-md object-cover"
            priority
          />
          <span className="text-lg font-semibold tracking-tight">
            QazTender AI
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/dashboard/overview"
            className={`hover:opacity-70 ${
              pathname?.includes("overview") ? "font-semibold" : ""
            }`}
          >
            Overview
          </Link>
          <Link
            href="/dashboard/pricing"
            className={`hover:opacity-70 ${
              pathname?.includes("pricing") ? "font-semibold" : ""
            }`}
          >
            Pricing
          </Link>
          <Link
            href="/dashboard/history"
            className={`hover:opacity-70 ${
              pathname?.includes("history") ? "font-semibold" : ""
            }`}
          >
            History
          </Link>
        </nav>
      </div>
    </header>
  );
}