import { NextResponse } from "next/server";
import { RecurringConflictError, addRecurring, loadRecurring } from "@/lib/life/recurring";
import { readJson, withStore } from "@/lib/life/service";

export async function GET() {
  return withStore(async (store) => ({ recurring: await loadRecurring(store) }));
}

export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    try {
      return { item: await addRecurring(store, body) };
    } catch (error) {
      if (error instanceof RecurringConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
      throw error;
    }
  });
}
