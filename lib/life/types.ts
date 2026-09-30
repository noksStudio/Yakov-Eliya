import type { BodyToday } from "./body";

export const AREAS = ["business", "body", "spirit", "mind", "finance", "home", "general"] as const;
export type Area = (typeof AREAS)[number];

export const AREA_LABELS: Record<Area, string> = {
  business: "עסק",
  body: "גוף",
  spirit: "רוח",
  mind: "מנטלי",
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

export const AGENTS = ["chief", "body"] as const;
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
  done?: boolean;
};

export type RestDay = { kind: "shabbat" | "yomtov"; name: string };

export type DayView = {
  body: BodyToday;
  date: string;
  weekday: string;
  gregorian: string;
  hebrewDate: string;
  restDay: RestDay | null;
  timeline: TimelineItem[];
  openTasks: Task[];
  doneToday: Task[];
  checkin: Checkin | null;
  settings: Settings;
};
