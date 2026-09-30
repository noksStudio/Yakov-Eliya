import { z } from "zod";
import { JOURNAL_KINDS, getJournalStore, newJournalSchema } from "@/lib/life/journal";
import { readJson, withStore } from "@/lib/life/service";

export async function GET(request: Request) {
  const kind = z.enum(JOURNAL_KINDS).parse(new URL(request.url).searchParams.get("kind") ?? "reflection");
  return withStore(async () => ({ entries: await getJournalStore().list(kind, 30) }));
}

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async () => ({ entry: await getJournalStore().add(newJournalSchema.parse(body)) }));
}
