"use client";

import { useEffect, useState } from "react";
import { BadgeDollarSign, ChevronDown, Loader2, MessageCircle, Phone, Plus } from "lucide-react";
import { addDays, israelToday } from "@/lib/life/time";
import { isOpenLead, leadStatusLabel, telUrl, whatsappUrl, type Lead } from "@/lib/life/lead-types";
import { lifeApi } from "./api";

const shortDate = (d: string) => `${Number(d.slice(8, 10))}.${Number(d.slice(5, 7))}`;
const dueOf = (lead: Lead) => lead.follow_up_date ?? lead.created_at.slice(0, 10);

function dueLabel(due: string, today: string) {
  if (due < today) return { text: "באיחור", tone: "text-amber-300" };
  if (due === today) return { text: "לחזור היום", tone: "text-gold-2" };
  if (due === addDays(today, 1)) return { text: "מחר", tone: "text-muted" };
  return { text: shortDate(due), tone: "text-muted" };
}

function ago(iso: string) {
  const hours = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "עכשיו";
  if (hours < 24) return `לפני ${hours} שע׳`;
  const days = Math.round(hours / 24);
  return days === 1 ? "אתמול" : `לפני ${days} ימים`;
}

/**
 * Leads: people who reached out, kept apart from the deals until he says there is money on the
 * table ("יש כאן עסקה"). `onDeal` reloads the deal board after one is opened.
 */
