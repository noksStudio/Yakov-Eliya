// Search, client-safe part: Hebrew-aware matching and the index of screens and sections, so page
// results show instantly while the data search runs on the server.

export type SearchKind =
  | "page"
  | "day"
  | "task"
  | "event"
  | "recurring"
  | "reminder"
  | "occasion"
  | "idea"
  | "lesson"
  | "goal"
  | "lead"
  | "deal"
  | "gift"
  | "shopping"
  | "finance"
  | "review";

export type SearchResult = { key: string; kind: SearchKind; title: string; subtitle?: string; href: string; score: number };

export const KIND_LABELS: Record<SearchKind, string> = {
  page: "מסכים",
  day: "תאריכים",
  occasion: "ימי הולדת ותאריכים חשובים",
  task: "משימות",
  event: "אירועים",
  recurring: "קבועים בשבוע",
  reminder: "תזכורות",
  idea: "רעיונות",
  lesson: "לקחים",
  goal: "יעדים",
  lead: "לידים",
  deal: "עסקאות",
  gift: "מתנות",
  shopping: "רשימת קניות",
  finance: "כספים",
  review: "סקירות שבועיות",
};

const FINALS: Record<string, string> = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };
// Common spellings that should find each other.
const SYNONYMS: [RegExp, string][] = [
  [/יומולדת|יומהולדת/g, "יום הולדת"],
  [/תפריט|אוכל|ארוחות/g, "תפריט"],
  [/כושר|אימון/g, "אימונ"],
];

