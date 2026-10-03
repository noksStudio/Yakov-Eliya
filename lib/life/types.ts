import type { BodyToday } from "./body";
import type { LearningToday } from "./learning";
import type { ContextLesson } from "./growth-types";

export const AREAS = ["business", "body", "spirit", "mind", "couple", "finance", "home", "general"] as const;
export type Area = (typeof AREAS)[number];

export const AREA_LABELS: Record<Area, string> = {
  business: "עסק",
  body: "גוף",
  spirit: "רוח",
  mind: "מנטלי",
  couple: "זוגיות",
  finance: "כספים",
  home: "בית",
  general: "כללי",
};

export type Settings = {
  wake_time: string;
  shacharit_time: string;
  mincha_time: string | null;
  arvit_time: string | null;
  deep_work_start: string;
  deep_work_end: string;
  day_close_time: string;
  hitbodedut_time: string;
  hitbodedut_minutes: number;
  screens_off_time: string;
  sleep_time: string;
  shabbat_silence: boolean;
  /** No work routine (deep work, sales targets, business nudges) on Chol HaMoed. */
  chol_hamoed_off: boolean;
  /** The day the routine starts; before it there are no nudges. */
  start_date: string | null;
};

export const DEFAULT_SETTINGS: Settings = {
  wake_time: "06:30",
  shacharit_time: "07:15",
  mincha_time: null,
  arvit_time: null,
  deep_work_start: "09:00",
  deep_work_end: "11:00",
  day_close_time: "20:45",
  hitbodedut_time: "21:15",
  hitbodedut_minutes: 60,
  screens_off_time: "22:15",
  sleep_time: "22:45",
  shabbat_silence: true,
  chol_hamoed_off: true,
  start_date: "2026-10-04",
};

export type Task = {
  id: string;
  created_at: string;
  title: string;
  area: Area;
  /** 1 = must, 2 = should, 3 = nice to have */
  priority: number;
  due_date: string | null;
  scheduled_time: string | null;
  done: boolean;
  done_at: string | null;
  source: "user" | "chief";
  /** Set on prep tasks for an event (clothes, gift, invitations). */
  event_id?: string | null;
};

export type LifeEvent = {
  id: string;
  created_at: string;
  date: string;
  start_time: string;
  end_time: string | null;
  title: string;
  area: Area;
  source: "user" | "chief";
};

export type Checkin = {
  date: string;
  sleep_hours: number | null;
  weight: number | null;
  energy: number | null;
  mood: number | null;
  shacharit: boolean;
  mincha: boolean;
  arvit: boolean;
  hitbodedut: boolean;
  workout: boolean;
  day_rating: number | null;
  note: string | null;
  updated_at: string;
};

export const AGENTS = ["chief", "body", "business", "finance", "spirit", "mind", "couple"] as const;
export type AgentId = (typeof AGENTS)[number];

export type ChatMessage = {
  id: string;
  created_at: string;
  agent: AgentId;
  role: "user" | "assistant";
  content: string;
};

export type AnchorKind = "wake" | "shacharit" | "mincha" | "arvit" | "hitbodedut" | "sleep";

export type TimelineItem = {
  key: string;
  start: string | null;
  end: string | null;
  title: string;
  note?: string;
  area: Area;
  kind: "anchor" | "routine" | "event" | "task";
  anchor?: AnchorKind;
  /** Event or task id, when the item can be removed/completed. */
  id?: string;
  /** A weekly fixed commitment (managed from the week view, not removable per day). */
  recurring?: boolean;
  done?: boolean;
};

export type DueLead = { id: string; name: string; business_type: string | null; phone: string | null; due: string };

export type RestDay = { kind: "shabbat" | "yomtov"; name: string };

export type DayView = {
  body: BodyToday;
  learning: LearningToday;
  date: string;
  weekday: string;
  gregorian: string;
  hebrewDate: string;
  restDay: RestDay | null;
  /**
   * On the last day of a rest period: when it ends (tzeit in his city), whether the week ends
   * with it, and whether the weekly review is waiting. After that time the day screen wakes up again.
   */
  restEnd: { at: string; weekEnds: boolean; review: boolean } | null;
  /** A day off work that is not Shabbat or Yom Tov (Chol HaMoed), when the setting is on. */
  dayOff: string | null;
  /** The routine's start date, while it is still ahead. */
  startsOn: string | null;
  /** Up to three focus items from this week's review. */
  weekFocus: string[];
  /** Lessons whose triggers match today's or tomorrow's schedule (the trip list before a trip). */
  contextLessons: ContextLesson[];
  /** Leads to get back to today (overdue included); empty on a day off. */
  dueLeads: DueLead[];
  /** On the eve of Shabbat or Yom Tov: candle lighting, the end, and the home checklist. */
  shabbat: { title: string; city: string; candles: string; end: string; endRabbeinuTam: string; checklist: string[] } | null;
  /** Today's one-off reminders, sent or not, by time. */
  reminders: { id: string; time: string; text: string; sent: boolean }[];
  timeline: TimelineItem[];
  openTasks: Task[];
  doneToday: Task[];
  checkin: Checkin | null;
  settings: Settings;
};
