import { CITIES } from "@/lib/life/zmanim";
import { DEFAULT_CHECKLIST, saveShabbatPrefs, shabbatPrefsSchema, upcomingTimes } from "@/lib/life/shabbat-prep";
import { readJson, withStore } from "@/lib/life/service";
import type { LifeStore } from "@/lib/life/store";

// The Shabbat card in settings (behind the admin login via proxy.ts).

const view = async (store: LifeStore) => {
  const { prefs, city, eve, times } = await upcomingTimes(store);
  return {
    shabbat: {
      ...prefs,
      default_checklist: DEFAULT_CHECKLIST,
      cities: CITIES.map(({ id, name, candles }) => ({ id, name, candles })),
      preview: city && eve && times ? { eve, title: times.title, candles: times.candles, end: times.end } : null,
    },
  };
};

export async function GET() {
  return withStore(view);
}

export async function PUT(request: Request) {
  const body = await readJson(request);
  return withStore(async (store) => {
    await saveShabbatPrefs(store, shabbatPrefsSchema.parse(body));
    return view(store);
  });
}
