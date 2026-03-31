import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-secondary/30">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-[400px] w-[600px] rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-24 text-center sm:px-6 sm:pb-28 sm:pt-32 lg:px-8 lg:pb-36 lg:pt-40">
        {/* Badge */}
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-medium text-primary">
          <svg viewBox="0 0 6 6" className="h-1.5 w-1.5 fill-primary" aria-hidden="true">
            <circle cx="3" cy="3" r="3" />
          </svg>
          Universitas Kristen Krida Wacana
        </span>

        {/* Headline */}
        <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Kenali Dirimu{" "}
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Lebih Baik
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Ambil asesmen psikologis yang telah tervalidasi secara ilmiah dan dapatkan hasil skor
          beserta interpretasi klinis secara langsung — gratis, anonim, dan rahasia.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="#tests"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Mulai Assessment
          </Link>
          <Link
            href="#faq"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Pelajari Lebih Lanjut
          </Link>
        </div>

        {/* Trust signals */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            Anonim & Rahasia
          </span>
          <span className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Tervalidasi Ilmiah
          </span>
          <span className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Hasil Instan
          </span>
        </div>
      </div>
    </section>
  );
}
