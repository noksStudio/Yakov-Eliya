import { loadFinanceGoal } from "@/lib/life/finance";
import { financeGoalSchema } from "@/lib/life/ops-types";
import { readJson, withStore } from "@/lib/life/service";

export async function PUT(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const goal = financeGoalSchema.parse({ ...(await loadFinanceGoal(store)), ...body });
    return { goal: await store.saveDoc("finance_goal", goal) };
  });
}
