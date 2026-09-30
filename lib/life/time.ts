import type { RestDay } from "./types";

// Everything in the life OS runs on Israel time, whatever timezone the server is in.
export const TIME_ZONE = "Asia/Jerusalem";

export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function israelToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

export function israelNow(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

/** Noon UTC of a YYYY-MM-DD key: the same calendar day in Israel, safe for formatting. */
function atNoon(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

export function addDays(date: string, days: number): string {
  const d = atNoon(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const t = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export function weekdayName(date: string): string {
  return new Intl.DateTimeFormat("he-IL", { weekday: "long", timeZone: "UTC" }).format(atNoon(date));
}

export function gregorianLabel(date: string): string {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long", timeZone: "UTC" }).format(atNoon(date));
}

const HEBREW_MONTHS: Record<string, string> = {
  Tishri: "תשרי",
  Heshvan: "חשוון",
  Kislev: "כסלו",
  Tevet: "טבת",
  Shevat: "שבט",
  "Adar I": "אדר א׳",
  Adar: "אדר",
  "Adar II": "אדר ב׳",
  Nisan: "ניסן",
  Iyar: "אייר",
  Sivan: "סיוון",
  Tamuz: "תמוז",
  Av: "אב",
  Elul: "אלול",
};

function hebrewParts(date: string) {
  const parts = new Intl.DateTimeFormat("en-u-ca-hebrew", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(atNoon(date));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { day: Number(get("day")), month: get("month"), year: Number(get("year")) };
}

const ONES = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
const HUNDREDS = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];

/** Hebrew numerals (gematria) for 1–999, with the ט״ו / ט״ז convention and geresh marks. */
export function hebrewNumeral(n: number): string {
  let letters = HUNDREDS[Math.floor(n / 100) % 10];
  const rest = n % 100;
  if (rest === 15) letters += "טו";
  else if (rest === 16) letters += "טז";
  else letters += TENS[Math.floor(rest / 10)] + ONES[rest % 10];
  return letters.length === 1 ? `${letters}׳` : `${letters.slice(0, -1)}״${letters.slice(-1)}`;
}

export function hebrewDateLabel(date: string): string {
  const { day, month, year } = hebrewParts(date);
  return `${hebrewNumeral(day)} ${HEBREW_MONTHS[month] ?? month} ${hebrewNumeral(year % 1000)}`;
}

/** The Hebrew day as a numeral and the month name, for calendar cells. */
export function hebrewDayMonth(date: string): { day: string; month: string; dayNumber: number } {
  const { day, month } = hebrewParts(date);
  return { day: hebrewNumeral(day), month: HEBREW_MONTHS[month] ?? month, dayNumber: day };
}

// Yom Tov days as kept in Israel (one day each, Rosh Hashana two).
const YOM_TOV: { month: string; day: number; name: string }[] = [
  { month: "Tishri", day: 1, name: "ראש השנה" },
  { month: "Tishri", day: 2, name: "ראש השנה" },
  { month: "Tishri", day: 10, name: "יום כיפור" },
  { month: "Tishri", day: 15, name: "סוכות" },
  { month: "Tishri", day: 22, name: "שמחת תורה" },
  { month: "Nisan", day: 15, name: "פסח" },
  { month: "Nisan", day: 21, name: "שביעי של פסח" },
  { month: "Sivan", day: 6, name: "שבועות" },
];

export function restDayOf(date: string): RestDay | null {
  const { day, month } = hebrewParts(date);
  const yomTov = YOM_TOV.find((y) => y.month === month && y.day === day);
  if (yomTov) return { kind: "yomtov", name: yomTov.name };
  if (atNoon(date).getUTCDay() === 6) return { kind: "shabbat", name: "שבת" };
  return null;
}
