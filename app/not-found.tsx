import Link from "next/link";

export default function NotFound() {
  return <main className="login-shell"><div className="login-card"><span className="eyebrow">404</span><h1 style={{ color: "var(--navy)" }}>Page not found</h1><p className="muted">The requested page or publication record could not be found.</p><Link className="btn btn-primary" href="/">Return to homepage</Link></div></main>;
}
