import type { LifeStore } from "./store";
import { getIdeasStore, type IdeaStatus, type NewIdea } from "./ideas";
import { addReminder } from "./reminders";
import { setInviteText } from "./guests";
import { getLessonsStore } from "./lessons";
import type { Area } from "./types";
import { israelNow, israelToday, toMinutes } from "./time";

// Content told in chat that belongs in the user's own data (not in code defaults): each batch is
// applied once, then recorded in the "seeds" doc, so deleting an item later does not bring it back.

type SeedIdea = NewIdea & { status?: IdeaStatus; steps?: string[] };
type SeedReminder = { date: string; time: string; text: string };
type SeedLesson = { rule: string; story?: string; source?: "mine" | "others"; source_name?: string; area?: Area; triggers?: string[] };
type SeedTask = { title: string; due_date?: string; priority?: number; area?: Area };
/** An event with its prep tasks (linked by event_id) and, optionally, the invitation text for guests. */
type SeedEvent = { date: string; start_time: string; end_time?: string; title: string; area?: Area; tasks?: SeedTask[]; invite_text?: string };
/** More prep tasks for an event added earlier, found by its date and a word in its title. */
type SeedEventTasks = { date: string; titleIncludes: string; tasks: SeedTask[] };
type SeedBatch = {
  id: string;
  ideas?: SeedIdea[];
  reminders?: SeedReminder[];
  lessons?: SeedLesson[];
  events?: SeedEvent[];
  eventTasks?: SeedEventTasks[];
};

