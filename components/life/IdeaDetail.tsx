"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ListPlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { IDEA_STATUSES, IDEA_STATUS_LABELS, type Idea, type IdeaPatch, type IdeaStep } from "@/lib/life/idea-types";
import { AREA_LABELS, AREAS, type Area } from "@/lib/life/types";
import { lifeApi } from "./api";
import { STATUS_STYLE } from "./IdeasView";

type SaveState = "idle" | "saving" | "saved" | "error";

export function IdeaDetail({ id }: { id: string }) {
  const router = useRouter();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [note, setNote] = useState<string | null>(null);
  const [newStep, setNewStep] = useState("");
  const pending = useRef<IdeaPatch>({});
  const timer = useRef<number | null>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    lifeApi<{ idea: Idea }>(`/ideas/${id}`)
      .then((d) => setIdea(d.idea))
      .catch((e) => setError((e as Error).message));
  }, [id]);

  // Notes grow with their content instead of scrolling inside a small box.
  useEffect(() => {
    const el = notesRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [idea?.notes]);

  const flush = useCallback(async () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    const patch = pending.current;
    pending.current = {};
    if (!Object.keys(patch).length) return;
    try {
      await lifeApi(`/ideas/${id}`, { method: "PATCH", body: patch });
      setSave("saved");
    } catch (e) {
      setError((e as Error).message);
      setSave("error");
    }
  }, [id]);

  // Whatever is still pending goes out when leaving the screen.
  useEffect(() => () => void flush(), [flush]);

  /** Updates the screen at once and saves shortly after (text) or right away (choices, steps). */
  const change = (patch: IdeaPatch, immediate = false) => {
    setIdea((current) => (current ? { ...current, ...patch } : current));
    setError(null);
    const { title, ...rest } = patch;
    // An empty title stays on screen but is not saved until it has text again.
    pending.current = { ...pending.current, ...rest, ...(title !== undefined && title.trim() ? { title } : {}) };
    setSave("saving");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), immediate ? 0 : 700);
  };

  if (!idea) {
    return error ? (
      <p className="mt-10 rounded-xl bg-red-500/10 p-4 text-sm text-red-300">{error}</p>
    ) : (
      <div className="flex min-h-[60svh] items-center justify-center text-muted" role="status">
        <Loader2 className="h-6 w-6 animate-spin" aria-label="טוען" />
      </div>
    );
  }

  const setSteps = (steps: IdeaStep[]) => change({ steps }, true);

  const addStep = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newStep.trim();
    if (!text) return;
    setSteps([...idea.steps, { id: crypto.randomUUID(), text, done: false }]);
    setNewStep("");
  };

  const toTask = async (stepId?: string) => {
    await flush();
    try {
      const d = await lifeApi<{ idea: Idea }>(`/ideas/${id}/task`, { method: "POST", body: stepId ? { step_id: stepId } : {} });
      setIdea(d.idea);
      setNote(stepId ? "הצעד נוסף למשימות." : "הרעיון נוסף למשימות.");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const remove = async () => {
    if (!window.confirm(`למחוק את "${idea.title}"?`)) return;
    pending.current = {};
    try {
      await lifeApi(`/ideas/${id}`, { method: "DELETE" });
      router.push("/life/ideas");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const doneCount = idea.steps.filter((s) => s.done).length;
  const field = "rounded-xl bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted/70";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Link href="/life/ideas" onClick={() => void flush()} className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ChevronRight className="h-4 w-4" /> כל הרעיונות
        </Link>
        <span className="text-xs text-muted" role="status" aria-live="polite">
          {save === "saving" ? "שומר…" : save === "saved" ? "נשמר ✓" : save === "error" ? "לא נשמר" : ""}
        </span>
      </div>

      <input
        value={idea.title}
        onChange={(e) => change({ title: e.target.value })}
        aria-label="שם הרעיון"
        className="w-full bg-transparent text-2xl font-black outline-none"
      />

      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="סטטוס">
        {IDEA_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={idea.status === s}
            onClick={() => change({ status: s }, true)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${idea.status === s ? STATUS_STYLE[s] : "border-transparent bg-white/[0.03] text-muted"}`}
          >
            {IDEA_STATUS_LABELS[s]}
          </button>
        ))}
        <select
          value={idea.area}
          onChange={(e) => change({ area: e.target.value as Area }, true)}
          aria-label="תחום"
          className="ms-auto rounded-full bg-white/5 px-3 py-1.5 text-xs text-foreground outline-none"
        >
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {AREA_LABELS[a]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
      {note && <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{note}</p>}

      <section className="rounded-2xl border border-border-soft bg-surface p-4">
        <h2 className="mb-2 text-[15px] font-bold">פרטים</h2>
        <textarea
          ref={notesRef}
          value={idea.notes}
          onChange={(e) => change({ notes: e.target.value })}
          rows={6}
          placeholder={"מה הרעיון ולמי הוא מיועד?\nמה צריך לחבר (API, וואטסאפ, מערכת הנהלת חשבונות)?\nקישורים, מחירים, שאלות פתוחות…"}
          aria-label="פרטי הרעיון"
          className="min-h-[9rem] w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted/60"
        />
      </section>

      <section className="rounded-2xl border border-border-soft bg-surface p-4">
        <h2 className="mb-2 flex items-center justify-between text-[15px] font-bold">
          צעדים
          {idea.steps.length > 0 && (
            <span className="text-xs font-normal text-muted">
              <bdi dir="ltr">
                {doneCount}/{idea.steps.length}
              </bdi>
            </span>
          )}
        </h2>
        {idea.steps.length > 0 && (
          <ul className="mb-2 grid grid-cols-1 gap-1">
            {idea.steps.map((step) => (
              <li key={step.id} className="flex items-center gap-2 py-1 text-sm">
                <button
                  type="button"
                  aria-pressed={step.done}
                  aria-label={step.done ? `בטל סימון ${step.text}` : `סמן ${step.text} כבוצע`}
                  onClick={() => setSteps(idea.steps.map((s) => (s.id === step.id ? { ...s, done: !s.done } : s)))}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${step.done ? "border-gold bg-gold text-[#1d1407]" : "border-white/25"}`}
                >
                  {step.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </button>
                <span className={`min-w-0 flex-1 ${step.done ? "text-muted line-through" : ""}`}>{step.text}</span>
                {step.task_id ? (
                  <span className="shrink-0 text-[11px] text-emerald-300">במשימות</span>
                ) : (
                  !step.done && (
                    <button
                      type="button"
                      onClick={() => toTask(step.id)}
                      aria-label={`הוסף את ${step.text} למשימות`}
                      className="shrink-0 rounded-lg p-1 text-gold-2 hover:bg-white/5"
                    >
                      <ListPlus className="h-4 w-4" />
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setSteps(idea.steps.filter((s) => s.id !== step.id))}
                  aria-label={`מחק ${step.text}`}
                  className="shrink-0 rounded-lg p-1 text-muted/60 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addStep} className="flex gap-2">
          <input
            value={newStep}
            onChange={(e) => setNewStep(e.target.value)}
            placeholder="צעד, למשל: לבדוק API של וואטסאפ"
            aria-label="צעד חדש"
            className={`min-w-0 flex-1 ${field}`}
          />
          <button type="submit" aria-label="הוספת צעד" className="flex w-10 items-center justify-center rounded-xl bg-white/10">
            <Plus className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted">
          <ListPlus className="h-3.5 w-3.5" /> מעביר צעד לרשימת המשימות
        </p>
      </section>

      <div className="flex gap-2">
        <button type="button" onClick={() => toTask()} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-[#1d1407]">
          <ListPlus className="h-4 w-4" /> להפוך למשימה
        </button>
        <button type="button" onClick={remove} aria-label="מחיקת הרעיון" className="flex w-12 items-center justify-center rounded-xl bg-white/5 text-muted hover:text-red-300">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
