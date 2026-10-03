import type { Checkin, DayView, LifeEvent, Settings, Task, TimelineItem } from "./types";
import { activityEnd, type BodyToday } from "./body";
import type { LearningToday } from "./learning";
import type { Recurring } from "./recurring";
import { cholHamoedOf, fromMinutes, gregorianLabel, hebrewDateLabel, israelToday, restDayOf, toMinutes, weekdayName } from "./time";

/**
 * The fixed shape of a day: anchors (sleep, prayers, hitbodedut) that nothing may move, plus the
 * routine blocks agreed in the plan. Events and scheduled tasks are laid in around them.
 */
export function dayTemplate(s: Settings): TimelineItem[] {
  const items: TimelineItem[] = [
    { key: "wake", start: s.wake_time, end: null, title: "קימה", note: "מים, אור יום, התארגנות", area: "body", kind: "anchor", anchor: "wake" },
  ];

  // Light movement between waking and Shacharit, when there is room for at least 15 minutes.
  const moveStart = toMinutes(s.wake_time) + 15;
  const moveEnd = toMinutes(s.shacharit_time) - 10;
  if (moveEnd - moveStart >= 15) {
    items.push({
      key: "move",
      start: fromMinutes(moveStart),
      end: fromMinutes(moveEnd),
      title: "תנועה קלה",
      note: "הליכה או מתיחות",
      area: "body",
      kind: "routine",
    });
  }

  const afterShacharit = fromMinutes(toMinutes(s.shacharit_time) + 45);
  items.push(
    { key: "shacharit", start: s.shacharit_time, end: afterShacharit, title: "שחרית", area: "spirit", kind: "anchor", anchor: "shacharit" },
    {
      key: "plan",
      start: afterShacharit,
      end: fromMinutes(toMinutes(afterShacharit) + 30),
      title: "ארוחת בוקר ותכנית היום",
      note: "צ׳ק־אין בוקר, 3 המשימות החשובות",
      area: "general",
      kind: "routine",
    },
    { key: "deep", start: s.deep_work_start, end: s.deep_work_end, title: "עבודה עמוקה", note: "מכירות ופנייה ישירה", area: "business", kind: "routine" },
    { key: "mincha", start: s.mincha_time, end: null, title: "מנחה", note: s.mincha_time ? undefined : "קבע שעה בהגדרות", area: "spirit", kind: "anchor", anchor: "mincha" },
    { key: "arvit", start: s.arvit_time, end: null, title: "ערבית", note: s.arvit_time ? undefined : "קבע שעה בהגדרות", area: "spirit", kind: "anchor", anchor: "arvit" },
    {
      key: "close",
      start: s.day_close_time,
      end: fromMinutes(toMinutes(s.day_close_time) + 15),
      title: "סגירת יום",
      note: "2 דקות סיכום ותכנון מחר",
      area: "general",
      kind: "routine",
    },
    {
      key: "hitbodedut",
      start: s.hitbodedut_time,
      end: fromMinutes(toMinutes(s.hitbodedut_time) + s.hitbodedut_minutes),
      title: "התבודדות",
      area: "spirit",
      kind: "anchor",
      anchor: "hitbodedut",
    },
    { key: "screens", start: s.screens_off_time, end: null, title: "מסכים כבויים", note: "רגיעה לפני שינה", area: "body", kind: "routine" },
    { key: "sleep", start: s.sleep_time, end: null, title: "שינה", area: "body", kind: "anchor", anchor: "sleep" },
  );
  return items;
}

function byStart(a: TimelineItem, b: TimelineItem) {
  // Items without a time (prayers not set yet) sink to the end of the list.
  if (a.start === null) return 1;
  if (b.start === null) return -1;
  return toMinutes(a.start) - toMinutes(b.start);
}

