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