const SEEDS: SeedBatch[] = [
  {
    id: "2026-09-30-business-ideas",
    ideas: [
      {
        title: "MyMinyan: לוח מניינים ויצירת מניינים באזור",
        area: "business",
        notes: "שני חלקים באפליקציה אחת:\n1. לוח זמני תפילות של כל בתי הכנסת באזור, לפי מיקום ושעה (״מנחה בעוד 20 דקות, 400 מטר ממך״).\n2. ״אני פנוי למניין״: מסמנים תפילה, שעה ומקום משוער. כשמצטרפים 10, כולם מקבלים הודעה עם המקום. מתאים למשרדים, אזורי תעשייה, חופשות ונסיעות.\n\nמה צריך לחבר: מפה ומיקום (בלי לחשוף מיקום מדויק), זמני היום (שקיעה, זמן מנחה), התראות, ועדכון זמנים על ידי הגבאים או הקהילה.\nממה מרוויחים: חסות של עסקים ובתי כנסת, תרומות, וגרסה למתחמי משרדים.\nמתחרים לבדוק: GoDaven (זמני מניינים בעולם), קבוצות וואטסאפ מקומיות.\nסיכון: ביצה ותרנגולת. צריך מספיק אנשים באזור אחד כדי שיהיו מניינים.",
        steps: [
          "לבדוק את GoDaven ומה חסר בו בארץ",
          "MVP: בוט וואטסאפ או טלגרם למנחה באזור המשרדים שלי",
          "לגייס 30 אנשים ולבדוק כמה מניינים נוצרו בשבועיים",
          "להחליט אם להמשיך לאפליקציה",
        ],
      },
      {
        title: "FindMyPet: מציאת בעלי חיים ותג NFC חכם",
        area: "business",
        notes: "תג לקולר עם NFC ו־QR. סריקה בטלפון, בלי אפליקציה, פותחת כרטיס דיגיטלי של החיה: תמונה, שם, דרך ליצור קשר עם הבעלים (בלי לחשוף את הטלפון), חיסונים ומידע רפואי.\nמצב ״אבד״: כל סריקה שולחת לבעלים מיקום, ויש מפה של חיות שאבדו ונמצאו באזור, עם התראה לשכנים ברדיוס.\n\nממה מרוויחים: מכירת תגים (עלות של כ־5–10 ₪, מחיר מכירה 79–129 ₪), מנוי פרימיום (מעקב, תזכורות חיסונים), והפצה דרך וטרינרים וחנויות חיות.\nמה צריך לחבר: ספק תגי NFC (NTAG213) עם הדפסת QR, עמוד כרטיס דיגיטלי, התראות ומפה.\nיתרון: מוצר פיזי שאפשר למכור מהר, ומתאים לשיווק באינסטגרם.",
        steps: [
          "להזמין 20 תגי NFC לדוגמה",
          "לבנות עמוד כרטיס דיגיטלי ומצב ״אבד״",
          "לתת ל־10 בעלי כלבים לנסות ולשמוע מה חסר",
          "דף נחיתה ומכירה ראשונה, ולפנות ל־3 חנויות חיות",
        ],
      },
      {
        title: "HaircutNow: למלא לספרים את היומן, ותספורת מוזלת ללקוחות",
        area: "business",
        notes: "שוק של תורים פנויים: לספר יש חור ביומן היום ב־14:00, הוא מפרסם אותו בהנחה, ולקוחות קרובים מקבלים התראה ״תספורת ב־40% הנחה, היום ב־14:00, 600 מטר ממך״.\nלספר: הכנסה משעה שהייתה הולכת לאיבוד. ללקוח: מחיר טוב וזמינות מיידית.\n\nממה מרוויחים: עמלה לכל תור שהוזמן, או מנוי חודשי לספר.\nמה צריך לחבר: מערכות זימון התורים שהספרים כבר עובדים איתן, או יומן פשוט משלנו, תשלום באפליקציה, מיקום והתראות.\nסיכון: ביצה ותרנגולת. מתחילים בשכונה אחת עם 5–10 ספרים, ואז מביאים לקוחות מאינסטגרם וטיקטוק.\nמתאים לעסק שלי: אוטומציה ומערכות לעסקים קטנים.\nאותו מנוע משמש גם לקוסמטיקאיות (ראה הרעיון הבא).",
        steps: [
          "לדבר עם 5 ספרים: כמה שעות פנויות יש להם בשבוע, ואיזו הנחה הם מוכנים לתת",
          "MVP: דף אחד וקבוצת וואטסאפ של ״תורים פנויים היום״ בשכונה",
          "למדוד כמה תורים התמלאו בשבועיים",
          "לבדוק חיבור למערכות זימון התורים הנפוצות",
        ],
      },
      {
        title: "BeautyNow: אותו רעיון לקוסמטיקאיות",
        area: "business",
        notes: "אותו מנוע כמו HaircutNow: תורים פנויים בהנחה ללקוחות באזור, ובמותג נפרד לקוסמטיקאיות, מניקוריסטיות, גבות וכדומה.\n\nההבדל: טיפול יקר וארוך יותר, ולכן כל תור שמתמלא שווה יותר, והעמלה גבוהה יותר.\nקהל: בעיקר נשים, שיווק דרך אינסטגרם ומשפיעניות מקומיות.\n\nאסטרטגיה: לבנות פלטפורמה אחת עם שני מותגים, ולהתחיל בתחום שבו יש יותר זמן פנוי ביומן.",
        steps: [
          "לדבר עם 5 קוסמטיקאיות על זמן פנוי ומחירים",
          "להחליט באיזה תחום מתחילים, ספרים או קוסמטיקה",
        ],
      },
    ],
  },
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
  {
    // Lina (his sister) and Yair's wedding, from the invitation he sent.
    id: "2026-10-02-lina-wedding",
    events: [
      {
        date: "2026-10-19",
        start_time: "19:30",
        end_time: "23:30",
        title: "החתונה של לינה ויאיר · עין חמד (חופה 20:30)",
        area: "home",
        tasks: [{ title: "להזמין חברים לחתונה של לינה (19.10)", due_date: "2026-10-04", priority: 1 }],
        invite_text:
          "היי {שם}! 🎉\nאחותי לינה מתחתנת עם יאיר, ונשמח מאוד לראות אותך.\n📅 יום שני, 19.10 (ח׳ בחשוון)\n📍 גן אירועים עין חמד\n🕢 קבלת פנים 19:30 · חופה 20:30\nאפשר לעדכן אותי אם מגיעים? 🙏",
      },
    ],
    reminders: [
      { date: "2026-10-07", time: "19:00", text: "לוודא שהזמנתי את כל החברים לחתונה של לינה (19.10). לסמן מי מגיע בדף האירוע." },
      { date: "2026-10-15", time: "19:00", text: "החתונה של לינה ביום שני: לבדוק מי עוד לא ענה ולשלוח תזכורת." },
    ],
  },
  {
    // More prep for Lina's wedding (19.10). The barber opens bookings a week ahead at midnight,
    // so the slot for Sunday 18.10 opens on Saturday night 10.10 at 00:00.
    id: "2026-10-02-lina-wedding-prep",
    eventTasks: [
      {
        date: "2026-10-19",
        titleIncludes: "לינה",
        tasks: [
          { title: "בגדים לחתונה של לינה: לבדוק מה יש ומה לקנות", due_date: "2026-10-08", priority: 2 },
          { title: "אילן בחתונה: להחליט אם מגיע איתנו או בייביסיטר (ואם מגיע: בגדים ותיק לערב)", due_date: "2026-10-08", priority: 1 },
          { title: "לקבוע תספורת ליום ראשון 18.10 (התור נפתח במוצ״ש בחצות)", due_date: "2026-10-11", priority: 1 },
          { title: "להוציא מזומן למתנה לחתונה של לינה", due_date: "2026-10-15", priority: 2 },
          { title: "תספורת לפני החתונה", due_date: "2026-10-18", priority: 2 },
        ],
      },
    ],
    reminders: [
      { date: "2026-10-09", time: "12:00", text: "הלילה במוצ״ש בחצות נפתח התור לתספורת ליום ראשון 18.10, יום לפני החתונה של לינה. להיות ער ולקבוע." },
      { date: "2026-10-11", time: "00:00", text: "✂️ התור נפתח עכשיו: לקבוע תספורת ליום ראשון 18.10 (יום לפני החתונה של לינה)." },
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
    for (const { tasks, invite_text, ...input } of batch.events ?? []) {
      if (input.date < today) continue;
      const event = await store.addEvent({ ...input, end_time: input.end_time ?? null });
      for (const t of tasks ?? []) await store.addTask({ ...t, area: t.area ?? input.area, event_id: event.id });
      if (invite_text) await setInviteText(store, event.id, invite_text);
    }
    for (const { date, titleIncludes, tasks } of batch.eventTasks ?? []) {
      // If the event was deleted meanwhile, the tasks still come, just not linked to it.
      const event = (await store.listEvents(date)).find((e) => e.title.includes(titleIncludes));
      for (const t of tasks) await store.addTask({ ...t, area: t.area ?? event?.area, event_id: event?.id ?? null });
    }
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
