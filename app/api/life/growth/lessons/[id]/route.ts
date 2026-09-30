import { getLessonsStore, requeueLesson } from "@/lib/life/lessons";
import { notFound, readJson, withStore } from "@/lib/life/service";

type Params = { params: Promise<{ id: string }> };

/** Edits a lesson; { again: true } brings it back tomorrow and restarts its schedule. */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await readJson(request)) as { again?: boolean };
  return withStore(async () => {
    const lessons = getLessonsStore();
    if (body.again) {
      const exists = (await lessons.list(true)).some((l) => l.id === id);
      if (!exists) return notFound();
      await requeueLesson(id);
      return { ok: true };
    }
    const lesson = await lessons.update(id, body);
    return lesson ? { lesson } : notFound();
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return withStore(async () => ((await getLessonsStore().remove(id)) ? { ok: true } : notFound()));
}
