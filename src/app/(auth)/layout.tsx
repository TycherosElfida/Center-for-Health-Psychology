/**
 * Auth Layout — (auth) route group
 *
 * Renders a clean, full-height viewport with no Navbar, Footer,
 * or global padding. The split-screen auth pages fill edge-to-edge.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white">{children}</div>;
}
