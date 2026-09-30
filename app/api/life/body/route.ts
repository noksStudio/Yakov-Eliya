import { bmi, loadBodyPlan, weightSeries } from "@/lib/life/body";
import { withStore } from "@/lib/life/service";

export async function GET() {
  return withStore(async (store) => {
    const plan = await loadBodyPlan(store);
    const weights = await weightSeries(store, plan.profile);
    const current = weights.at(-1)?.weight ?? plan.profile.start_weight;
    return { plan, weights, current, bmi: bmi(current, plan.profile.height_cm) };
  });
}
