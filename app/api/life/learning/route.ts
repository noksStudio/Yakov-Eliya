import { z } from "zod";
import { learningForDate, learningGoalSchema, loadLearningGoal } from "@/lib/life/learning";
import { readJson, withStore } from "@/lib/life/service";
import { israelToday } from "@/lib/life/time";

export async function GET() {
  return withStore(async (store) => ({ learning: learningForDate(await loadLearningGoal(store), israelToday()) }));
}

// Either move the counter by a few amudim (+1 after a session, -1 to undo) or change the goal.
const patchSchema = z.union([z.object({ delta: z.number().int().min(-10).max(10) }), learningGoalSchema.partial()]);

export async function PUT(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const goal = await loadLearningGoal(store);
    const patch = patchSchema.parse(body);
    const next =
      "delta" in patch
        ? { ...goal, done: Math.min(goal.total, Math.max(0, goal.done + patch.delta)) }
        : learningGoalSchema.parse({ ...goal, ...patch });
    await store.saveDoc("learning_goal", next);
    return { learning: learningForDate(next, israelToday()) };
  });
}
