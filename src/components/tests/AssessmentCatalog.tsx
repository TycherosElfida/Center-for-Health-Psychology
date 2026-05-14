"use client";

import { useState, useMemo, useCallback, type ReactNode } from "react";
import Link from "next/link";
import {
  Search,
  LayoutGrid,
  List,
  Rows3,
  ChevronDown,
  X,
  SlidersHorizontal,
  ArrowRight,
  Tag,
  Loader2,
} from "lucide-react";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { trpc } from "@/lib/trpc/client";
import { AssessmentCard } from "@/components/tests/AssessmentCard";
import {
  CATEGORY_ICONS,
  SORT_OPTIONS,
  filterAndSortTests,
  type SortBy,
  type TestMeta,
} from "@/lib/data/tests";
import Image from "next/image";

/* ═══════════════════════════════════════════════════════
   View Mode Types
   ═══════════════════════════════════════════════════════ */
type ViewMode = "card" | "list" | "compact";

const VIEW_MODES: { mode: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
  { mode: "card", icon: LayoutGrid, label: "Cards" },
  { mode: "list", icon: List, label: "List" },
  { mode: "compact", icon: Rows3, label: "Compact" },
];

/* ═══════════════════════════════════════════════════════
   Main Catalog Client Component
   ═══════════════════════════════════════════════════════ */