export function buildDay(
  date: string,
  settings: Settings,
  events: LifeEvent[],
  tasks: Task[],
  checkin: Checkin | null,
  body: BodyToday,
  learning: LearningToday,
  /** Weekly commitments already filtered to this date (see recurringFor). */
  recurring: Recurring[] = [],
  weekFocus: string[] = [],
  contextLessons: DayView["contextLessons"] = [],
): DayView {
  const activity: TimelineItem[] = body.activity
    ? [
        {
          key: "workout",
          start: body.activity.time,
          end: fromMinutes(activityEnd(body.activity)),
          title: body.activity.title,
          area: "body",
          kind: "routine",
          done: checkin?.workout ?? false,
        },
      ]
    : [];
  const study: TimelineItem[] = learning.session
    ? [
        {
          key: "learning",
          start: learning.session.start,
          end: learning.session.end,
          title: `לימוד: ${learning.title}`,
          note: learning.next ?? undefined,
          area: "spirit",
          kind: "routine",
        },
      ]
    : [];
  const dayOff = settings.chol_hamoed_off && !restDayOf(date) ? cholHamoedOf(date) : null;
  const timeline = [
    // A day off keeps the anchors and routines but drops the work block.
    ...dayTemplate(settings).filter((item) => !(dayOff && item.key === "deep")),
    ...activity,
    ...study,
    ...recurring.map<TimelineItem>((r) => ({
      key: `rec-${r.id}`,
      start: r.start_time,
      end: r.end_time,
      title: r.title,
      area: r.area,
      kind: "event",
      recurring: true,
    })),
    ...events.map<TimelineItem>((e) => ({
      key: `event-${e.id}`,
      id: e.id,
      start: e.start_time,
      end: e.end_time,
      title: e.title,
      area: e.area,
      kind: "event",
    })),
    ...tasks
      .filter((t) => t.scheduled_time && t.due_date === date)
      .map<TimelineItem>((t) => ({
        key: `task-${t.id}`,
        id: t.id,
        start: t.scheduled_time,
        end: null,
        title: t.title,
        area: t.area,
        kind: "task",
        done: t.done,
      })),
  ].sort(byStart);

  const openTasks = tasks
    .filter((t) => !t.done && (t.due_date === null || t.due_date <= date))
    .sort((a, b) => a.priority - b.priority || (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
  const doneToday = tasks.filter((t) => t.done && t.done_at && israelToday(new Date(t.done_at)) === date);

  return {
    date,
    weekday: weekdayName(date),
    gregorian: gregorianLabel(date),
    hebrewDate: hebrewDateLabel(date),
    restDay: settings.shabbat_silence ? restDayOf(date) : null,
    restEnd: null,
    dayOff,
    startsOn: settings.start_date && date < settings.start_date ? settings.start_date : null,
    weekFocus,
    contextLessons,
    dueLeads: [],
    reminders: [],
    shabbat: null,
    timeline,
    openTasks,
    doneToday,
    checkin,
    settings,
    body,
    learning,
  };
}

/** Time windows that belong to anchors; events may not overlap them. */
export function anchorWindows(s: Settings): { title: string; start: number; end: number }[] {
  const win = (title: string, start: string | null, minutes: number) =>
    start ? [{ title, start: toMinutes(start), end: toMinutes(start) + minutes }] : [];
  return [
    ...win("שחרית", s.shacharit_time, 45),
    ...win("מנחה", s.mincha_time, 20),
    ...win("ערבית", s.arvit_time, 20),
    ...win("התבודדות", s.hitbodedut_time, s.hitbodedut_minutes),
    // Night: from bedtime to midnight, and from midnight to waking.
    { title: "שינה", start: toMinutes(s.sleep_time), end: 24 * 60 },
    { title: "שינה", start: 0, end: toMinutes(s.wake_time) },
  ];
}

export function anchorConflict(s: Settings, start: string, end: string | null): string | null {
  const from = toMinutes(start);
  const to = end ? toMinutes(end) : from + 1;
  const hit = anchorWindows(s).find((w) => from < w.end && to > w.start);
  return hit ? hit.title : null;
}
