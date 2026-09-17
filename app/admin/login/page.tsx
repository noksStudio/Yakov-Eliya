"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/admin/leads");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "שגיאה בהתחברות");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center px-6 py-32">
      <form
        onSubmit={handleSubmit}
        className="glow-border glass w-full max-w-sm rounded-3xl px-8 py-10"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))]">
            <Lock className="h-5 w-5 text-white" />
          </span>
          <h1 className="text-xl font-bold">כניסת ניהול</h1>
          <p className="text-sm text-muted">אזור מוגן ליעקב-אליה בלבד</p>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="שם משתמש"
            autoComplete="username"
            className="rounded-xl bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-primary-2/40"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="סיסמה"
            autoComplete="current-password"
            className="rounded-xl bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-primary-2/40"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))] py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          >
            {loading ? "מתחבר..." : "התחברות"}
          </button>
        </div>
      </form>
    </div>
  );
}
