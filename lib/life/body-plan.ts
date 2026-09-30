import type { BodyProfile, Meal, MealPlan, WorkoutPlan } from "./body-types";

// The starting plan, written for 85 kg / 169 cm, beginning Sunday 4.10.2026. It is the default
// until the body coach (or Yakov) saves a changed version.
//
// Targets: ~1,950 kcal and ~140 g protein a day — a moderate deficit aiming at roughly 0.5 kg a
// week. Kosher: dairy breakfast, meat lunch, parve snack, dairy/fish dinner (lunch 12:45 → dinner
// 19:45 leaves the customary six hours between meat and dairy).

export const DEFAULT_BODY_PROFILE: BodyProfile = {
  height_cm: 169,
  start_weight: 85,
  start_date: "2026-09-30",
  goal_weight: 78,
  age: null,
  plan_start: "2026-10-04",
  calories: 1950,
  protein: 140,
};

const B1: Meal = {
  label: "ארוחת בוקר",
  time: "08:00",
  kind: "dairy",
  items: ["חביתה מ־2 ביצים + חלבון אחד", "2 פרוסות לחם מלא", "100 גרם קוטג׳ 5%", "סלט ירקות חופשי"],
  kcal: 480,
  protein: 38,
};
const B2: Meal = {
  label: "ארוחת בוקר",
  time: "08:00",
  kind: "dairy",
  items: ["יוגורט חלבון (20 גרם חלבון)", "40 גרם שיבולת שועל", "פרי (בננה או תפוח)", "כף שקדים או אגוזי מלך"],
  kcal: 450,
  protein: 30,
};
const B3: Meal = {
  label: "ארוחת בוקר",
  time: "08:00",
  kind: "dairy",
  items: ["2 פרוסות לחם מלא עם גבינה לבנה 5%", "2 ביצים קשות", "ירקות חתוכים"],
  kcal: 460,
  protein: 32,
};

const L1: Meal = {
  label: "ארוחת צהריים",
  time: "12:45",
  kind: "meat",
  items: ["180 גרם חזה עוף בגריל או במחבת", "כוס אורז מלא או בורגול (מבושל)", "סלט גדול עם כף שמן זית ולימון"],
  kcal: 650,
  protein: 50,
};
const L2: Meal = {
  label: "ארוחת צהריים",
  time: "12:45",
  kind: "meat",
  items: ["שניצל עוף אפוי בתנור (150 גרם)", "200 גרם בטטה אפויה", "ברוקולי או ירקות מאודים"],
  kcal: 620,
  protein: 42,
};
const L3: Meal = {
  label: "ארוחת צהריים",
  time: "12:45",
  kind: "meat",
  items: ["קציצות בקר רזה (150 גרם) ברוטב עגבניות", "חצי כוס קינואה או אורז מלא", "סלט ירקות"],
  kcal: 640,
  protein: 40,
};

const S1: Meal = { label: "ביניים", time: "16:30", kind: "parve", items: ["פרי", "20 גרם שקדים"], kcal: 230, protein: 5 };
const S2: Meal = { label: "ביניים", time: "16:30", kind: "parve", items: ["2 פריכיות אורז", "כף חמאת בוטנים טבעית", "מלפפון"], kcal: 240, protein: 7 };
const S3: Meal = { label: "ביניים", time: "16:30", kind: "parve", items: ["ירקות חתוכים", "3 כפות חומוס", "פרי"], kcal: 230, protein: 6 };

const D1: Meal = {
  label: "ארוחת ערב",
  time: "19:45",
  kind: "dairy",
  items: ["שקשוקה מ־2 ביצים", "50 גרם גבינה בולגרית 5%", "פרוסת לחם מלא", "סלט"],
  kcal: 500,
  protein: 30,
};
const D2: Meal = {
  label: "ארוחת ערב",
  time: "19:45",
  kind: "parve",
  items: ["150 גרם סלמון או אמנון בתנור", "ירקות אפויים (קישוא, פלפל, בצל)", "חצי כוס קינואה"],
  kcal: 520,
  protein: 35,
};
const D3: Meal = {
  label: "ארוחת ערב",
  time: "19:45",
  kind: "parve",
  items: ["סלט טונה במים (קופסה) עם ביצה קשה", "ירקות", "2 פריכיות או פרוסת לחם מלא"],
  kcal: 450,
  protein: 38,
};
const D4: Meal = {
  label: "ארוחת ערב",
  time: "19:45",
  kind: "dairy",
  items: ["טוסט מלא עם 2 פרוסות גבינה צהובה 9%", "100 גרם קוטג׳ 5%", "ירקות"],
  kcal: 500,
  protein: 36,
};

