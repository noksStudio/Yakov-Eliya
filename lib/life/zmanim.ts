import { addDays, restDayOf, TIME_ZONE } from "./time";

// Shabbat and Yom Tov times, computed locally (no outside service): sunset with the standard
// solar formula (NOAA / Almanac for Computers), candle lighting X minutes before it by the
// city's custom, and the end at tzeit hakochavim (sun 8.5° below the horizon), as most Israeli
// calendars print. Sea-level horizon, so a local calendar may differ by a minute or two.

export type City = { id: string; name: string; lat: number; lon: number; /** Minutes before sunset. */ candles: number };

export const CITIES: City[] = [
  { id: "jerusalem", name: "ירושלים", lat: 31.778, lon: 35.235, candles: 40 },
  { id: "tel-aviv", name: "תל אביב", lat: 32.085, lon: 34.782, candles: 20 },
  { id: "bnei-brak", name: "בני ברק", lat: 32.084, lon: 34.834, candles: 20 },
  { id: "petah-tikva", name: "פתח תקווה", lat: 32.087, lon: 34.887, candles: 20 },
  { id: "rishon", name: "ראשון לציון", lat: 31.964, lon: 34.804, candles: 20 },
  { id: "rehovot", name: "רחובות", lat: 31.894, lon: 34.811, candles: 20 },
  { id: "ashdod", name: "אשדוד", lat: 31.804, lon: 34.655, candles: 20 },
  { id: "netanya", name: "נתניה", lat: 32.321, lon: 34.853, candles: 20 },
  { id: "elad", name: "אלעד", lat: 32.052, lon: 34.951, candles: 20 },
  { id: "modiin", name: "מודיעין", lat: 31.898, lon: 35.01, candles: 20 },
  { id: "beit-shemesh", name: "בית שמש", lat: 31.747, lon: 34.988, candles: 30 },
  { id: "beitar", name: "ביתר עילית", lat: 31.697, lon: 35.115, candles: 40 },
  { id: "haifa", name: "חיפה", lat: 32.794, lon: 34.99, candles: 30 },
  { id: "tiberias", name: "טבריה", lat: 32.795, lon: 35.531, candles: 20 },
  { id: "safed", name: "צפת", lat: 32.965, lon: 35.496, candles: 20 },
  { id: "beer-sheva", name: "באר שבע", lat: 31.252, lon: 34.791, candles: 20 },
  { id: "eilat", name: "אילת", lat: 29.558, lon: 34.952, candles: 20 },
];
export const cityById = (id: string | null | undefined) => CITIES.find((c) => c.id === id) ?? null;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Minutes from Israel midnight when the sun sets past `zenith` degrees on `date` (YYYY-MM-DD). */
export function sunsetMinutes(date: string, lat: number, lon: number, zenith = 90.833) {
  const [y, m, d] = date.split("-").map(Number);
  const dayOfYear = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86_400_000);
  const lngHour = lon / 15;
  const t = dayOfYear + (18 - lngHour) / 24;
  const M = 0.9856 * t - 3.289;
  const L = mod(M + 1.916 * Math.sin(rad(M)) + 0.02 * Math.sin(rad(2 * M)) + 282.634, 360);
  let RA = mod(deg(Math.atan(0.91764 * Math.tan(rad(L)))), 360);
  RA = (RA + Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90) / 15;
  const sinDec = 0.39782 * Math.sin(rad(L));
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.cos(rad(zenith)) - sinDec * Math.sin(rad(lat))) / (cosDec * Math.cos(rad(lat)));
  const H = deg(Math.acos(cosH)) / 15;
  const T = H + RA - 0.06571 * t - 6.622;
  const utcHours = mod(T - lngHour, 24);
  return utcHours * 60 + israelOffsetMinutes(date);
}

/** Israel's offset from UTC on that date, in minutes (180 in summer time, 120 in winter). */
function israelOffsetMinutes(date: string) {
  const noon = new Date(`${date}T12:00:00Z`);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).formatToParts(noon).map((p) => [p.type, p.value]),
  );
  return (Number(parts.hour) - 12) * 60 + Number(parts.minute);
}

const hhmm = (minutes: number) => {
  const m = Math.floor(minutes);
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

export type RestTimes = {
  /** The rest days starting the day after `eve` (Shabbat, Yom Tov, or both back to back). */
  days: { date: string; name: string }[];
  title: string;
  candles: string;
  end: string;
  /** Rabbeinu Tam: 72 minutes after the last day's sunset. */
  endRabbeinuTam: string;
};

/** Candle lighting on `eve` and the end of the rest days that follow it; null if none follow. */
export function restTimes(eve: string, city: City, candleMinutes = city.candles): RestTimes | null {
  const days: RestTimes["days"] = [];
  for (let d = addDays(eve, 1); restDayOf(d); d = addDays(d, 1)) {
    const rest = restDayOf(d)!;
    // A Yom Tov that falls on Shabbat is both ("שמחת תורה ושבת").
    const saturday = new Date(`${d}T12:00:00Z`).getUTCDay() === 6;
    days.push({ date: d, name: rest.kind === "yomtov" && saturday ? `${rest.name} ושבת` : rest.name });
  }
  if (!days.length) return null;
  const last = days[days.length - 1].date;
  const names = [...new Set(days.map((d) => d.name))];
  return {
    days,
    title: names.join(" ו"),
    // Candle lighting is rounded down: lighting a minute early is fine, a minute late is not.
    candles: hhmm(sunsetMinutes(eve, city.lat, city.lon) - candleMinutes),
    // The end is rounded up, for the same reason.
    end: hhmm(Math.ceil(sunsetMinutes(last, city.lat, city.lon, 98.5))),
    endRabbeinuTam: hhmm(Math.ceil(sunsetMinutes(last, city.lat, city.lon) + 72)),
  };
}
