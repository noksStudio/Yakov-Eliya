import type { LifeStore } from "./store";
import type { OpsStore } from "./ops-store";
import { DEFAULT_FINANCE_GOAL, type FinanceEntry, type FinanceGoal } from "./ops-types";
import { israelToday } from "./time";

export async function loadFinanceGoal(store: LifeStore): Promise<FinanceGoal> {
  return (await store.getDoc<FinanceGoal>("finance_goal")) ?? DEFAULT_FINANCE_GOAL;
}

function monthBounds(date: string) {
  const [y, m] = date.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(days).padStart(2, "0")}`, days };
}

export type FinanceSummary = {
  month: string;
  goal: FinanceGoal;
  income: number;
  expenses: number;
  marketing: number;
  /** Business profit so far this month: business income minus business expenses. */
  profit: number;
  /** Profit before marketing spend. */
  profitBeforeMarketing: number;
  todayProfit: number;
  daysInMonth: number;
  daysLeft: number;
  neededPerDay: number;
  projection: number;
  pct: number;
  /** Cumulative profit per day of the month so far, for the chart. */
  cumulative: { date: string; value: number }[];
  entries: FinanceEntry[];
};

export async function financeSummary(store: LifeStore, ops: OpsStore, date = israelToday()): Promise<FinanceSummary> {
  const { from, to, days } = monthBounds(date);
  const [goal, entries] = await Promise.all([loadFinanceGoal(store), ops.listFinance(from, to)]);
  const business = entries.filter((e) => e.scope === "business");
  const sum = (list: FinanceEntry[]) => list.reduce((s, e) => s + e.amount, 0);
  const income = sum(business.filter((e) => e.kind === "income"));
  const expenses = sum(business.filter((e) => e.kind === "expense"));
  const marketing = sum(business.filter((e) => e.kind === "expense" && e.category === "שיווק"));
  const profit = income - expenses;
  const dayOfMonth = Number(date.slice(8, 10));
  const daysLeft = days - dayOfMonth + 1;
  const net = (e: FinanceEntry) => (e.kind === "income" ? e.amount : -e.amount);

  const cumulative: { date: string; value: number }[] = [];
  let running = 0;
  for (let d = 1; d <= dayOfMonth; d++) {
    const key = `${from.slice(0, 8)}${String(d).padStart(2, "0")}`;
    running += business.filter((e) => e.date === key).reduce((s, e) => s + net(e), 0);
    cumulative.push({ date: key, value: running });
  }

  return {
    month: from.slice(0, 7),
    goal,
    income,
    expenses,
    marketing,
    profit,
    profitBeforeMarketing: profit + marketing,
    todayProfit: business.filter((e) => e.date === date).reduce((s, e) => s + net(e), 0),
    daysInMonth: days,
    daysLeft,
    neededPerDay: Math.max(0, Math.ceil((goal.monthly_goal - profit) / daysLeft)),
    projection: Math.round((profit / dayOfMonth) * days),
    pct: goal.monthly_goal ? Math.round((profit / goal.monthly_goal) * 100) : 0,
    cumulative,
    entries: [...entries].reverse(),
  };
}