export const DEFAULT_MEAL_PLAN: MealPlan = {
  rules: [
    "2.5–3 ליטר מים ביום. בקבוק ליד העמדה.",
    "ירקות: בלי הגבלה, בכל ארוחה.",
    "שמן: כף אחת לארוחה. טחינה ואגוזים נמדדים בכף.",
    "חלבון קודם: מתחילים כל ארוחה מהחלבון והירקות.",
    "קפה ותה בלי סוכר (ממתיק או חלב דל שומן בסדר).",
    "מתוק: פעם בשבוע, בשבת, מנה אחת בנחת.",
    "אם יש רעב בערב: ירקות, מלפפון חמוץ, או יוגורט חלבון.",
  ],
  days: [
    { day: 0, meals: [B1, L1, S1, D1] },
    { day: 1, meals: [B2, L2, S2, D2] },
    { day: 2, meals: [B3, L3, S1, D3] },
    { day: 3, meals: [B1, L1, S3, D4] },
    { day: 4, meals: [B2, L2, S2, D2] },
    { day: 5, meals: [B3, { ...L3, label: "ארוחת צהריים קלה", items: ["קציצות בקר רזה (120 גרם)", "סלט גדול"], kcal: 420 }] },
  ],
  shabbat: [
    "שבת היא שבת: נהנים, בלי לספור.",
    "פותחים בסלטים ובחלבון, ורק אחר כך פחמימות.",
    "חלה: 1–2 פרוסות בסעודה.",
    "קינוח אחד בשבת, מנה אחת.",
    "שותים מים בין הסעודות.",
  ],
  shopping: [
    { title: "ביצים", qty: "30 (תבנית)", category: "חלבי וביצים" },
    { title: "קוטג׳ 5%", qty: "3", category: "חלבי וביצים" },
    { title: "גבינה לבנה 5%", qty: "2", category: "חלבי וביצים" },
    { title: "גבינה בולגרית 5%", qty: "1", category: "חלבי וביצים" },
    { title: "גבינה צהובה 9% פרוסות", qty: "1", category: "חלבי וביצים" },
    { title: "יוגורט חלבון", qty: "6", category: "חלבי וביצים" },
    { title: "חזה עוף", qty: "1 ק״ג", category: "בשר ודגים" },
    { title: "שניצל עוף (לא מטוגן)", qty: "600 גרם", category: "בשר ודגים" },
    { title: "בקר טחון רזה", qty: "600 גרם", category: "בשר ודגים" },
    { title: "פילה סלמון או אמנון", qty: "4 מנות (600 גרם)", category: "בשר ודגים" },
    { title: "טונה במים", qty: "4 קופסאות", category: "בשר ודגים" },
    { title: "לחם מלא או כוסמין פרוס", qty: "2", category: "פחמימות" },
    { title: "שיבולת שועל", qty: "1 שקית", category: "פחמימות" },
    { title: "אורז מלא", qty: "1 ק״ג", category: "פחמימות" },
    { title: "בורגול", qty: "500 גרם", category: "פחמימות" },
    { title: "קינואה", qty: "500 גרם", category: "פחמימות" },
    { title: "בטטות", qty: "1 ק״ג", category: "פחמימות" },
    { title: "פריכיות אורז", qty: "1 חבילה", category: "פחמימות" },
    { title: "מלפפונים", qty: "1.5 ק״ג", category: "ירקות" },
    { title: "עגבניות", qty: "1.5 ק״ג", category: "ירקות" },
    { title: "פלפלים", qty: "1 ק״ג", category: "ירקות" },
    { title: "חסה או עלים ירוקים", qty: "2", category: "ירקות" },
    { title: "בצל", qty: "1 ק״ג", category: "ירקות" },
    { title: "גזר", qty: "1 ק״ג", category: "ירקות" },
    { title: "קישואים", qty: "4", category: "ירקות" },
    { title: "ברוקולי קפוא", qty: "2 שקיות", category: "ירקות" },
    { title: "לימונים", qty: "4", category: "ירקות" },
    { title: "שום", qty: "1 ראש", category: "ירקות" },
    { title: "תפוחים", qty: "6", category: "פירות" },
    { title: "בננות", qty: "6", category: "פירות" },
    { title: "תפוזים או קלמנטינות", qty: "6", category: "פירות" },
    { title: "שקדים או אגוזי מלך", qty: "200 גרם", category: "מזווה" },
    { title: "חמאת בוטנים טבעית", qty: "1", category: "מזווה" },
    { title: "חומוס (ממרח)", qty: "1", category: "מזווה" },
    { title: "רוטב עגבניות או רסק", qty: "2", category: "מזווה" },
    { title: "שמן זית", qty: "אם נגמר", category: "מזווה" },
    { title: "תבלינים: פפריקה, כמון, כורכום", qty: "אם חסר", category: "מזווה" },
  ],
};

