import type { LifeStore } from "./store";
import { learningForDate, loadLearningGoal, type LearningToday } from "./learning";
import { streak } from "./metrics";
import { addDays, israelToday, restDayOf } from "./time";

export type SpiritDay = {
  date: string;
  label: string;
  rest: boolean;
  shacharit: boolean;
  mincha: boolean;
  arvit: boolean;
  hitbodedut: boolean;
};

export type SpiritSummary = {
  week: SpiritDay[];
  prayerStreak: number;
  hitbodedutStreak: number;
  prayersThisWeek: number;
  prayersPossible: number;
  hitbodedutThisWeek: number;
  learning: LearningToday;
};

const SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export async function spiritSummary(store: LifeStore, today = israelToday()): Promise<SpiritSummary> {
  const from = addDays(today, -29);
  const [checkins, goal] = await Promise.all([store.listCheckins(from, today), loadLearningGoal(store)]);
  const byDate = new Map(checkins.map((c) => [c.date, c]));
  const week: SpiritDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    const c = byDate.get(date);
    return {
      date,
      label: SHORT[new Date(`${date}T12:00:00Z`).getUTCDay()],
      rest: Boolean(restDayOf(date)),
      shacharit: c?.shacharit ?? false,
      mincha: c?.mincha ?? false,
      arvit: c?.arvit ?? false,
      hitbodedut: c?.hitbodedut ?? false,
    };
  });
  const weekdays = week.filter((d) => !d.rest);
  return {
    week,
    prayerStreak: streak(byDate, today, (c) => c.shacharit && c.mincha && c.arvit),
    hitbodedutStreak: streak(byDate, today, (c) => c.hitbodedut),
    prayersThisWeek: weekdays.reduce((s, d) => s + Number(d.shacharit) + Number(d.mincha) + Number(d.arvit), 0),
    prayersPossible: weekdays.length * 3,
    hitbodedutThisWeek: weekdays.filter((d) => d.hitbodedut).length,
    learning: learningForDate(goal, today),
  };
}
