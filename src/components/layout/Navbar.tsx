"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/tests", label: "Tes" },
  { href: "#faq", label: "FAQ" },
  { href: "#about", label: "Tentang" },
] as const;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg font-bold tracking-tight text-primary"
        >
          <svg viewBox="0 0 28 28" fill="none" className="h-7 w-7" aria-hidden="true">
            <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="2" />
            <path
              d="M9 14.5C9 11.46 11.46 9 14.5 9c1.52 0 2.9.62 3.89 1.61"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="14" cy="14" r="3" fill="currentColor" />
          </svg>
          <span className="hidden sm:inline">Center for Health Psychology</span>
          <span className="sm:hidden">CHP</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="#tests"
              className="ml-2 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Mulai Assessment
            </Link>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
        >
          {mobileOpen ? (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="#tests"
                onClick={() => setMobileOpen(false)}
                className="mt-1 block rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Mulai Assessment
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