export const DEFAULT_WORKOUT_PLAN: WorkoutPlan = {
  workouts: [
    {
      key: "A",
      title: "אימון A: גוף מלא",
      minutes: 40,
      warmup: "5 דקות: הליכה במקום, סיבובי ידיים, כפיפות ירך.",
      exercises: [
        { name: "סקוואט לכיסא", sets: "3 × 10–12", note: "יושבים קלות ועולים. ברכיים בכיוון האצבעות." },
        { name: "שכיבות סמיכה על שולחן או קיר", sets: "3 × 8–12", note: "גוף ישר כמו קרש." },
        { name: "חתירה עם גומייה או משקולת", sets: "3 × 12", note: "מושכים את המרפק לאחור, כתפיים למטה." },
        { name: "גשר ישבן", sets: "3 × 15", note: "עוצרים שנייה למעלה." },
        { name: "פלאנק", sets: "3 × 20–30 שניות" },
      ],
      finisher: "10 דקות הליכה מהירה.",
    },
    {
      key: "B",
      title: "אימון B: גוף מלא",
      minutes: 40,
      warmup: "5 דקות: הליכה במקום, סיבובי כתפיים, מתיחות קלות.",
      exercises: [
        { name: "מכרעים לאחור", sets: "3 × 8 לכל רגל", note: "אפשר להחזיק בכיסא לאיזון." },
        { name: "לחיצת כתפיים עם משקולות או בקבוקי מים", sets: "3 × 10" },
        { name: "דדליפט רומני עם משקולות", sets: "3 × 12", note: "גב ישר, הישבן אחורה." },
        { name: "פלאנק צד", sets: "3 × 20 שניות לכל צד" },
        { name: "ציפור־כלב (Bird dog)", sets: "3 × 10 לכל צד" },
      ],
      finisher: "10 דקות הליכה מהירה.",
    },
  ],
  schedule: [
    { day: 0, time: "17:30", workout: "A" },
    { day: 1, time: "17:30", workout: null, activity: "הליכה מהירה", minutes: 30 },
    { day: 2, time: "17:30", workout: "B" },
    { day: 3, time: "17:30", workout: null, activity: "הליכה מהירה", minutes: 30 },
    { day: 4, time: "17:30", workout: "A" },
    { day: 5, time: "10:00", workout: null, activity: "הליכה קלה ומתיחות", minutes: 20 },
  ],
  steps: "7,000 צעדים ביום בשבועיים הראשונים, 8,500 בשבועות 3–4, ומשם 10,000.",
  progression: "כשמגיעים לחזרות המקסימליות בכל הסטים בטכניקה טובה, מוסיפים 2 חזרות או משקל קל. בכל שבוע שני הסדר מתחלף: B, A, B.",
};
