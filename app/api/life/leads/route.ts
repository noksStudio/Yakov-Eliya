import { firstFollowUp, getLeadsStore, migrateLeadDeals, newLeadSchema } from "@/lib/life/leads";
import { getOpsStore } from "@/lib/life/ops-store";
import { readJson, withStore } from "@/lib/life/service";

// The leads list in the business screen (behind the admin login via proxy.ts).

export async function GET() {
  return withStore(async () => {
    const leads = getLeadsStore();
    await migrateLeadDeals(getOpsStore(), leads);
    return { leads: await leads.list() };
  });
}

/** A lead he adds by hand (a referral, a call that came in). */
export async function POST(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    const input = newLeadSchema.parse(body);
    const settings = await store.getSettings();
    const lead = await getLeadsStore().add({
      ...input,
      follow_up_date: input.follow_up_date ?? firstFollowUp(new Date(), { cholHamoedOff: settings.chol_hamoed_off }),
      source: "manual",
    });
    return { lead };
  });
}
