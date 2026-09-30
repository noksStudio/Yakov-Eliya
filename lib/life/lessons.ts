import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { lessonPatchSchema, newLessonSchema, type Lesson } from "./growth-types";
import type { Area } from "./types";
import { addDays, israelToday } from "./time";

// Lessons (his own mistakes and other people's) come back on a widening schedule, so the ones that
// matter are seen again before they are forgotten: 2 days, a week, two weeks, a month, and so on.

const INTERVALS = [2, 7, 14, 30, 60, 120];

export interface LessonsStore {
  list(includeArchived?: boolean): Promise<Lesson[]>;
  add(input: unknown): Promise<Lesson>;
  update(id: string, patch: unknown): Promise<Lesson | null>;
  remove(id: string): Promise<boolean>;
}

function fresh(input: unknown, today = israelToday()) {
  const parsed = newLessonSchema.parse(input);
  return {
    rule: parsed.rule,
    story: parsed.story ?? null,
    source: parsed.source,
    source_name: parsed.source_name ?? null,
    area: parsed.area ?? "general",
    reviews: 0,
    // First comes back tomorrow morning.
    next_review: addDays(today, 1),
    last_shown: null,
    archived: false,
  };
}

function supabaseLessons(): LessonsStore {
  const db = getSupabaseAdmin();
  const check = <T>({ data, error }: { data: T; error: { message: string } | null }) => {
    if (error) throw new Error(error.message);
    return data;
  };
  return {
    async list(includeArchived = false) {
      let query = db.from("life_lessons").select("*").order("created_at", { ascending: false });
      if (!includeArchived) query = query.eq("archived", false);
      return check(await query) as Lesson[];
    },
    async add(input) {
      return check(await db.from("life_lessons").insert(fresh(input)).select("*").single()) as Lesson;
    },
    async update(id, patch) {
      const row = lessonPatchSchema.parse(patch);
      return check(await db.from("life_lessons").update(row).eq("id", id).select("*").maybeSingle()) as Lesson | null;
    },
    async remove(id) {
      return (check(await db.from("life_lessons").delete().eq("id", id).select("id")) ?? []).length > 0;
    },
  };
}

const globalForLessons = globalThis as unknown as { __lifeLessons?: Lesson[] };

function memoryLessons(): LessonsStore {
  const lessons = (globalForLessons.__lifeLessons ??= []);
  return {
    async list(includeArchived = false) {
      return lessons
        .filter((l) => includeArchived || !l.archived)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((l) => ({ ...l }));
    },
    async add(input) {
      const lesson: Lesson = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...fresh(input) };
      lessons.push(lesson);
      return { ...lesson };
    },
    async update(id, patch) {
      const lesson = lessons.find((l) => l.id === id);
      if (!lesson) return null;
      Object.assign(lesson, lessonPatchSchema.parse(patch));
      return { ...lesson };
    },
    async remove(id) {
      const i = lessons.findIndex((l) => l.id === id);
      if (i === -1) return false;
      lessons.splice(i, 1);
      return true;
    },
  };
}

export function getLessonsStore(): LessonsStore {
  return isSupabaseConfigured() ? supabaseLessons() : memoryLessons();
}

/** The lesson to show today: due ones first, those matching today's areas before the rest. */
export function pickLesson(lessons: Lesson[], today: string, areas: Area[] = []): Lesson | null {
  const due = lessons.filter((l) => !l.archived && l.next_review <= today);
  if (!due.length) return null;
  return due.sort(
    (a, b) =>
      Number(areas.includes(b.area)) - Number(areas.includes(a.area)) ||
      a.next_review.localeCompare(b.next_review) ||
      a.created_at.localeCompare(b.created_at),
  )[0];
}

type Schedule = Pick<Lesson, "reviews" | "next_review"> & { last_shown?: string };

// Scheduling fields are not user-editable (outside lessonPatchSchema), so they are written here.
async function setSchedule(id: string, fields: Schedule) {
  if (isSupabaseConfigured()) {
    const { error } = await getSupabaseAdmin().from("life_lessons").update(fields).eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  const found = (globalForLessons.__lifeLessons ?? []).find((l) => l.id === id);
  if (found) Object.assign(found, fields);
}

/** Records that a lesson was shown and schedules the next time, further out each round. */
export async function markLessonShown(lesson: Lesson, today = israelToday()) {
  const interval = INTERVALS[Math.min(lesson.reviews, INTERVALS.length - 1)];
  await setSchedule(lesson.id, { reviews: lesson.reviews + 1, last_shown: today, next_review: addDays(today, interval) });
}

/** "Not learnt yet": starts the schedule again from tomorrow. */
export async function requeueLesson(id: string, today = israelToday()) {
  await setSchedule(id, { reviews: 0, next_review: addDays(today, 1) });
}