export function LeadsSection({ onDeal, onError }: { onDeal: () => void; onError: (m: string) => void }) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const today = israelToday();

  const load = () =>
    lifeApi<{ leads: Lead[] }>("/leads")
      .then((d) => setLeads(d.leads))
      .catch((e) => onError((e as Error).message));

  useEffect(() => {
    lifeApi<{ leads: Lead[] }>("/leads")
      .then((d) => setLeads(d.leads))
      .catch((e) => onError((e as Error).message));
  }, [onError]);

  if (!leads) {
    return (
      <div className="flex justify-center py-4 text-muted" role="status">
        <Loader2 className="h-5 w-5 animate-spin" aria-label="טוען לידים" />
      </div>
    );
  }

  const open = leads.filter(isOpenLead).sort((a, b) => dueOf(a).localeCompare(dueOf(b)));
  const closed = leads.filter((l) => !isOpenLead(l));
  const dueNow = open.filter((l) => dueOf(l) <= today).length;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="leads-title">
      <div className="flex items-baseline justify-between">
        <h2 id="leads-title" className="text-[15px] font-bold">
          לידים
        </h2>
        <span className="text-xs text-muted">{open.length ? `${open.length} פתוחים${dueNow ? ` · ${dueNow} לחזור היום` : ""}` : "אין לידים פתוחים"}</span>
      </div>
      <p className="-mt-2 text-xs text-muted">מי שפנה ועוד אין שם כסף. כשיש, ״יש כאן עסקה״ פותח עסקה.</p>

      {open.map((lead) => (
        <LeadCard key={lead.id} lead={lead} today={today} onChange={load} onDeal={() => (load(), onDeal())} onError={onError} />
      ))}

      <AddLead onAdded={load} onError={onError} />

      {closed.length > 0 && (
        <details className="rounded-2xl border border-border-soft bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold">לידים שטופלו ({closed.length})</summary>
          <ul className="mt-2 grid gap-1.5 text-sm">
            {closed.slice(0, 30).map((l) => (
              <li key={l.id} className="flex justify-between gap-2">
                <span className="min-w-0 truncate">
                  {l.name}
                  {l.business_type && <span className="text-muted"> · {l.business_type}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted">{leadStatusLabel(l)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function LeadCard({ lead, today, onChange, onDeal, onError }: { lead: Lead; today: string; onChange: () => void; onDeal: () => void; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [dealForm, setDealForm] = useState(false);
  const [value, setValue] = useState("");
  const [next, setNext] = useState("");
  const due = dueLabel(dueOf(lead), today);
  const tel = telUrl(lead.phone);
  const wa = whatsappUrl(lead.phone);

  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      await lifeApi(`/leads/${lead.id}`, { method: "PATCH", body });
      onChange();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await lifeApi(`/leads/${lead.id}/deal`, { method: "POST", body: { value: value ? Number(value) : null, next_action: next || null } });
      onDeal();
    } catch (err) {
      onError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`rounded-xl border bg-white/[0.03] ${dueOf(lead) <= today ? "border-amber-400/30" : "border-border-soft"}`}>
      <div className="flex items-start gap-2 px-3 py-2.5">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="min-w-0 flex-1 text-start">
          <span className="block">
            <span className="font-semibold">{lead.name}</span>
            {lead.business_type && <span className="text-sm text-muted"> · {lead.business_type}</span>}
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            <span className={`font-semibold ${due.tone}`}>{due.text}</span>
            {" · "}
            {lead.status === "contacted" ? "יצרתי קשר" : lead.status === "qualified" ? "מתאים" : "חדש"}
            {" · "}
            {lead.source === "manual" ? "הוספתי" : "מהאתר"} {ago(lead.created_at)}
          </span>
          {lead.pain && <span className="mt-1 line-clamp-2 block text-xs text-foreground/80">״{lead.pain}״</span>}
        </button>
        {tel && (
          <a href={tel} aria-label={`חיוג ל${lead.name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <Phone className="h-4 w-4" />
          </a>
        )}
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" aria-label={`וואטסאפ ל${lead.name}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/20 text-[#7ee2a4]">
            <MessageCircle className="h-4 w-4" />
          </a>
        )}
        <button type="button" onClick={() => setOpen(!open)} aria-label="פרטים" className="flex h-9 w-6 shrink-0 items-center justify-center text-muted">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="grid gap-2.5 border-t border-border-soft p-3 text-sm">
          {lead.phone && (
            <p className="text-xs text-muted">
              טלפון: <bdi className="font-latin text-foreground">{lead.phone}</bdi>
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {lead.status === "new" && (
              <button
                type="button"
                disabled={busy}
                // Contacted: back in two days if nothing moves.
                onClick={() => patch({ status: "contacted", follow_up_date: addDays(today, 2) })}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
              >
                ✓ יצרתי קשר
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => patch({ follow_up_date: addDays(today, 1) })} className="rounded-full bg-white/5 px-3 py-1.5 text-xs disabled:opacity-60">
              למחר
            </button>
            <label className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs">
              תאריך
              <input
                type="date"
                value={dueOf(lead)}
                min={today}
                onChange={(e) => e.target.value && patch({ follow_up_date: e.target.value })}
                className="font-latin bg-transparent text-xs outline-none"
                aria-label="מתי לחזור"
              />
            </label>
            <button type="button" disabled={busy} onClick={() => patch({ status: "lost" })} className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-muted disabled:opacity-60">
              לא רלוונטי
            </button>
          </div>

          <label className="flex flex-col gap-1 text-xs text-muted">
            הערות
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (lead.notes ?? "") && patch({ notes: notes || null })}
              rows={2}
              placeholder="מה דיברנו, מה הוא צריך"
              className="resize-none rounded-lg bg-white/5 px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted/60"
            />
          </label>

          {dealForm ? (
            <form onSubmit={toDeal} className="grid gap-2 rounded-xl border border-gold/30 bg-gold/[0.06] p-3">
              <p className="text-xs font-semibold text-gold-2">פתיחת עסקה (שלב: שיחת היכרות)</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="שווי משוער ₪"
                  aria-label="שווי משוער לעסקה"
                  className="w-32 rounded-lg bg-white/5 px-2 py-2 text-sm outline-none placeholder:text-muted/60"
                />
                <input
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  placeholder="הצעד הבא"
                  aria-label="הצעד הבא בעסקה"
                  className="min-w-0 flex-1 rounded-lg bg-white/5 px-2 py-2 text-sm outline-none placeholder:text-muted/60"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="flex-1 rounded-lg bg-gold py-2 text-sm font-bold text-[#1d1407] disabled:opacity-60">
                  {busy ? "פותח…" : "פתיחת עסקה"}
                </button>
                <button type="button" onClick={() => setDealForm(false)} className="rounded-lg bg-white/5 px-3 text-sm text-muted">
                  ביטול
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setDealForm(true)} className="flex items-center justify-center gap-2 rounded-lg border border-gold/40 py-2 text-sm font-semibold text-gold-2">
              <BadgeDollarSign className="h-4 w-4" /> יש כאן עסקה
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AddLead({ onAdded, onError }: { onAdded: () => void; onError: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [business, setBusiness] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await lifeApi("/leads", { method: "POST", body: { name, phone: phone || null, business_type: business || null } });
      setName("");
      setPhone("");
      setBusiness("");
      setOpen(false);
      onAdded();
    } catch (err) {
      onError((err as Error).message);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-soft py-2.5 text-sm text-muted">
        <Plus className="h-4 w-4" /> הוספת ליד (המלצה, שיחה נכנסת)
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-2 rounded-2xl border border-border-soft bg-surface p-3">
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם"
          aria-label="שם הליד"
          autoFocus
          className="min-w-0 flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          placeholder="טלפון"
          aria-label="טלפון של הליד"
          className="font-latin w-32 rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70"
        />
      </div>
      <input
        value={business}
        onChange={(e) => setBusiness(e.target.value)}
        placeholder="מה העסק שלו, מי המליץ"
        aria-label="תחום הליד"
        className="rounded-lg bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70"
      />
      <div className="flex gap-2">
        <button type="submit" className="flex-1 rounded-lg bg-gold py-2 text-sm font-bold text-[#1d1407]">
          הוספה
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-white/5 px-3 text-sm text-muted">
          ביטול
        </button>
      </div>
    </form>
  );
}
