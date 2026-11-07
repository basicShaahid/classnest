"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { getSupabaseConfigProblem } from "@/lib/supabase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { configured, userEmail, authLoaded, ready, signIn, signUp, busy, localCount, importLocal, signOut, notify } = useStore();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const configProblem = getSupabaseConfigProblem();
  if (!configured) return (
    <section className="surface-card mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">Cloud setup required</h1>
      <p className="mt-3 text-sm">{configProblem ?? "Add the Supabase project URL and publishable key in Vercel project environment settings."}</p>
      <p className="mt-3 text-sm text-muted-ink">Update the values in Vercel Environment Variables and redeploy this branch. Your existing browser records are not affected.</p>
    </section>
  );
  if (!authLoaded) return <p className="text-sm text-muted-ink">Checking your session...</p>;
  if (!userEmail) return (
    <section className="surface-card mx-auto max-w-md p-7">
      <h1 className="text-2xl font-bold">{mode === "signIn" ? "Sign in to ClassNest" : "Create your ClassNest account"}</h1>
      <p className="mt-2 text-sm text-muted-ink">Your lessons and payments sync securely between devices.</p>
      <form className="mt-6 space-y-4" onSubmit={async e => {
        e.preventDefault();
        setWorking(true); setError("");
        try {
          const message = mode === "signIn" ? await signIn(email, password) : await signUp(email, password);
          notify(message);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Authentication failed.");
        } finally { setWorking(false); }
      }}>
        <label className="block text-sm font-semibold">Email
          <input className="form-control mt-2 w-full" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="block text-sm font-semibold">Password
          <input className="form-control mt-2 w-full" type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "signUp" ? "new-password" : "current-password"} required />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button disabled={working} className="button-primary w-full justify-center" type="submit">{working ? "Working..." : mode === "signIn" ? "Sign in" : "Create account"}</button>
      </form>
      <button className="mt-5 text-sm font-semibold text-moss underline" type="button" onClick={() => { setMode(mode === "signIn" ? "signUp" : "signIn"); setError(""); }}>
        {mode === "signIn" ? "Need an account? Sign up" : "Already registered? Sign in"}
      </button>
    </section>
  );
  if (!ready) return <p className="text-sm text-muted-ink">Loading your classes from the cloud...</p>;
  return <>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-ink">
      <span>Signed in as <strong>{userEmail}</strong></span>
      <button type="button" className="button-secondary" onClick={() => void signOut().catch(e => notify(e.message))}>Sign out</button>
    </div>
    {localCount > 0 && (
      <div className="mb-6 rounded-2xl border border-[#e4e9da] bg-[#f3f7ef] p-4 text-sm">
        <p className="font-semibold">Found {localCount} class{localCount === 1 ? "" : "es"} saved in this browser.</p>
        <p className="mt-1 text-muted-ink">Import missing classes to your cloud account. Existing cloud records will not be overwritten. Your browser backup will be retained.</p>
        <button disabled={busy} type="button" className="button-secondary mt-3" onClick={() => void importLocal().catch(e => notify("Import failed: " + e.message))}>{busy ? "Working..." : "Import browser classes"}</button>
      </div>
    )}
    {children}
  </>;
}
