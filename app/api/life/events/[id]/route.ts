import { z } from "zod";
import { eventGuests, setInviteText } from "@/lib/life/guests";
import { notFound, readJson, withStore } from "@/lib/life/service";

/** The event page: the event, its prep tasks and its guests. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withStore(async (store) => {
    const event = await store.getEvent(id);
    if (!event) return notFound();
    const [tasks, guests] = await Promise.all([store.listEventTasks([id]), eventGuests(store, id)]);
    return { event, tasks, ...guests };
  });
}

const inviteSchema = z.object({ invite_text: z.string().max(1000).nullable() });

/** The WhatsApp invitation text ({שם} becomes each guest's first name). */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await readJson(request);
  return withStore(async (store) => {
    if (!(await store.getEvent(id))) return notFound();
    const { invite_text } = inviteSchema.parse(body);
    return await setInviteText(store, id, invite_text);
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withStore(async (store) => ((await store.deleteEvent(id)) ? { ok: true } : notFound()));
}
