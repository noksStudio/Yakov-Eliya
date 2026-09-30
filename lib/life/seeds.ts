import type { LifeStore } from "./store";
import { getIdeasStore, type IdeaStatus, type NewIdea } from "./ideas";

// Content told in chat that belongs in the user's own data (not in code defaults): each batch is
// applied once, then recorded in the "seeds" doc, so deleting an item later does not bring it back.

type SeedIdea = NewIdea & { status?: IdeaStatus; steps?: string[] };
type SeedBatch = { id: string; ideas?: SeedIdea[] };

const SEEDS: SeedBatch[] = [
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
  for (const batch of pending) {
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
