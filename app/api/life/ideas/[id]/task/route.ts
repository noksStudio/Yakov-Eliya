import { z } from "zod";
import { getIdeasStore } from "@/lib/life/ideas";
import { notFound, readJson, withStore } from "@/lib/life/service";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({ step_id: z.string().optional() });

/** Turns the idea (or one of its steps) into a task on the open list, and remembers the link. */
export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await readJson(request);
  return withStore(async (store) => {
    const { step_id } = bodySchema.parse(body);
    const ideas = getIdeasStore();
    const idea = await ideas.get(id);
    if (!idea) return notFound();
    const step = step_id ? idea.steps.find((s) => s.id === step_id) : null;
    if (step_id && !step) return notFound();

    const task = await store.addTask({ title: step ? `${step.text} (${idea.title})` : idea.title, area: idea.area, priority: 2 });
    const updated = await ideas.update(id, {
      // Acting on it moves it forward: a step means it is being checked, the whole idea means it is under way.
      status: step ? (idea.status === "idea" ? "exploring" : idea.status) : idea.status === "idea" || idea.status === "exploring" ? "doing" : idea.status,
      ...(step ? { steps: idea.steps.map((s) => (s.id === step.id ? { ...s, task_id: task.id } : s)) } : {}),
    });
    return { idea: updated, task };
  });
}
