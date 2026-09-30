import type { LifeStore } from "./store";
import { getIdeasStore, type IdeaStatus, type NewIdea } from "./ideas";
import { addReminder } from "./reminders";
import { getLessonsStore } from "./lessons";
import type { Area } from "./types";
import { israelNow, israelToday, toMinutes } from "./time";

// Content told in chat that belongs in the user's own data (not in code defaults): each batch is
// applied once, then recorded in the "seeds" doc, so deleting an item later does not bring it back.

type SeedIdea = NewIdea & { status?: IdeaStatus; steps?: string[] };
type SeedReminder = { date: string; time: string; text: string };
type SeedLesson = { rule: string; story?: string; source?: "mine" | "others"; source_name?: string; area?: Area; triggers?: string[] };
type SeedBatch = { id: string; ideas?: SeedIdea[]; reminders?: SeedReminder[]; lessons?: SeedLesson[] };

const SEEDS: SeedBatch[] = [
  {
    id: "2026-09-30-trip-checklist",
    lessons: [
      {
        rule: "לפני טיול: אורזים בערב שלפני לפי רשימת הציוד, ומתאמים עם החברים מי מביא מה",
        story: "30.9 (חול המועד), טיול בפארק: אני, אשתי, אילן וחברים. חסרו בקבוק מים, קפה ועוד. הרשימה לפעם הבאה:\n\nשתייה ואוכל\n• בקבוק מים לכל אחד, ובקבוק עם פיה לאילן\n• ערכת קפה: גזייה, פינג׳אן, קפה, סוכר, כוסות (או תרמוס מוכן מהבית)\n• כריכים, פירות חתוכים וחטיפים, וחטיף שאילן אוהב\n• צידנית עם קרחונים\n• כלים חד־פעמיים, מפיות, שקית זבל\n• נטלה ומים לנטילת ידיים, אם אוכלים לחם\n\nלאילן\n• חיתולים, מגבונים ומשטח החתלה\n• בגדי החלפה ושכבה חמה לערב\n• כובע וקרם הגנה\n• צעצועים לחול או כדור\n• עגלה או מנשא\n\nישיבה וצל\n• מחצלת או שמיכת פיקניק, כיסאות מתקפלים\n• שמשייה או אוהל צל\n\nבטיחות ועוד\n• ערכת עזרה ראשונה: פלסטרים, חיטוי, תרופה להורדת חום לילדים\n• תכשיר נגד יתושים\n• סוללה ניידת לטלפון\n• שקיות לבגדים רטובים או מלוכלכים\n• סידור, אם הטיול נמשך עד מנחה\n\nלפני שיוצאים\n• לתאם עם החברים מי מביא מה, כדי שלא יחסר ולא יהיה כפול\n• לארוז בערב שלפני, לפי הרשימה",
        area: "home",
        // Only before outings, never in the daily rotation.
        triggers: ["טיול", "פארק", "פיקניק", "יציאה", "טבע", "חוף", "ים", "גן חיות", "גן החיות", "בריכה", "נופש"],
      },
    ],
  },
  {
    // Vermox for Ilan: first dose 30.9, second 10 days later, which is Shabbat (10.10), when
    // nothing is sent. So: Friday morning for tomorrow, and Sunday morning to check it was given.
    id: "2026-09-30-ilan-vermox",
    reminders: [
      { date: "2026-10-09", time: "08:00", text: "מחר בשבת: המנה השנייה של ורמוקס לאילן (10 ימים אחרי 30.9). להניח את התרופה במקום בולט כבר היום." },
      { date: "2026-10-11", time: "08:00", text: "אילן קיבל את המנה השנייה של ורמוקס בשבת? אם לא, לתת היום." },
    ],
  },
  {
    id: "2026-09-30-ilan-books",
    ideas: [
      {
        title: "ספרי לימוד עם AI לאילן",
        area: "home",
        notes: [
          "ספרים מאוירים שאילן הוא הגיבור שלהם, עם הדמות שלו באיורים, ולומדים דרך הסיפור.",
          "",
          "ספר ראשון: לומדים לספור. אילן עובר ממקום למקום ורואה דברים בכמויות:",
          "1. קם בבוקר, מסתכל מהחלון ורואה שמש גדולה: ״שמש, יש רק אחת כמוך!״",
          "2. שתי ציפורים על הגדר בדרך לגן",
          "3. שלוש מגלשות בגן",
          "4. ארבעה גלגלים לאוטו של אבא",
          "5. חמש אצבעות ביד שמנופפת לשלום",
          "… וכך עד 10, ובסוף לילה טוב עם הרבה כוכבים.",
          "",
          "מה צריך לחבר: כלי איורים ששומר על דמות קבועה של אילן (לפי תמונות שלו), כתיבת טקסט קצר ומחורז, עימוד, והדפסה לפי דרישה.",
          "בהמשך: צבעים, אותיות, רגשות, מצוות וחגים. ואולי גם מוצר דיגיטלי להורים אחרים.",
        ].join("\n"),
        steps: [
          "לכתוב טיוטה לספר הספירה (1 עד 10)",
          "לבחור כלי איורים ששומר על דמות קבועה, ולנסות עם תמונות של אילן",
          "לעצב 10 עמודים ולהדפיס עותק ניסיון",
          "להקריא לאילן ולראות מה הוא הכי אוהב",
        ],
      },
    ],
  },
  {
    id: "2026-09-30-wardrobe",
    ideas: [
      {
        title: "מלתחה מדויקת לטעם שלי",
        area: "general",
        notes: [
          "לשדרג את המלתחה בלי חולצות אוברסייז גנריות: בגדים שנבחרים או נתפרים בדיוק לטעם ולגוף שלי.",
          "",
          "עקרונות:",
          "• גזרה לפני מותג: כתפיים במקום, אורך חולצה שמתאים לגובה 1.69, מכנס מחויט שלא נשפך על הנעל.",
          "• מעט פריטים טובים שמתחברים זה לזה, בפלטת צבעים אחת.",
          "• לבסס את הסגנון על תמונות השראה ולא על מה שיש בחנות.",
          "",
          "תזמון: אני בירידה במשקל (מ־85 ל־78 ק״ג), אז עכשיו מגדירים סגנון ומזמינים פריט ניסיון, ואת ההזמנה הגדולה עושים קרוב ליעד. יעד טבעי: לפני יום ההולדת ה־30 ב־10.3.",
          "",
          "מה אפשר לחבר: כלי AI שמייצר הדמיות של פריט על הגוף שלי מתמונה, ותופר או מפעל קטן שתופר לפי מידות.",
        ].join("\n"),
        steps: [
          "לאסוף 15 עד 20 תמונות השראה של לוקים שאני אוהב, ולסמן מה משותף (גזרה, צבעים, בדים)",
          "להחליט על פלטת צבעים ו־3 פריטי בסיס להתחלה",
          "לקחת מידות אצל תופר (ולמדוד שוב קרוב ליעד המשקל)",
          "להזמין פריט ניסיון אחד לפני הזמנה גדולה",
          "הזמנה עיקרית לפני יום ההולדת ה־30",
        ],
      },
    ],
  },
];

