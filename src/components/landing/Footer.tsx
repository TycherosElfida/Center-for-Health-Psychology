import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-secondary/20">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <svg viewBox="0 0 28 28" fill="none" className="h-5 w-5 text-primary" aria-hidden="true">
            <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="2" />
            <path
              d="M9 14.5C9 11.46 11.46 9 14.5 9c1.52 0 2.9.62 3.89 1.61"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="14" cy="14" r="3" fill="currentColor" />
          </svg>
          <span>Center for Health Psychology</span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="#tests" className="transition-colors hover:text-foreground">
            Tes
          </Link>
          <Link href="#faq" className="transition-colors hover:text-foreground">
            FAQ
          </Link>
          <Link href="#about" className="transition-colors hover:text-foreground">
            Tentang
          </Link>
        </nav>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground/70">
          © {currentYear} UKRIDA. Hak cipta dilindungi.
        </p>
      </div>
    </footer>
  );
}