export function AssessmentCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  // Fetch tests from database via tRPC
  const { data: tests = [], isLoading } = trpc.publicTests.getPublishedTests.useQuery();

  // Derive categories from fetched data
  const allCategories = useMemo(() => {
    const cats = Array.from(new Set(tests.map((t) => t.category)));
    return ["All", ...cats];
  }, [tests]);

  const filtered = useMemo(
    () => filterAndSortTests(tests, searchQuery, activeCategory, sortBy),
    [tests, searchQuery, activeCategory, sortBy]
  );

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setActiveCategory("All");
  }, []);

  const hasActiveFilters = searchQuery !== "" || activeCategory !== "All";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading instruments...</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Controls Bar ── */}
      <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
        <div className="relative z-10 -mt-6 rounded-2xl border border-border/60 bg-card p-5 shadow-lg shadow-primary/3">
          {/* Row: Search + Sort + View Toggle + Mobile Filter Button */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex min-h-11 min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2.5">
              <Search size={16} className="shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search instruments by name, tag, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="flex p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort dropdown — Desktop only */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setSortMenuOpen(!sortMenuOpen)}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary"
              >
                Sort: {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                <ChevronDown size={14} />
              </button>
              {sortMenuOpen && (
                <>
                  {/* Backdrop to close */}
                  <div className="fixed inset-0 z-40" onClick={() => setSortMenuOpen(false)} />
                  <div className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[160px] overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortBy(opt.value);
                          setSortMenuOpen(false);
                        }}
                        className="block w-full px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-secondary/60"
                        style={{
                          background:
                            sortBy === opt.value
                              ? "var(--brand-primary-light, #EDE9F8)"
                              : undefined,
                          fontWeight: sortBy === opt.value ? 600 : 400,
                          color:
                            sortBy === opt.value ? "var(--primary)" : "var(--muted-foreground)",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* View mode toggle — Desktop only */}
            <div className="hidden items-center overflow-hidden rounded-xl border border-border sm:flex">
              {VIEW_MODES.map(({ mode, icon: VIcon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={label}
                  className="flex min-h-11 items-center gap-1.5 px-3.5 py-2.5 text-xs transition-all"
                  style={{
                    background:
                      viewMode === mode
                        ? "linear-gradient(135deg, var(--brand-primary, #9B8EC4), var(--brand-primary-dark, #6B5CA0))"
                        : "var(--secondary)",
                    color: viewMode === mode ? "white" : "var(--muted-foreground)",
                    fontWeight: viewMode === mode ? 600 : 400,
                  }}
                >
                  <VIcon size={15} />
                  <span className="hidden lg:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Mobile filter trigger (<sm) */}
            <MobileFilterDrawer>
              <FilterControls
                categories={allCategories}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            </MobileFilterDrawer>
          </div>

          {/* Category pills — Desktop only (hidden on mobile; shown in Drawer) */}
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            {allCategories.map((cat) => {
              const isActive = activeCategory === cat;
              const CatIcon = CATEGORY_ICONS[cat] || Tag;
              const count =
                cat === "All" ? tests.length : tests.filter((t) => t.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="flex min-h-11 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] transition-all active:scale-95"
                  style={{
                    border: isActive ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
                    background: isActive ? "var(--brand-primary-light, #EDE9F8)" : "var(--card)",
                    color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                    fontWeight: isActive ? 600 : 450,
                  }}
                >
                  <CatIcon
                    size={14}
                    className={isActive ? "text-primary" : "text-muted-foreground"}
                  />
                  {cat}
                  <span
                    className="ml-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none"
                    style={{
                      background: isActive
                        ? "color-mix(in srgb, var(--brand-primary, #9B8EC4) 20%, transparent)"
                        : "var(--secondary)",
                      color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Results counter ── */}
      <div className="mx-auto max-w-[1120px] px-4 pt-5 sm:px-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
            {tests.length} instruments
            {activeCategory !== "All" && (
              <span>
                {" "}
                in <span className="font-semibold text-primary">{activeCategory}</span>
              </span>
            )}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary active:scale-95"
            >
              <X size={12} />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Content Area ── */}
      <section className="mx-auto max-w-[1120px] px-4 pb-16 pt-5 sm:px-6 pb-safe">
        {filtered.length === 0 ? (
          <EmptyState query={searchQuery} category={activeCategory} onClear={clearFilters} />
        ) : viewMode === "card" ? (
          <CardGrid tests={filtered} />
        ) : viewMode === "list" ? (
          <ListView tests={filtered} />
        ) : (
          <CompactView tests={filtered} />
        )}
      </section>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   Mobile Filter Drawer (Bottom Sheet)
   ═══════════════════════════════════════════════════════ */
function MobileFilterDrawer({ children }: { children: ReactNode }) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-secondary sm:hidden">
          <SlidersHorizontal size={14} />
          Filters
        </button>
      </DrawerTrigger>
      <DrawerContent className="pb-safe">
        <DrawerHeader>
          <DrawerTitle className="font-heading">Filters & Sorting</DrawerTitle>
          <DrawerDescription>Refine the instrument catalog</DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[60vh] overflow-y-auto px-4 pb-4">{children}</div>
        <DrawerFooter>
          <DrawerClose asChild>
            <button className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]">
              Apply Filters
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

/* ═══════════════════════════════════════════════════════
   Shared filter controls (used inside MobileFilterDrawer)
   ═══════════════════════════════════════════════════════ */
function FilterControls({
  categories,
  activeCategory,
  setActiveCategory,
  sortBy,
  setSortBy,
  onDone,
}: {
  categories: string[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  onDone?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Category pills */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Category
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const CatIcon = CATEGORY_ICONS[cat] || Tag;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  onDone?.();
                }}
                className="flex min-h-11 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all active:scale-95"
                style={{
                  border: isActive ? "1.5px solid var(--primary)" : "1.5px solid var(--border)",
                  background: isActive ? "var(--brand-primary-light, #EDE9F8)" : "var(--card)",
                  color: isActive ? "var(--primary)" : "var(--muted-foreground)",
                  fontWeight: isActive ? 600 : 450,
                }}
              >
                <CatIcon
                  size={14}
                  className={isActive ? "text-primary" : "text-muted-foreground"}
                />
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sort by
        </p>
        <div className="flex flex-wrap gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setSortBy(opt.value);
                onDone?.();
              }}
              className="min-h-11 rounded-lg border px-4 py-2 text-sm transition-all active:scale-95"
              style={{
                borderColor: sortBy === opt.value ? "var(--primary)" : "var(--border)",
                background:
                  sortBy === opt.value ? "var(--brand-primary-light, #EDE9F8)" : "var(--card)",
                color: sortBy === opt.value ? "var(--primary)" : "var(--muted-foreground)",
                fontWeight: sortBy === opt.value ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Card Grid View — 3-column with staggered entrance
   ═══════════════════════════════════════════════════════ */
function CardGrid({ tests }: { tests: TestMeta[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {tests.map((test, i) => (
        <div
          key={test.slug}
          className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
          style={{ animationDelay: `${i * 70}ms`, animationDuration: "500ms" }}
        >
          <AssessmentCard test={test} index={i} />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   List View — Full-width horizontal cards
   ═══════════════════════════════════════════════════════ */
function ListView({ tests }: { tests: TestMeta[] }) {
  return (
    <div className="flex flex-col gap-5">
      {tests.map((test, i) => {
        return (
          <div
            key={test.slug}
            className="animate-in fade-in slide-in-from-bottom-3 fill-mode-both overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-shadow hover:shadow-lg hover:shadow-primary/5"
            style={{
              animationDelay: `${i * 60}ms`,
              animationDuration: "450ms",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4">
              {/* Left: thumbnail panel */}
              <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto">
                {test.thumbnailUrl ? (
                  <Image
                    src={test.thumbnailUrl}
                    alt={test.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                ) : (
                  <div
                    className="flex h-full min-h-[140px] w-full items-center justify-center"
                    style={{
                      background: `linear-gradient(145deg, ${test.color}20, ${test.color}08)`,
                    }}
                  >
                    <span
                      className="font-heading text-3xl font-black"
                      style={{ color: `${test.color}50` }}
                    >
                      {test.abbreviation}
                    </span>
                  </div>
                )}
              </div>

              {/* Right content */}
              <div className="col-span-1 flex flex-col justify-between p-6 md:col-span-3">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{
                        background: `${test.color}15`,
                        color: test.color,
                      }}
                    >
                      {test.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {test.questionCount} items
                    </span>
                  </div>
                  <h2 className="mb-1 font-heading text-lg font-bold text-foreground">
                    {test.abbreviation}
                  </h2>
                  <p className="text-[13px] text-muted-foreground">{test.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70 line-clamp-2">
                    {test.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {test.author ?? "—"}
                    {test.releaseYear ? ` (${test.releaseYear})` : ""}
                  </p>
                  <Link
                    href={`/test/${test.slug}/briefing`}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[13px] font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
                    style={{
                      background: `linear-gradient(135deg, ${test.color}, ${test.color}CC)`,
                      boxShadow: `0 4px 14px ${test.color}35`,
                    }}
                  >
                    Start <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Compact (Table) View
   ═══════════════════════════════════════════════════════ */
function CompactView({ tests }: { tests: TestMeta[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      {/* Header — hidden on mobile */}
      <div
        className="hidden items-center gap-3 border-b border-border/50 bg-secondary/30 px-5 py-3 md:grid"
        style={{ gridTemplateColumns: "2fr 1fr 80px 100px" }}
      >
        {["Instrument", "Category", "Items", ""].map((h) => (
          <span
            key={h}
            className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {tests.map((test, i) => {
        return (
          <div
            key={test.slug}
            className="animate-in fade-in fill-mode-both"
            style={{ animationDelay: `${i * 40}ms`, animationDuration: "350ms" }}
          >
            {/* Desktop row */}
            <div
              className="hidden items-center gap-3 px-5 py-4 transition-colors hover:bg-secondary/20 md:grid"
              style={{
                gridTemplateColumns: "2fr 1fr 80px 100px",
                borderBottom: i < tests.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                  style={{ background: `${test.color}12`, color: test.color }}
                >
                  {test.abbreviation.slice(0, 3)}
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold text-foreground">
                    {test.abbreviation}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {test.author ?? "—"}
                    {test.releaseYear ? ` (${test.releaseYear})` : ""}
                  </p>
                </div>
              </div>
              <span
                className="w-fit rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: `${test.color}10`,
                  color: test.color,
                  border: `1px solid ${test.color}25`,
                }}
              >
                {test.category}
              </span>
              <span className="text-[13px] font-medium text-foreground/70">
                {test.questionCount}
              </span>
              <Link
                href={`/test/${test.slug}/briefing`}
                className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${test.color}, ${test.color}CC)`,
                  boxShadow: `0 2px 8px ${test.color}30`,
                }}
              >
                Mulai <ArrowRight size={12} />
              </Link>
            </div>

            {/* Mobile compact card (<md) */}
            <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3 md:hidden">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                style={{ background: `${test.color}14`, color: test.color }}
              >
                {test.abbreviation.slice(0, 3)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold text-foreground">
                  {test.abbreviation}
                </p>
                <p className="text-xs text-muted-foreground">{test.questionCount} items</p>
              </div>
              <Link
                href={`/test/${test.slug}/briefing`}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                style={{ background: test.color }}
              >
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Shared Helpers
   ═══════════════════════════════════════════════════════ */

function EmptyState({
  query,
  category,
  onClear,
}: {
  query: string;
  category: string;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20">
      <Search size={40} className="text-muted-foreground/30" strokeWidth={1.5} />
      <h3 className="mt-4 font-heading text-xl font-bold text-foreground">No instruments found</h3>
      <p className="mt-2 max-w-[400px] text-center text-sm text-muted-foreground">
        {query
          ? `No results for "${query}"${category !== "All" ? ` in ${category}` : ""}`
          : `No instruments in the ${category} category yet`}
      </p>
      <button
        onClick={onClear}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90 active:scale-95"
      >
        Clear all filters
      </button>
    </div>
  );
}
