import type { LifeStore } from "./store";
import { addDays, israelToday } from "./time";

export type MindSummary = {
  mood: { date: string; value: number }[];
  energy: { date: string; value: number }[];
  /** 7-day averages, and the week before for comparison. */
  week: { mood: number | null; energy: number | null; rating: number | null; sleep: number | null };
  prevWeek: { mood: number | null; energy: number | null; rating: number | null; sleep: number | null };
};

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

export async function mindSummary(store: LifeStore, today = israelToday()): Promise<MindSummary> {
  const checkins = await store.listCheckins(addDays(today, -29), today);
  const series = (key: "mood" | "energy") =>
    checkins.filter((c) => c[key] !== null).map((c) => ({ date: c.date, value: Number(c[key]) }));
  const range = (fromDaysAgo: number, toDaysAgo: number) => {
    const list = checkins.filter((c) => c.date > addDays(today, -fromDaysAgo) && c.date <= addDays(today, -toDaysAgo));
    const pick = (key: "mood" | "energy" | "day_rating" | "sleep_hours") =>
      avg(list.filter((c) => c[key] !== null).map((c) => Number(c[key])));
    return { mood: pick("mood"), energy: pick("energy"), rating: pick("day_rating"), sleep: pick("sleep_hours") };
  };
  return { mood: series("mood"), energy: series("energy"), week: range(7, 0), prevWeek: range(14, 7) };
}
