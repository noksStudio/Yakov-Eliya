import type { LifeStore } from "./store";
import type { OpsStore } from "./ops-store";
import type { ShoppingCategory } from "./body-types";
import { loadBodyPlan } from "./body";
import { financeSummary } from "./finance";
import { getIdeasStore } from "./ideas";
import { firstFollowUp, getLeadsStore, PHONE_RE } from "./leads";
import { getLessonsStore } from "./lessons";
import { EXPENSE_CATEGORIES, financeEntrySchema } from "./ops-types";
import { addReminder, parseWhen } from "./reminders";
import { addDays, israelToday } from "./time";

// Quick capture: one line of Hebrew becomes the right thing. Shared by the "+" button in the app
// and by Telegram, so both understand the same phrases:
//   לקח: …  (#טיול makes it contextual)   רעיון: …   תזכיר לי מחר ב־10:00 …   תזכורת: …
//   הכנסה 1500 לקוח   הוצאה 300 שיווק   משקל 84.6   עשיתי אימון   קניות: חלב, ביצים
//   ליד: דני 050-1234567 מסעדה
// Anything else becomes a task (dated if the line says when), or, in Telegram, goes to the chief.

export type CaptureKind = "lesson" | "idea" | "reminder" | "lead" | "income" | "expense" | "weight" | "workout" | "shopping" | "task";
export type CaptureResult = { kind: CaptureKind; message: string; href: string } | { error: string };

const KIND_LABEL: Record<CaptureKind, string> = {
  lesson: "לקח",
  idea: "רעיון",
  reminder: "תזכורת",
  lead: "ליד",
  income: "הכנסה",
  expense: "הוצאה",
  weight: "שקילה",
  workout: "אימון",
  shopping: "קניות",
  task: "משימה",
};
export const captureKindLabel = (k: CaptureKind) => KIND_LABEL[k];

const ils = (n: number) => `${Math.round(n).toLocaleString("he-IL")} ₪`;

