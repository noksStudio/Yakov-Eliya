import type { LifeStore } from "./store";
import type { ContextLesson, Lesson } from "./growth-types";
import { getLessonsStore } from "./lessons";
import { loadRecurring, recurringFor } from "./recurring";
import { loadReminders } from "./reminders";
import { normalize } from "./search-index";
import { addDays } from "./time";

// Contextual lessons: a lesson with triggers ("טיול", "פארק") comes up only when today's or
// tomorrow's schedule mentions one of them, so the trip checklist appears before a trip and the
// evening before, and never on an ordinary work day.

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Whether `text` mentions `trigger` as a word, allowing Hebrew prefixes (ה, ב, ל, ו, מ, כ, ש: "לטיול",
 * "בפארק") and plural endings ("טיולים"), but not inside other words ("ים" does not match "חיים").
 */
export function mentions(text: string, trigger: string) {
  const t = normalize(trigger);
  if (!t) return false;
  const re = new RegExp(`(^| )[והבלמכש]{0,2}${escape(t)}(ימ|ות)?( |$)`);
  return re.test(` ${normalize(text)} `);
}

/** Titles of everything on the schedule for a date: events, weekly commitments, dated tasks, reminders. */
async function scheduleTexts(store: LifeStore, date: string) {
  const [events, tasks, recurring, reminders] = await Promise.all([
    store.listEvents(date),
    store.listTasks(),
    loadRecurring(store),
    loadReminders(store),
  ]);
  return [
    ...events.map((e) => e.title),
    ...tasks.filter((t) => t.due_date === date && !t.done).map((t) => t.title),
    ...recurringFor(recurring, date).map((r) => r.title),
    ...reminders.filter((r) => r.date === date && !r.sent).map((r) => r.text),
  ];
}

export function matchLessons(lessons: Lesson[], texts: string[], when: ContextLesson["when"]): ContextLesson[] {
  const out: ContextLesson[] = [];
  for (const lesson of lessons) {
    if (lesson.archived || !lesson.triggers?.length) continue;
    for (const text of texts) {
      const trigger = lesson.triggers.find((t) => mentions(text, t));
      if (trigger) {
        out.push({ lesson, when, match: text, trigger });
        break;
      }
    }
  }
  return out;
}

/** Contextual lessons for today and tomorrow; a lesson matching both days is listed once, for today. */
export async function contextLessons(store: LifeStore, date: string): Promise<ContextLesson[]> {
  const lessons = (await getLessonsStore().list()).filter((l) => l.triggers?.length);
  if (!lessons.length) return [];
  const [today, tomorrow] = await Promise.all([scheduleTexts(store, date), scheduleTexts(store, addDays(date, 1))]);
  const forToday = matchLessons(lessons, today, "today");
  const seen = new Set(forToday.map((c) => c.lesson.id));
  return [...forToday, ...matchLessons(lessons, tomorrow, "tomorrow").filter((c) => !seen.has(c.lesson.id))];
}
