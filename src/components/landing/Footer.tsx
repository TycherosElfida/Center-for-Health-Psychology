/**
 * Footer — Minimal site footer matching Figma reference.
 *
 * Server Component — no interactivity needed.
 * Single centered copyright line with purple border-top.
 */

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="py-6 text-center"
      style={{
        borderTop: "1px solid var(--border-subtle, #E2DCF0)",
        backgroundColor: "var(--surface-subtle, #F5F3FA)",
      }}
    >
      <p className="text-[13px]" style={{ color: "var(--text-muted, #718096)" }}>
        © {currentYear} Center for Health Psychology · For educational & screening purposes only
      </p>
    </footer>
  );
}
