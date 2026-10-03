"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Loader2, LogOut } from "lucide-react";
import type { Settings } from "@/lib/life/types";
import { lifeApi } from "./api";
import { AiSettings } from "./AiSettings";
import { BackupSettings } from "./BackupSettings";
import { CalendarSubscribe } from "./CalendarSubscribe";
import { IntegrationsSettings } from "./IntegrationsSettings";
import { clearOfflineData } from "./offline-cache";
import { ShabbatSettings } from "./ShabbatSettings";
import { TelegramSettings } from "./TelegramSettings";

type TimeKey = { [K in keyof Settings]: Settings[K] extends string | null ? K : never }[keyof Settings];

const GROUPS: { title: string; fields: { key: TimeKey; label: string; optional?: boolean }[] }[] = [
  {
    title: "שינה וקימה",
    fields: [
      { key: "wake_time", label: "קימה" },
      { key: "screens_off_time", label: "מסכים כבויים" },
      { key: "sleep_time", label: "שינה" },
    ],
  },
  {
    title: "תפילות",
    fields: [
      { key: "shacharit_time", label: "שחרית" },
      { key: "mincha_time", label: "מנחה", optional: true },
      { key: "arvit_time", label: "ערבית", optional: true },
    ],
  },
  {
    title: "שגרת יום",
    fields: [
      { key: "deep_work_start", label: "עבודה עמוקה: התחלה" },
      { key: "deep_work_end", label: "עבודה עמוקה: סיום" },
      { key: "day_close_time", label: "סגירת יום" },
      { key: "hitbodedut_time", label: "התבודדות" },
    ],
  },
];