/** Lower-case, no niqqud or quote marks, final letters folded, known spellings unified. */
export function normalize(text: string) {
  let s = text
    .toLowerCase()
    .replace(/[֑-ׇ]/g, "")
    .replace(/["'׳״`]/g, "")
    .replace(/[־\-_/.,:;!?()]/g, " ");
  // Spellings first (their patterns use final letters), then fold final letters everywhere.
  for (const [re, to] of SYNONYMS) s = s.replace(re, to);
  return s
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * How well `query` matches: 0 = no match. Every word must appear; a title that starts with the
 * query ranks highest, then a title that contains it, then a match anywhere in the extra text.
 */
export function matchScore(query: string, title: string, extra = ""): number {
  const q = normalize(query);
  if (!q) return 0;
  const t = normalize(title);
  const all = `${t} ${normalize(extra)}`;
  const words = q.split(" ");
  if (!words.every((w) => all.includes(w))) return 0;
  if (t.startsWith(q)) return 100;
  if (t.includes(q)) return 80;
  if (words.every((w) => t.includes(w))) return 60;
  return 30;
}

type Page = { title: string; subtitle: string; href: string; keywords: string };

/** Every screen and section worth jumping to, with the words people would type to find it. */
export const PAGES: Page[] = [
  { title: "היום שלי", subtitle: "לו״ז, משימות וצ׳ק־אין", href: "/life", keywords: "יום היום לוז משימות צק אין בית ראשי" },
  { title: "לו״ז שבועי", subtitle: "כל השבוע, יום אחרי יום", href: "/life?v=week", keywords: "שבוע שבועי לוז יומן" },
  { title: "לו״ז חודשי", subtitle: "לוח שנה", href: "/life?v=month", keywords: "חודש חודשי לוח שנה יומן קלנדר" },
  { title: "קבועים בכל שבוע", subtitle: "חוג, שיעור, פגישה קבועה", href: "/life?v=week", keywords: "קבוע קבועים חוזר שבועי שיעור חוג" },
  { title: "המנהל הראשי", subtitle: "לו״ז ומשימות", href: "/life/chat", keywords: "מנהל ראשי צאט סוכן תכנון" },
  { title: "צמיחה: יעדים (חזון 30)", subtitle: "משקל, רווח, מסכת מגילה", href: "/life/growth", keywords: "צמיחה יעדים חזון 30 מטרות התקדמות" },
  { title: "לקחים", subtitle: "טעויות שלי ושל אחרים", href: "/life/growth?tab=lessons", keywords: "לקח לקחים טעות טעויות תובנה" },
  { title: "סקירה שבועית", subtitle: "מה הלך, הלקח ו־3 פוקוסים", href: "/life/growth?tab=review", keywords: "סקירה שבועית פוקוס רפלקציה" },
  { title: "רעיונות", subtitle: "מערכות ומוצרים לפתח", href: "/life/ideas", keywords: "רעיון רעיונות מערכת מוצר פיתוח" },
  { title: "גוף", subtitle: "תפריט, אימונים ומשקל", href: "/life/body", keywords: "גוף משקל שקילה תפריט אימונ חדר כושר ריצה הליכה תזונה קלוריות חלבון" },
  { title: "מאמן הגוף", subtitle: "כושר, תזונה ושינה", href: "/life/coach", keywords: "מאמן גוף כושר תזונה שינה" },
  { title: "רשימת קניות", subtitle: "לפי התפריט", href: "/life/shopping", keywords: "קניות רשימה סופר מכולת" },
  { title: "כספים", subtitle: "רווח מול יעד חודשי", href: "/life/finance", keywords: "כסף כספים רווח הכנסה הוצאה הוצאות תקציב שיווק" },
  { title: "מנהל הכספים", subtitle: "רווח ויעד חודשי", href: "/life/agent/finance", keywords: "מנהל כספים סוכן" },
  { title: "עסק", subtitle: "עסקאות, פולואפים ופעילות מכירה", href: "/life/business", keywords: "עסק עסקאות לקוחות לידים פולואפ מכירות פגישות הצעת מחיר" },
  { title: "מנהל העסק", subtitle: "עסקאות ופעילות מכירה", href: "/life/agent/business", keywords: "מנהל עסק סוכן מכירות" },
  { title: "רוח", subtitle: "תפילות, התבודדות ולימוד", href: "/life/spirit", keywords: "רוח תפילה תפילות שחרית מנחה ערבית התבודדות לימוד מסכת מגילה דף" },
  { title: "המלווה הרוחני", subtitle: "תפילות, התבודדות ולימוד", href: "/life/agent/spirit", keywords: "מלווה רוחני סוכן" },
  { title: "יומן התבודדות", subtitle: "פרטי לגמרי", href: "/life/spirit", keywords: "יומן התבודדות" },
  { title: "מנטלי", subtitle: "מצב רוח, אנרגיה, רפלקציה ונשימה", href: "/life/mind", keywords: "מנטלי מצב רוח אנרגיה רפלקציה נשימה לחץ" },
  { title: "המאמן המנטלי", subtitle: "מיקוד ודחיינות", href: "/life/agent/mind", keywords: "מאמן מנטלי סוכן דחיינות" },
  { title: "זוגיות", subtitle: "תאריכים, מתנות ומה שהיא אוהבת", href: "/life/couple", keywords: "זוגיות אישה אשתי מתנה מתנות דייט יום נישואין יום הולדת משפחה" },
  { title: "היועץ הזוגי", subtitle: "זוגיות, מתנות ותאריכים", href: "/life/agent/couple", keywords: "יועץ זוגי סוכן" },
  { title: "תאריכים במשפחה", subtitle: "ימי הולדת ואירועים גדולים", href: "/life/couple", keywords: "יום הולדת ימי הולדת משפחה ילדים אילן תאריכים" },
  { title: "מדדים", subtitle: "כל היעדים במקום אחד", href: "/life/metrics", keywords: "מדדים מדד סטטיסטיקה גרף" },
  { title: "הגדרות", subtitle: "שעות, שבת וחול המועד", href: "/life/settings", keywords: "הגדרות שעות קימה שינה תפילות זמנים חול המועד שבת" },
  { title: "חיבור המערכת", subtitle: "Supabase, מפתח API, טלגרם והתראות", href: "/life/settings/setup", keywords: "חיבור חיבורים התקנה מפתח api סופאבייס supabase vercel משתני סביבה הגדרה מסד נתונים cron" },
  { title: "זמני שבת", subtitle: "כניסה, יציאה ורשימת הכנות לבית", href: "/life/settings#shabbat-title", keywords: "שבת זמני שבת כניסת שבת יציאת שבת הדלקת נרות הבדלה מזגן שעון שבת מקרר מצב שבת" },
  { title: "תזכורות", subtitle: "כל התזכורות, עריכה וביטול", href: "/life/reminders", keywords: "תזכורות תזכורת להזכיר הזכר לי התראה" },
  { title: "מערכות מחוברות", subtitle: "Bossi: לידים חמים, סגירות ושיחות", href: "/life/settings#integrations-title", keywords: "bossi בוסי חיבור api מפתח התממשקות אינטגרציה crm לידים שיחות קרות" },
  { title: "גיבוי", subtitle: "הורדה, שליחה לטלגרם ושחזור", href: "/life/settings#backup-title", keywords: "גיבוי גיבויים ייצוא שחזור קובץ backup export restore" },
  { title: "יומן באייפון", subtitle: "הלו״ז ביומן של הטלפון", href: "/life/settings#calendar-title", keywords: "יומן אייפון iphone גוגל google calendar ics לוח שנה סנכרון מנוי" },
  { title: "התראות בטלגרם", subtitle: "חיבור הבוט ובחירת התראות", href: "/life/settings", keywords: "טלגרם התראות בוט תזכורות" },
];

export function searchPages(query: string): SearchResult[] {
  return PAGES.map((p) => ({ p, score: matchScore(query, p.title, `${p.subtitle} ${p.keywords}`) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ p, score }) => ({ key: `page-${p.href}-${p.title}`, kind: "page", title: p.title, subtitle: p.subtitle, href: p.href, score }));
}