function whenLabel(date: string, today: string) {
  if (date === today) return "היום";
  if (date === addDays(today, 1)) return "מחר";
  const weekday = new Intl.DateTimeFormat("he-IL", { weekday: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  return `ב${weekday} ${Number(date.slice(8, 10))}.${Number(date.slice(5, 7))}`;
}

// Rough aisle for a shopping item; "שונות" when unsure.
const AISLES: [RegExp, ShoppingCategory][] = [
  [/חלב|ביצ|גבינ|קוטג|יוגורט|שמנת|חמאה|לבן/, "חלבי וביצים"],
  [/עוף|בשר|הודו|דג|טונה|סלמון|קבב|שניצל/, "בשר ודגים"],
  [/לחם|פית|אורז|פסטה|קוסקוס|שיבולת|קמח|תפוחי אדמה|בטטה/, "פחמימות"],
  [/עגבני|מלפפונ|חס|בצל|גזר|פלפל|קישוא|ברוקולי|כרוב|ירק|שום|תרד/, "ירקות"],
  [/תפוח|בננ|תפוז|ענב|אבטיח|מלון|פרי|פירות|אגס|תמר/, "פירות"],
  [/שמן|סוכר|מלח|קפה|תה|תבלין|טחינה|רוטב|שימור|דבש|אגוז|שקדים/, "מזווה"],
];
const aisleOf = (item: string): ShoppingCategory => AISLES.find(([re]) => re.test(item))?.[1] ?? "שונות";

const num = (raw: string) => Number(raw.replace(/,/g, ""));

const trimPunct = (s: string) => s.replace(/^[\s,،\-–:]+|[\s,،\-–:]+$/g, "");

/** "דני 050-1234567 מסעדה", "דני, מסעדה", "050-1234567 דני מסעדה": name, phone, what he does. */
export function parseLead(input: string) {
  const text = input.trim();
  const phone = text.match(PHONE_RE)?.[0] ?? null;
  // Without a phone, a comma separates the name from the rest; with one, the phone does.
  const [first, second = ""] = phone ? text.split(phone).map(trimPunct) : [text, ""];
  let name = first;
  let rest = second;
  if (!name && rest) [name, rest] = splitFirst(rest);
  else if (!phone) [name, rest] = splitFirst(name);
  return { name: name.slice(0, 80), phone, rest: rest.slice(0, 120) };
}
function splitFirst(text: string): [string, string] {
  const [head, ...tail] = text.split(/[,،]/);
  return [trimPunct(head), trimPunct(tail.join(","))];
}

type Rule = { re: RegExp; run: (m: RegExpMatchArray, ctx: Ctx) => Promise<CaptureResult> };
type Ctx = { store: LifeStore; ops: OpsStore; today: string };

const RULES: Rule[] = [
  {
    re: /^לקח\s*[:\-־]\s*([\s\S]+)$/,
    run: async (m) => {
      const raw = m[1];
      const triggers = [...raw.matchAll(/#([^\s#]{2,40})/g)].map((x) => x[1].replace(/_/g, " "));
      const [rule, ...story] = raw.replace(/#[^\s#]{2,40}/g, "").replace(/[ \t]+\n/g, "\n").trim().split("\n");
      if (!rule || rule.trim().length < 3) return { error: "כתוב את הלקח, למשל: ״לקח: לא שולחים הצעת מחיר בלי שיחת אבחון״" };
      const lesson = await getLessonsStore().add({ rule: rule.trim(), story: story.join("\n").trim() || null, triggers });
      return {
        kind: "lesson",
        message: triggers.length ? `נשמר לקח. יופיע רק כשבלו״ז יש: ${triggers.join(", ")}.` : `נשמר לקח: ״${lesson.rule}״. יחזור אליך בהודעת הבוקר.`,
        href: "/life/growth?tab=lessons",
      };
    },
  },
  {
    re: /^רעיון\s*[:\-־]\s*([\s\S]+)$/,
    run: async (m) => {
      const [title, ...rest] = m[1].trim().split("\n");
      const idea = await getIdeasStore().add({ title: title.slice(0, 200), notes: rest.join("\n").trim() });
      return { kind: "idea", message: `נשמר ברעיונות: ״${idea.title}״`, href: `/life/ideas/${idea.id}` };
    },
  },
  {
    re: /^(?:תזכורת\s*[:\-־]|תזכירי? לי(?=\s|$))\s*([\s\S]+)$/,
    run: async (m, { store, today }) => {
      const parsed = parseWhen(m[1]);
      if ("error" in parsed) return parsed;
      await addReminder(store, { date: parsed.date, time: parsed.time, text: parsed.text });
      return { kind: "reminder", message: `אזכיר לך ${whenLabel(parsed.date, today)} ב־${parsed.time}: ${parsed.text}`, href: `/life?v=week&date=${parsed.date}` };
    },
  },
  {
    re: /^ליד\s*[:\-־]\s*([\s\S]+)$/,
    run: async (m, { store, today }) => {
      const { name, phone, rest } = parseLead(m[1]);
      if (!name) return { error: "כתוב שם, למשל: ״ליד: דני 050-1234567 מסעדה״" };
      const settings = await store.getSettings();
      const follow = firstFollowUp(new Date(), { cholHamoedOff: settings.chol_hamoed_off });
      await getLeadsStore().add({ name, phone, business_type: rest || null, follow_up_date: follow, source: "manual" });
      return {
        kind: "lead",
        message: `נוסף ליד: ${[name, rest].filter(Boolean).join(" · ")}${phone ? "" : " (בלי טלפון)"}. לחזור ${whenLabel(follow, today)}.`,
        href: "/life/business",
      };
    },
  },
  {
    re: /^(?:הכנסה|נכנס|נכנסו|קיבלתי)\s+(\d[\d,]*(?:\.\d+)?)\s*(?:₪|שח|ש״ח|שקל(?:ים)?)?\s*(.*)$/,
    run: async (m, { store, ops, today }) => {
      const amount = num(m[1]);
      if (!(amount > 0)) return { error: "סכום לא תקין." };
      await ops.addFinance(financeEntrySchema.parse({ date: today, kind: "income", amount, category: "מכירה", note: m[2].trim() || null }));
      const f = await financeSummary(store, ops, today);
      return { kind: "income", message: `נרשמה הכנסה של ${ils(amount)}. רווח החודש: ${ils(f.profit)} מתוך ${ils(f.goal.monthly_goal)}.`, href: "/life/finance" };
    },
  },
  {
    re: /^(?:הוצאה|הוצאתי|שילמתי)\s+(\d[\d,]*(?:\.\d+)?)\s*(?:₪|שח|ש״ח|שקל(?:ים)?)?\s*(.*)$/,
    run: async (m, { store, ops, today }) => {
      const amount = num(m[1]);
      if (!(amount > 0)) return { error: "סכום לא תקין." };
      const words = m[2].trim();
      const category = EXPENSE_CATEGORIES.find((c) => words.startsWith(c)) ?? "אחר";
      const note = (category !== "אחר" ? words.slice(category.length) : words).trim() || null;
      await ops.addFinance(financeEntrySchema.parse({ date: today, kind: "expense", amount, category, note }));
      const f = await financeSummary(store, ops, today);
      return { kind: "expense", message: `נרשמה הוצאה של ${ils(amount)} (${category}). רווח החודש: ${ils(f.profit)}.`, href: "/life/finance" };
    },
  },
  {
    re: /^(?:משקל|שקילה|שקלתי)\s*[:\-־]?\s*(\d{2,3}(?:[.,]\d)?)\s*(?:ק״ג|קג|קילו)?\s*$/,
    run: async (m, { store, today }) => {
      const weight = Number(m[1].replace(",", "."));
      if (!(weight >= 30 && weight <= 300)) return { error: "משקל לא תקין." };
      await store.saveCheckin(today, { weight: Math.round(weight * 10) / 10 });
      const plan = await loadBodyPlan(store);
      const change = Math.round((weight - plan.profile.start_weight) * 10) / 10;
      const trend = change < 0 ? `ירדת ${-change} ק״ג מההתחלה` : change > 0 ? `${change} ק״ג מעל ההתחלה` : "כמו בהתחלה";
      return { kind: "weight", message: `נרשם ${weight} ק״ג. ${trend}.`, href: "/life/body" };
    },
  },
  {
    re: /^(?:עשיתי אימון|אימון בוצע|התאמנתי|סיימתי אימון)\s*[.!]?$/,
    run: async (_m, { store, today }) => {
      await store.saveCheckin(today, { workout: true });
      return { kind: "workout", message: "האימון נרשם. כל הכבוד!", href: "/life/body" };
    },
  },
  {
    re: /^(?:קניות\s*[:\-־]|לקנות\s+|להוסיף לקניות\s*[:\-־]?)\s*(.+)$/,
    run: async (m, { store }) => {
      const titles = m[1]
        .split(/[,،\n]|\s+ו(?=\S)/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2)
        .slice(0, 30);
      if (!titles.length) return { error: "מה לקנות? למשל: ״קניות: חלב, ביצים, עגבניות״" };
      const added = await store.addShopping(titles.map((title) => ({ title: title.slice(0, 120), category: aisleOf(title) })));
      const skipped = titles.length - added.length;
      return {
        kind: "shopping",
        message: `נוסף לרשימת הקניות: ${added.map((a) => a.title).join(", ") || "כלום"}${skipped ? ` (${skipped} כבר ברשימה)` : ""}.`,
        href: "/life/shopping",
      };
    },
  },
];

/**
 * Turns one line into the right record. `fallbackTask`: anything unrecognised becomes a task
 * (the app); without it, unrecognised text returns null (Telegram passes it to the chief).
 */
export async function capture(store: LifeStore, ops: OpsStore, input: string, fallbackTask = true): Promise<CaptureResult | null> {
  const text = input.trim();
  if (!text) return { error: "כתוב משהו." };
  const ctx: Ctx = { store, ops, today: israelToday() };
  for (const rule of RULES) {
    const m = text.match(rule.re);
    if (m) return rule.run(m, ctx);
  }
  if (!fallbackTask) return null;

  // A task; "משימה:" is optional, and a date or time in the line schedules it.
  const body = text.replace(/^משימה\s*[:\-־]\s*/, "");
  const when = parseWhen(body, new Date(), { forTask: true });
  const scheduled = "error" in when ? null : when;
  const title = (scheduled?.text ?? body).slice(0, 200);
  await store.addTask({
    title,
    due_date: scheduled?.date ?? null,
    scheduled_time: scheduled?.explicitTime ? scheduled.time : null,
  });
  return {
    kind: "task",
    message: scheduled
      ? `נוספה משימה ל${whenLabel(scheduled.date, ctx.today).replace(/^ב/, "")}${scheduled.explicitTime ? ` ב־${scheduled.time}` : ""}: ${title}`
      : `נוספה משימה: ${title}`,
    href: scheduled ? `/life?v=week&date=${scheduled.date}` : "/life",
  };
}