export async function applySeeds(store: LifeStore) {
  const applied = (await store.getDoc<{ applied: string[] }>("seeds"))?.applied ?? [];
  const pending = SEEDS.filter((batch) => !applied.includes(batch.id));
  if (!pending.length) return;
  // Recorded before inserting, so two requests at once cannot both add the same items.
  await store.saveDoc("seeds", { applied: [...applied, ...pending.map((b) => b.id)] });
  const ideas = getIdeasStore();
  const today = israelToday();
  const now = toMinutes(israelNow());
  for (const batch of pending) {
    // A reminder whose time already passed (e.g. seeded after connecting late) is skipped, not
    // sent late all at once.
    for (const lesson of batch.lessons ?? []) await getLessonsStore().add(lesson);
    for (const r of batch.reminders ?? []) {
      if (r.date > today || (r.date === today && toMinutes(r.time) > now)) await addReminder(store, r);
    }
    for (const { status, steps, ...input } of batch.ideas ?? []) {
      const idea = await ideas.add(input);
      if (status || steps?.length) {
        await ideas.update(idea.id, {
          ...(status ? { status } : {}),
          ...(steps?.length ? { steps: steps.map((text) => ({ id: crypto.randomUUID(), text, done: false })) } : {}),
        });
      }
    }
  }
}
