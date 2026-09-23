"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useAuth } from "@/components/auth-provider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading, refreshClaims } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user && isAdmin) router.replace("/admin");
  }, [authLoading, user, isAdmin, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await refreshClaims();
      const token = await auth.currentUser?.getIdTokenResult(true);
      if (token?.claims.admin === true) router.replace("/admin");
      else setError("This account is not configured as an administrator.");
    } catch (e) {
      setError(e instanceof Error ? e.message.replace("Firebase: ", "") : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="login-shell"><section className="login-card"><div className="login-brand"><Image src="/site-logo.png" alt="International Conference Proceedings" width={52} height={52} /><div><strong>International Conference Proceedings</strong><p className="small muted" style={{ margin: 0 }}>Administrator access</p></div></div>{error && <div className="notice notice-error">{error}</div>}<form onSubmit={submit}><div className="field"><label htmlFor="admin-email">Email</label><input required type="email" id="admin-email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div><div className="field" style={{ marginTop: 14 }}><label htmlFor="admin-password">Password</label><input required type="password" id="admin-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div><div className="form-actions"><button className="btn btn-primary" disabled={submitting}>{submitting ? "Signing in..." : "Sign in"}</button></div></form></section></main>;
}
