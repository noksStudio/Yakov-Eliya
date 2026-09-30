import type { LifeStore } from "./store";
import type { OpsStore } from "./ops-store";
import { calendarRange, type CalItem, type CalItemKind } from "./calendar";
import { derive } from "./telegram";
import { addDays, israelToday, TIME_ZONE, toMinutes } from "./time";

// The schedule as an iCalendar feed, so the iPhone (or Google) calendar can subscribe to it and
// show events, commitments, family dates and reminders next to everything else. The URL carries
// a token derived from ADMIN_SESSION_SECRET; resetting it (a new version) cuts off old links.

export const ICS_KINDS: { kind: CalItemKind; label: string; default: boolean }[] = [
  { kind: "event", label: "אירועים", default: true },
  { kind: "recurring", label: "קבועים שבועיים", default: true },
  { kind: "occasion", label: "ימי הולדת ותאריכים", default: true },
  { kind: "reminder", label: "תזכורות", default: true },
  { kind: "task", label: "משימות עם שעה", default: true },
  { kind: "followup", label: "פולואפים ללקוחות", default: false },
  { kind: "workout", label: "אימונים", default: false },
  { kind: "learning", label: "לימוד", default: false },
];
export const DEFAULT_ICS_KINDS = ICS_KINDS.filter((k) => k.default).map((k) => k.kind);

type CalendarDoc = { version: number };

export async function calendarToken(store: LifeStore) {
  const doc = await store.getDoc<CalendarDoc>("calendar");
  return derive(`life-calendar:${doc?.version ?? 0}`);
}

export async function rotateCalendarToken(store: LifeStore) {
  const doc = await store.getDoc<CalendarDoc>("calendar");
  await store.saveDoc<CalendarDoc>("calendar", { version: (doc?.version ?? 0) + 1 });
  return calendarToken(store);
}

export function parseKinds(raw: string | null): CalItemKind[] {
  if (!raw) return DEFAULT_ICS_KINDS;
  const known = new Set(ICS_KINDS.map((k) => k.kind));
  const kinds = raw.split(",").filter((k): k is CalItemKind => known.has(k as CalItemKind));
  return kinds.length ? kinds : DEFAULT_ICS_KINDS;
}

// Israel wall-clock time → UTC, correct across daylight-saving changes.
const offsetFormat = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
function zoneOffset(utcMs: number) {
  const p = Object.fromEntries(offsetFormat.formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  return Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute)) - utcMs;
}
export function israelToUtc(date: string, time: string) {
  const wall = Date.parse(`${date}T${time}:00Z`);
  let utc = wall - zoneOffset(wall);
  utc = wall - zoneOffset(utc);
  return new Date(utc);
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const dateValue = (date: string) => date.replace(/-/g, "");
const escapeText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** RFC 5545 folds lines longer than 75 octets; Hebrew is 2 bytes a letter, so fold by bytes. */
function fold(line: string) {
  const bytes = new TextEncoder();
  if (bytes.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    const limit = out.length ? 74 : 75;
    if (bytes.encode(current + ch).length > limit) {
      out.push(current);
      current = ch;
    } else current += ch;
  }
  out.push(current);
  return out.join("\r\n ");
}

// Length when an item has a start but no end.
const DEFAULT_MINUTES: Partial<Record<CalItemKind, number>> = { event: 60, task: 30, reminder: 15, recurring: 60, workout: 45, learning: 30 };

function titleOf(item: CalItem) {
  if (item.kind === "reminder") return `⏰ ${item.title}`;
  if (item.kind === "task") return `${item.done ? "✓" : "☐"} ${item.title}`;
  if (item.kind === "occasion") return `🎉 ${item.title}`;
  return item.title;
}

function eventLines(item: CalItem, date: string, now: Date, origin: string) {
  const lines = ["BEGIN:VEVENT", `UID:${item.key}@yakov-life`, `DTSTAMP:${stamp(now)}`];
  if (item.time) {
    const start = israelToUtc(date, item.time);
    const endMinutes = item.end && toMinutes(item.end) > toMinutes(item.time) ? toMinutes(item.end) - toMinutes(item.time) : (DEFAULT_MINUTES[item.kind] ?? 30);
    lines.push(`DTSTART:${stamp(start)}`, `DTEND:${stamp(new Date(start.getTime() + endMinutes * 60000))}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${dateValue(date)}`, `DTEND;VALUE=DATE:${dateValue(addDays(date, 1))}`, "TRANSP:TRANSPARENT");
  }
  lines.push(`SUMMARY:${escapeText(titleOf(item))}`);
  if (item.note) lines.push(`DESCRIPTION:${escapeText(item.note)}`);
  lines.push(`URL:${origin}/life?v=week&date=${date}`);
  // Reminders ring at their time; events ring half an hour before.
  if (item.kind === "reminder" && item.time && !item.done) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(item.title)}`, "TRIGGER:PT0M", "END:VALARM");
  if (item.kind === "event" && item.time) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(item.title)}`, "TRIGGER:-PT30M", "END:VALARM");
  lines.push("END:VEVENT");
  return lines;
}

/** Last month through the next half year, in chunks the range builder accepts. */
export async function buildIcs(store: LifeStore, ops: OpsStore, kinds: CalItemKind[], origin: string, now = new Date()) {
  const today = israelToday(now);
  const wanted = new Set(kinds);
  const from = addDays(today, -30);
  const until = addDays(today, 182);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Yakov Life//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:היום שלי",
    `X-WR-TIMEZONE:${TIME_ZONE}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (let start = from; start <= until; start = addDays(start, 42)) {
    const end = addDays(start, 41) < until ? addDays(start, 41) : until;
    const range = await calendarRange(store, ops, start, end, today);
    for (const day of range.days) {
      for (const item of day.items) {
        if (!wanted.has(item.kind)) continue;
        // Only tasks with a set time: an undated to-do list would fill the calendar with all-day rows.
        if (item.kind === "task" && !item.time) continue;
        lines.push(...eventLines(item, day.date, now, origin));
      }
    }
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
