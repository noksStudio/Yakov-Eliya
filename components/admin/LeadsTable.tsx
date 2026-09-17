"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Save } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { tracks } from "@/lib/tracks";
import { cn } from "@/lib/utils";

const statusLabels: Record<LeadStatus, string> = {
  new: "חדש",
  contacted: "יצרנו קשר",
  qualified: "מתאים",
  customer: "לקוח",
  lost: "לא רלוונטי",
};

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [search, setSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rows, setRows] = useState(leads);

  const genders = useMemo(
    () => Array.from(new Set(rows.map((l) => l.gender).filter(Boolean))) as string[],
    [rows]
  );

  const filtered = rows.filter((lead) => {
    if (trackFilter !== "all" && lead.track_slug !== trackFilter) return false;
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (genderFilter !== "all" && lead.gender !== genderFilter) return false;
    if (search.trim()) {
      const haystack = `${lead.name ?? ""} ${lead.phone ?? ""} ${lead.business_type ?? ""}`.toLowerCase();
      if (!haystack.includes(search.trim().toLowerCase())) return false;
    }
    return true;
  });

  function updateLocal(id: string, patch: Partial<Lead>) {
    setRows((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-2xl font-bold">לידים</h1>
      <p className="mt-1 text-sm text-muted">{filtered.length} מתוך {rows.length} לידים</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, טלפון או תחום עיסוק..."
          className="min-w-56 flex-1 rounded-xl bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-primary-2/40"
        />
        <select
          value={trackFilter}
          onChange={(e) => setTrackFilter(e.target.value)}
          className="rounded-xl bg-surface px-3 py-2.5 text-sm outline-none"
        >
          <option value="all">כל התחומים</option>
          {tracks.map((t) => (
            <option key={t.slug} value={t.slug}>{t.title}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl bg-surface px-3 py-2.5 text-sm outline-none"
        >
          <option value="all">כל הסטטוסים</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="rounded-xl bg-surface px-3 py-2.5 text-sm outline-none"
        >
          <option value="all">כל המגדרים</option>
          {genders.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border-soft">
        <table className="w-full text-start text-sm">
          <thead className="bg-surface-strong text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">שם</th>
              <th className="px-4 py-3 font-medium">טלפון</th>
              <th className="px-4 py-3 font-medium">תחום עיסוק</th>
              <th className="px-4 py-3 font-medium">מסלול</th>
              <th className="px-4 py-3 font-medium">סטטוס</th>
              <th className="px-4 py-3 font-medium">נוצר</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                expanded={expandedId === lead.id}
                onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                onSaved={(patch) => updateLocal(lead.id, patch)}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  אין לידים שתואמים את הסינון
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeadRow({
  lead,
  expanded,
  onToggle,
  onSaved,
}: {
  lead: Lead;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (patch: Partial<Lead>) => void;
}) {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [gender, setGender] = useState(lead.gender ?? "");
  const [age, setAge] = useState(lead.age?.toString() ?? "");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [saving, setSaving] = useState(false);

  const track = tracks.find((t) => t.slug === lead.track_slug);

  async function save() {
    setSaving(true);
    const patch = {
      status,
      gender: gender || null,
      age: age ? Number(age) : null,
      notes: notes || null,
    };
    const res = await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) onSaved(patch);
    setSaving(false);
  }

  return (
    <>
      <tr className="border-t border-border-soft">
        <td className="px-4 py-3 font-medium">{lead.name ?? "—"}</td>
        <td className="px-4 py-3">
          <a href={`tel:${lead.phone}`} className="text-primary-2 hover:underline">
            {lead.phone ?? "—"}
          </a>
        </td>
        <td className="max-w-48 truncate px-4 py-3 text-muted">{lead.business_type ?? "—"}</td>
        <td className="px-4 py-3 text-muted">{track?.title ?? "—"}</td>
        <td className="px-4 py-3">
          <span className="rounded-full bg-surface-strong px-2.5 py-1 text-xs">
            {statusLabels[lead.status]}
          </span>
        </td>
        <td className="px-4 py-3 text-muted">
          {new Date(lead.created_at).toLocaleDateString("he-IL")}
        </td>
        <td className="px-4 py-3">
          <button onClick={onToggle} aria-label="פרטים נוספים">
            <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-t border-border-soft bg-surface/40">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <label className="flex flex-col gap-1 text-xs text-muted">
                סטטוס
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LeadStatus)}
                  className="rounded-lg bg-surface px-2 py-2 text-sm text-foreground"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                מגדר
                <input
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  placeholder="זכר / נקבה / אחר"
                  className="rounded-lg bg-surface px-2 py-2 text-sm text-foreground outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted">
                גיל
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value.replace(/\D/g, ""))}
                  placeholder="גיל"
                  className="rounded-lg bg-surface px-2 py-2 text-sm text-foreground outline-none"
                />
              </label>
              <div className="flex items-end">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-2))] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "שומר..." : "שמירה"}
                </button>
              </div>
            </div>
            <label className="mt-3 flex flex-col gap-1 text-xs text-muted">
              סיכום שיחת מכירה / הערות
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="מה סוכם בשיחה, מה השלב הבא..."
                className="rounded-lg bg-surface px-3 py-2 text-sm text-foreground outline-none"
              />
            </label>
            {lead.pain && (
              <p className="mt-3 text-xs text-muted">
                <span className="font-semibold text-foreground">הקושי שדווח בצ&apos;אט: </span>
                {lead.pain}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
