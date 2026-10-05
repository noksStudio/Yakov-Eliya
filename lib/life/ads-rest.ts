import { israelToUtc } from "./ics";
import { loadShabbatPrefs } from "./shabbat-prep";
import type { LifeStore } from "./store";
import { escapeHtml, loadTelegram, sendMessage } from "./telegram";
import { addDays, israelToday, restDayOf } from "./time";
import { cityById, restTimes } from "./zmanim";

// His own Meta ad account (noks.studio) is paused for Shabbat and Yom Tov: half an hour before
// candle lighting every active campaign is paused, and half an hour after the end only those are
// turned back on. Clients' ad accounts are never touched, only META_AD_ACCOUNT_ID.

const DEFAULT_ACCOUNT = "2213018092820179"; // noks.studio
const MARGIN_MS = 30 * 60_000;
const graph = () => `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v23.0"}`;

type AdsRestDoc = { paused: { id: string; name: string }[]; resume_at: string | null };

export const adsRestConfigured = () => Boolean(process.env.META_ACCESS_TOKEN);
const account = () => (process.env.META_AD_ACCOUNT_ID || DEFAULT_ACCOUNT).replace(/^act_/, "");

async function metaCall(path: string, init?: { status: "PAUSED" | "ACTIVE" }) {
  const token = process.env.META_ACCESS_TOKEN!;
  const res = init
    ? await fetch(`${graph()}/${path}`, { method: "POST", body: new URLSearchParams({ status: init.status, access_token: token }) })
    : await fetch(`${graph()}/${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`);
  const data = (await res.json().catch(() => ({}))) as { error?: { message?: string }; data?: unknown };
  if (!res.ok || data.error) throw new Error(data.error?.message ?? `Meta ${res.status}`);
  return data;
}

async function activeCampaigns() {
  const filter = encodeURIComponent(JSON.stringify(["ACTIVE"]));
  const data = (await metaCall(`act_${account()}/campaigns?fields=id,name&effective_status=${filter}&limit=200`)) as { data?: { id: string; name: string }[] };
  return data.data ?? [];
}

/** The rest days around `date`: their eve's candle lighting and their end, as moments; null on a weekday. */
async function restWindow(store: LifeStore, date: string) {
  const prefs = await loadShabbatPrefs(store);
  const city = cityById(prefs.city) ?? cityById("netanya")!;
  // The eve: today if tomorrow is a rest day, else the last weekday before today's rest day.
  let eve: string | null = null;
  if (restDayOf(date)) {
    let d = addDays(date, -1);
    while (restDayOf(d)) d = addDays(d, -1);
    eve = d;
  } else if (restDayOf(addDays(date, 1))) eve = date;
  if (!eve) return null;
  const times = restTimes(eve, city, prefs.candle_minutes ?? city.candles);
  if (!times) return null;
  const last = times.days[times.days.length - 1].date;
  return { title: times.title, start: israelToUtc(eve, times.candles), end: israelToUtc(last, times.end) };
}

async function tell(store: LifeStore, text: string) {
  const { chat_id } = await loadTelegram(store);
  if (chat_id && process.env.TELEGRAM_BOT_TOKEN) await sendMessage(chat_id, text, true).catch(() => {});
}

/** Run by the cron every few minutes: pause before the rest day, turn the same campaigns back on after it. */
export async function runAdsRest(store: LifeStore, now = new Date()) {
  if (!adsRestConfigured()) return { skipped: "no META_ACCESS_TOKEN" };
  const doc: AdsRestDoc = { paused: [], resume_at: null, ...((await store.getDoc<Partial<AdsRestDoc>>("ads_rest")) ?? {}) };

  if (doc.resume_at) {
    if (now.getTime() < Date.parse(doc.resume_at)) return { waiting: doc.resume_at };
    const failed: string[] = [];
    for (const c of doc.paused) await metaCall(c.id, { status: "ACTIVE" }).catch(() => failed.push(c.name));
    await store.saveDoc<AdsRestDoc>("ads_rest", { paused: [], resume_at: null });
    if (doc.paused.length) {
      const names = doc.paused.map((c) => escapeHtml(c.name)).join(", ");
      await tell(store, failed.length ? `⚠️ לא הצלחתי להפעיל מחדש: ${escapeHtml(failed.join(", "))}. כדאי להפעיל ידנית ב־Ads Manager.` : `▶️ שבוע טוב! הקמפיינים הופעלו מחדש: ${names}`);
    }
    return { resumed: doc.paused.length, failed };
  }

  const window = await restWindow(store, israelToday(now));
  if (!window) return { idle: true };
  const t = now.getTime();
  if (t < window.start.getTime() - MARGIN_MS || t >= window.end.getTime() + MARGIN_MS) return { idle: true };

  const campaigns = await activeCampaigns();
  const paused: AdsRestDoc["paused"] = [];
  for (const c of campaigns) await metaCall(c.id, { status: "PAUSED" }).then(() => paused.push(c), () => {});
  const resume_at = new Date(window.end.getTime() + MARGIN_MS).toISOString();
  // Saved even when nothing was active, so this rest day is not checked again every 5 minutes.
  await store.saveDoc<AdsRestDoc>("ads_rest", { paused, resume_at });
  if (paused.length) {
    await tell(store, `⏸️ ${paused.length === 1 ? "קמפיין הושהה" : `${paused.length} קמפיינים הושהו`} ל${escapeHtml(window.title)}: ${paused.map((c) => escapeHtml(c.name)).join(", ")}. יופעלו מחדש אוטומטית במוצאי ${escapeHtml(window.title)}.`);
  }
  return { paused: paused.length, resume_at };
}