export function LifeSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [demo, setDemo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    lifeApi<{ settings: Settings; demo: boolean }>("/settings")
      .then((d) => {
        setSettings(d.settings);
        setDemo(d.demo);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  if (!settings) {
    return error ? (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-black">הגדרות</h1>
        <p className="rounded-xl bg-red-500/10 p-4 text-sm leading-relaxed text-red-300">{error}</p>
        <Link href="/life/settings/setup" className="flex items-center justify-between gap-3 rounded-2xl border border-border-soft bg-surface p-4 text-sm">
          <span>
            <span className="block text-[15px] font-bold">חיבור המערכת</span>
            <span className="mt-1 block text-xs text-gold-2">מדריך צעד־אחר־צעד ובדיקת כל החיבורים</span>
          </span>
          <ChevronLeft className="h-5 w-5 shrink-0 text-muted" aria-hidden />
        </Link>
      </div>
    ) : (
      <div className="flex min-h-[60svh] items-center justify-center text-muted" role="status">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      </div>
    );
  }

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings({ ...settings, [key]: value });
    setSaved(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const d = await lifeApi<{ settings: Settings }>("/settings", { method: "PUT", body: settings });
      setSettings(d.settings);
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await clearOfflineData();
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.replace("/admin/login?next=/life");
  };

  // While something is missing the connection guide comes first; once connected it moves to the end.
  const needsSetup = demo;
  const setupCard = (
    <Link href="/life/settings/setup" className="flex items-center justify-between gap-3 rounded-2xl border border-border-soft bg-surface p-4 text-sm">
      <span className="min-w-0">
        <span className="mb-1 block text-[15px] font-bold">חיבור המערכת</span>
        <Status ok={!demo} label="מסד נתונים" hint={demo ? "מצב הדגמה: Supabase לא מחובר, הנתונים לא נשמרים" : undefined} />
        <span className="mt-1 block text-xs text-gold-2">מדריך צעד־אחר־צעד ובדיקת כל החיבורים</span>
      </span>
      <ChevronLeft className="h-5 w-5 shrink-0 text-muted" aria-hidden />
    </Link>
  );

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <h1 className="text-2xl font-black">הגדרות</h1>
      {needsSetup && setupCard}

      {GROUPS.map((group) => (
        <section key={group.title} className="rounded-2xl border border-border-soft bg-surface p-4">
          <h2 className="mb-3 text-[15px] font-bold">{group.title}</h2>
          <div className="grid gap-2.5">
            {group.fields.map(({ key, label, optional }) => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm">
                <span>{label}</span>
                <span className="flex items-center gap-2">
                  {optional && settings[key] && (
                    <button type="button" onClick={() => set(key, null)} className="text-xs text-muted underline">
                      נקה
                    </button>
                  )}
                  <input
                    type="time"
                    value={settings[key] ?? ""}
                    required={!optional}
                    onChange={(e) => set(key, (e.target.value || null) as Settings[typeof key])}
                    className="font-latin w-[8.5rem] rounded-lg bg-white/5 px-2 py-2 text-center text-sm outline-none focus:ring-1 focus:ring-gold/40"
                  />
                </span>
              </label>
            ))}
            {group.title === "שגרת יום" && (
              <label className="flex items-center justify-between gap-3 text-sm">
                <span>משך התבודדות</span>
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={180}
                    step={5}
                    value={settings.hitbodedut_minutes}
                    onChange={(e) => set("hitbodedut_minutes", Number(e.target.value))}
                    className="font-latin w-20 rounded-lg bg-white/5 px-3 py-2 text-center text-sm outline-none"
                  />
                  <span className="text-xs text-muted">דק׳</span>
                </span>
              </label>
            )}
          </div>
        </section>
      ))}

      <section className="rounded-2xl border border-border-soft bg-surface p-4">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            <span className="block font-bold">שקט בשבת ובחג</span>
            <span className="text-xs text-muted">בשבת ובחג המערכת לא מציגה לו״ז ולא מתכננת</span>
          </span>
          <input
            type="checkbox"
            checked={settings.shabbat_silence}
            onChange={(e) => set("shabbat_silence", e.target.checked)}
            className="h-5 w-5 accent-[#d4a24e]"
          />
        </label>
        <label className="mt-3 flex items-center justify-between gap-3 border-t border-border-soft pt-3 text-sm">
          <span>
            <span className="block font-bold">חופש בחול המועד</span>
            <span className="text-xs text-muted">בחול המועד סוכות ופסח: בלי בלוק עבודה ויעדי מכירות, ובטלגרם רק הודעת בוקר ותזכורות</span>
          </span>
          <input
            type="checkbox"
            checked={settings.chol_hamoed_off}
            onChange={(e) => set("chol_hamoed_off", e.target.checked)}
            className="h-5 w-5 accent-[#d4a24e]"
          />
        </label>
        <label className="mt-3 flex items-center justify-between gap-3 border-t border-border-soft pt-3 text-sm">
          <span>
            <span className="block font-bold">תחילת השגרה</span>
            <span className="text-xs text-muted">לפני התאריך הזה אין תזכורות</span>
          </span>
          <input
            type="date"
            value={settings.start_date ?? ""}
            onChange={(e) => set("start_date", e.target.value || null)}
            className="font-latin w-[9.5rem] rounded-lg bg-white/5 px-2 py-2 text-center text-sm outline-none"
          />
        </label>
      </section>

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-[#1d1407] disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
        {saved ? "נשמר" : "שמירה"}
      </button>

      <TelegramSettings demo={demo} />
      <AiSettings />
      <ShabbatSettings />
      <CalendarSubscribe />
      <IntegrationsSettings />
      <BackupSettings />

      {!needsSetup && setupCard}

      <button type="button" onClick={logout} className="flex items-center justify-center gap-2 py-2 text-sm text-muted">
        <LogOut className="h-4 w-4" /> התנתקות
      </button>
    </form>
  );
}

function Status({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <span className="flex items-start gap-2 py-1">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${ok ? "bg-emerald-400" : "bg-amber-400"}`} />
      <span>
        {label}
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </span>
  );
}
