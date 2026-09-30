import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { BetaToolRunnerParams } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { learningForDate, loadLearningGoal } from "./learning";
import { loadMemory } from "./memory";
import { spiritSummary } from "./spirit";
import { mindSummary } from "./mind";
import { getJournalStore } from "./journal";
import { getOpsStore } from "./ops-store";
import { businessSummary } from "./business";
import { financeSummary, loadFinanceGoal } from "./finance";
import {
  ACTIVITY_LABELS,
  ACTIVITY_TARGETS,
  DEAL_STAGE_LABELS,
  activityPatchSchema,
  dealPatchSchema,
  financeEntrySchema,
  financeGoalSchema,
  newDealSchema,
} from "./ops-types";
import { z } from "zod";
import type { LifeStore } from "./store";
import { loadDay } from "./service";
import { anchorConflict } from "./day";
import { calendarRange, weekStart } from "./calendar";
import { getIdeasStore, newIdeaSchema } from "./ideas";
import {
  addGift,
  addSpecialDate,
  coupleProfileSchema,
  coupleSummary,
  giftPatchSchema,
  newGiftSchema,
  newSpecialDateSchema,
  occasionLabel,
  saveCoupleProfile,
  updateGift,
} from "./couple";
import { RecurringConflictError, WEEKDAY_LABELS, addRecurring, loadRecurring, newRecurringSchema, removeRecurring } from "./recurring";
import { bmi, bodyForDate, loadBodyPlan, weightSeries } from "./body";
import { bodyProfileSchema, mealPlanSchema, shoppingSeedSchema, workoutPlanSchema } from "./body-types";
import { checkinPatchSchema, dateSchema, newEventSchema, newTaskSchema, taskPatchSchema } from "./schemas";
import { addDays, gregorianLabel, hebrewDateLabel, israelNow, israelToday, restDayOf, weekdayName } from "./time";
import type { AgentId, ChatMessage } from "./types";

const MODEL = "claude-opus-5-5";
// Token budget: a short rolling history, low effort for routine turns (planning turns ask for
// more), and compact tool results that leave out nulls and data the question doesn't need.
const HISTORY_LIMIT = 10;
const MAX_ITERATIONS = 8;

// ---------------------------------------------------------------------------------------------
// System prompts. Stable across requests (no dates or per-user state) so they can be served from
// the prompt cache; the current date and time travel in each user message instead.

const SHARED = `## מי הוא
- יעקב-אליה, בעל עסק (Noks Studio): הטמעת AI, אוטומציות, מערכות CRM ואתרים לעסקים. נישה: יבואנים, מפיצים ולוגיסטיקה.
- שומר תורה ומצוות: 3 תפילות ביום ושעת התבודדות בלילה. אוכל כשר.
- יום הולדת: 10 במרץ (יהיה בן 30 ב־2027).
- יעד לימוד: לסיים את מסכת מגילה עד יום ההולדת. 3 מפגשים בשבוע (ראשון, שלישי, חמישי ב־08:30), עמוד אחד בכל מפגש.

## העוגנים (לא זזים לעולם)
קימה, שחרית, מנחה, ערבית, התבודדות ושינה. השעות המדויקות בהגדרות שמחזיר get_day.
לעולם אל תתכנן על עוגן, ובשבת ובחג לא מתכננים כלום. המערכת תדחה אירוע כזה.

## סגנון
- עברית, קצר וענייני, בנקודות. חם אבל ישיר, מחזק ובלי אשמה.
- אל תמציא נתונים. אם חסר מידע, שאל שאלה אחת.
- אחרי פעולה, אשר במשפט קצר מה עשית.
- תשובה של עד 6 שורות, אלא אם ביקשו פירוט. קרא רק את הכלים שהשאלה באמת צריכה.
- אם עולה מצוקה רגשית אמיתית, הגב ברגישות והמלץ לדבר עם אדם קרוב או איש מקצוע.
- תאריכים: YYYY-MM-DD. שעות: HH:MM. התאריך והשעה הנוכחיים מופיעים בתחילת כל הודעה של המשתמש.`;

const CHIEF_PROMPT = `אתה "המנהל הראשי" במערכת ההפעלה האישית של יעקב-אליה.
התפקיד שלך: להפוך את היעדים, ההרגלים והעבודה שלו ללו״ז ולמשימות מדויקים, כדי שיגיע לביצועי שיא מהשינה בלילה ועד הקימה בבוקר.

${SHARED}

## העסק
יעד: עסקאות של 30 אלף ₪ ומעלה. שגרת מכירות יומית בבלוק העבודה העמוקה: 20 בקשות חיבור בלינקדאין, 10 הודעות המשך, 10 שיחות או הודעות וואטסאפ.

## הצוות
פעילים, כל אחד עם מסך משלו: מאמן הגוף (תזונה, אימונים, שינה, קניות), מנהל העסק (עסקאות ופעילות מכירה יומית), מנהל הכספים (רווח ויעד חודשי), המלווה הרוחני (תפילות, התבודדות ולימוד), המאמן המנטלי (מצב רוח, אנרגיה, דחיינות ורפלקציה) והיועץ הזוגי (זוגיות, מתנות ותאריכים חשובים). get_day מחזיר גם את התפריט והפעילות של היום. בשאלות עומק, הפנה אותו לסוכן המתאים.

## שאלות פתוחות
בתחילת כל הודעה מופיעות "שאלות פתוחות" שעוד לא נענו. כשזה מתאים (לא באמצע משימה דחופה), שאל אחת מהן. כשיעקב עונה, שמור את התשובה עם remember ואז סגור את השאלה עם resolve_question.

## אירועים והכנות
כשיעקב מזכיר אירוע (אירוע משפחתי, חתונה, בר מצווה, פגישה חשובה), אל תרשום אותו מיד. שאל קודם, בהודעה אחת קצרה, עד 3 שאלות:
1. מתי ואיפה, אם זה לא נאמר (תאריך ושעה).
2. מה צריך להכין: הצע אפשרויות שמתאימות לאירוע, למשל בגדים, מתנה, להזמין חברים, הסעה, תספורת, לעזור בארגון.
3. יש עוד משהו שחשוב לו.
אחרי שענה: add_event (אם האירוע חופף לתפילה או להתבודדות, אמור לו ושאל אם לוותר עליהם באותו ערב או להקדים אותם), ואז add_task לכל הכנה שאישר, עם event_id של האירוע ו־due_date אחורה מהאירוע: הזמנות כ־10 ימים לפני, בגדים כשבוע לפני, מתנה ותספורת 2–3 ימים לפני. אף הכנה לא בשבת או בחג, ולא אחרי האירוע. אם האירוע קרוב מדי, דחוס את ההכנות לימים שנשארו. סכם בשורה אחת לכל הכנה עם התאריך.
צור רק מה שאישר. אל תוסיף הכנות שלא שאלת עליהן.

## רעיונות
כשיעקב כותב "רעיון: ..." או מספר על מערכת או מוצר שהוא רוצה לפתח, שמור עם save_idea (כותרת קצרה, והפרטים בהערות). אל תהפוך רעיון למשימה אלא אם ביקש.

## לו״ז שבועי
get_week מראה את השבוע. כשיעקב מספר על משהו שחוזר כל שבוע (שיעור, חוג, פגישה קבועה), שמור אותו עם add_recurring ולא כאירוע חד־פעמי. בתכנון שבוע, פזר את המשימות הגדולות על פני הימים ושמור על ימים עם אימון קלים יותר.

## תכנית בוקר
1. קרא את היום עם get_day. שים לב לצ׳ק־אין: שעות שינה, אנרגיה ומצב רוח.
2. בחר עד 3 משימות חשובות (priority 1). אם אין, הצע אותן ושאל לפני שאתה יוצר.
3. שבץ אותן בחלונות פנויים: update_task עם scheduled_time ו־due_date של היום, או add_event לבלוק זמן.
4. החזר תשובה קצרה: 3 המשימות עם שעות, האימון והארוחות העיקריות אם יש, דגש אחד ליום ומילה מחזקת.
אם האנרגיה או השינה נמוכות, הקל על היום והעדף את המשימה החשובה ביותר בלבד.

## סגירת יום
1. קרא את היום. סכם במשפט מה בוצע.
2. העבר משימות פתוחות למחר (update_task עם due_date של מחר), או שאל אם לוותר עליהן.
3. קבע את 3 המשימות של מחר.
4. תובנה אחת קצרה מהיום, בלי ביקורת עצמית.`;

const BUSINESS_PROMPT = `אתה "מנהל העסק" במערכת ההפעלה האישית של יעקב-אליה.
המטרה: להגדיל את ההכנסה החודשית מכ־8,000 ₪ ל־25,000 ₪, דרך עסקאות של 20–60 אלף ₪ ליבואנים, מפיצים ועסקי לוגיסטיקה.

${SHARED}

## ההצעה
מערכת מותאמת (הזמנות בוואטסאפ, מעקב לקוחות, הצעות מחיר), מחוברת למה שכבר יש ללקוח. מבנה עסקה: אבחון בתשלום, פיילוט או הטמעה, וליווי חודשי. בהצעת מחיר: 3 אפשרויות, המומלצת באמצע, תשלום לפי אבני דרך.

## שגרת מכירות יומית
20 בקשות חיבור בלינקדאין, 10 הודעות המשך, 10 שיחות או הודעות וואטסאפ. את המונים מעדכנים עם log_activity.

## איך אתה עובד
- get_business: העסקאות לפי שלב, שווי הצינור, פולואפים שהגיע זמנם, והפעילות של היום.
- כל עסקה חייבת צעד הבא ותאריך. אם חסר, שאל ועדכן עם update_deal.
- כשיעקב מספר על שיחה או פגישה: עדכן את השלב, את הצעד הבא ואת ההערות.
- בסוף שבוע: כמה פעילות, כמה שיחות הפכו לפגישות, ומה השלב הבא עם כל עסקה.
- שלבים: ${Object.entries(DEAL_STAGE_LABELS)
  .map(([k, v]) => `${k}=${v}`)
  .join(", ")}.`;

const FINANCE_PROMPT = `אתה "מנהל הכספים" במערכת ההפעלה האישית של יעקב-אליה.
המטרה: רווח עסקי של 25,000 ₪ בחודש (נקודת פתיחה: כ־8,000 ₪). המוצרים דיגיטליים, והרווחיות מעל 95% לפני תקציב שיווק.

${SHARED}

## איך אתה עובד
- get_finance: רווח מתחילת החודש, הכנסות, הוצאות, הוצאות שיווק, כמה צריך ביום כדי להגיע ליעד, וצפי לסוף החודש.
- כשיעקב מדווח על הכנסה או הוצאה, רשום עם add_entry (סכום בשקלים, קטגוריה, עסקי או פרטי). אם חסר פרט, שאל.
- רווח = הכנסות עסקיות פחות הוצאות עסקיות. שיווק נספר כהוצאה, ומוצג גם בנפרד.
- כשמשהו חריג (הוצאה גדולה, יום בלי הכנסה אחרי כמה ימים טובים), ציין בעדינות.
- אל תיתן ייעוץ השקעות או מס מחייב. לשאלות מס, המלץ על רואה חשבון.`;

const SPIRIT_PROMPT = `אתה "המלווה הרוחני" במערכת ההפעלה האישית של יעקב-אליה.
המטרה: קביעות ושמחה בעבודת ה׳: שלוש תפילות ביום, שעת התבודדות בלילה, ולימוד מסכת מגילה עד יום ההולדת.

${SHARED}

## איך אתה עובד
- get_spirit: שבעת הימים האחרונים (שחרית, מנחה, ערבית, התבודדות), רצפים, וההתקדמות בלימוד.
- כשיעקב מספר שהתפלל או התבודד, רשום עם update_checkin. אחרי מפגש לימוד, עדכן עם update_learning.
- מחזק קביעות בלי אשמה. יום שהתפספס הוא לא כישלון: חוזרים מחר, ואם אפשר משלימים היום.
- התבודדות: שיחה אישית עם השם במילים שלך, בשפה שלך, על כל מה שעל הלב. אפשר להציע נושאים או פתיחה כשקשה להתחיל, אבל לא מכתיבים.
- יומן ההתבודדות פרטי לגמרי. אין לך גישה אליו ואל תבקש לראות אותו.
- אתה לא פוסק הלכה. בשאלות הלכה, הפנה לרב.
- בשבת ובחג אין מעקב.`;

const MIND_PROMPT = `אתה "המאמן המנטלי" במערכת ההפעלה האישית של יעקב-אליה.
המטרה: אנרגיה, מיקוד ויציבות רגשית לאורך זמן, כבסיס לביצועי שיא.

${SHARED}

## איך אתה עובד
- get_mind: מגמות מצב רוח, אנרגיה, דירוג יום ושינה (ממוצע השבוע מול השבוע הקודם), ו־5 הרפלקציות האחרונות שלא סומנו כפרטיות.
- כלים עיקריים: לזהות דפוס (למשל: שינה קצרה, ואז מצב רוח נמוך), לפרק משימה שנדחית לצעד של 10 דקות, להחליף מחשבה מכבידה בניסוח מאוזן, ולשים לב למה שהלך טוב.
- שאל שאלה אחת טובה במקום להרצות. הצע תרגיל קצר אחד בכל פעם.
- save_reflection שומר רפלקציה קצרה כשיעקב משתף ורוצה לשמור.
- אתה לא מטפל ולא מאבחן. אם עולים סימני מצוקה ממשית (ייאוש מתמשך, מחשבות לפגוע בעצמו), הגב בחום, אמור בבירור שחשוב לדבר עם איש מקצוע, והזכר את ער״ן בטלפון 1201 (סיוע נפשי ראשוני, 24/7).`;

const COUPLE_PROMPT = `אתה "היועץ הזוגי" במערכת ההפעלה האישית של יעקב-אליה.
המטרה: זוגיות חמה, קרובה ויציבה עם אשתו, מתוך שלום בית ואהבה, גם כשהעסק והיעדים תובעניים.

${SHARED}

## איך אתה עובד
- get_couple: מה שידוע על אשתו (שם, יום הולדת, יום נישואין, מה היא אוהבת ומה לא, מידות, תקציב למתנות, מה גורם לה להרגיש אהובה), רשימת המתנות והתאריכים הקרובים.
- אם חסר פרט חשוב (שם, יום הולדת, יום נישואין, מה היא אוהבת), שאל עליו אחד בכל פעם, בטבעיות, ושמור עם save_couple_profile.
- כל מה שיעקב מספר עליה (משהו שאהבה, משהו שהזכירה שהיא רוצה, מידה) שמור מיד בפרופיל או כרעיון מתנה עם add_gift_idea. כך בעוד חודשיים יהיה רעיון מוכן.
- מחוות קטנות וקבועות חשובות יותר ממתנה גדולה פעם בשנה: מילה טובה, הודעה באמצע היום, עזרה בבית, זמן איכות בלי טלפון.
- דייט קבוע: הצע ערב זוגי קבוע בשבוע (add_recurring) ורעיון מתחלף לכל פעם. לא בשבת ובחג, אבל סעודת שבת רגועה ביחד היא זמן זוגי מצוין.
- מתנה: שאל לאיזו הזדמנות ומה התקציב אם לא ידוע, ואז הצע 3 רעיונות שמתאימים למה שהיא אוהבת: אחד פשוט, אחד מושקע, ואחד חוויה. מה שיעקב בוחר נשמר עם add_gift_idea, ואם צריך לקנות, צור משימה עם תאריך (add_task).
- יום הולדת או יום נישואין: כמו כל אירוע, שאל קודם עד 3 שאלות (מה היא הייתה שמחה לעשות, מתנה, הפתעה או ארוחה, צריך בייביסיטר?), ורק אחרי זה צור אירוע ומשימות הכנה עם event_id ותאריכים אחורה מהיום עצמו.
- בוויכוח או במתח: הקשב, עזור לו לראות את הצד שלה, והצע משפט פתיחה רך לשיחה. בלי להאשים אף צד.
- אתה לא מטפל זוגי. אם עולה משבר מתמשך, עזור בעדינות לשקול פנייה לייעוץ זוגי מקצועי.
- פרטיות: מה שנאמר כאן נשאר בין יעקב לבינך. אל תכתוב פרטים אישיים עליה בזיכרון המשותף (remember).`;

const BODY_PROMPT = `אתה "מאמן הגוף" במערכת ההפעלה האישית של יעקב-אליה: כושר, תזונה, שינה והרגלים.
המטרה: ירידה הדרגתית ובריאה במשקל, יותר כוח ואנרגיה, ושגרה שמחזיקה לאורך זמן.

${SHARED}

## הנתונים
get_body מחזיר סיכום: הפרופיל (גובה, משקל התחלתי, יעד, יעדי קלוריות וחלבון, תאריך התחלת התוכנית), המשקל הנוכחי, 14 השקילות האחרונות והתוכנית של היום. את התפריט המלא ואת תוכנית האימונים המלאה קוראים רק כשצריך, עם get_meal_plan ו־get_workout_plan.

## עקרונות
- ירידה של 0.5 עד 1 ק״ג בשבוע, לא יותר. בלי דיאטות כאסח ובלי לרדת מתחת ל־1,500 קלוריות בלי ליווי מקצועי.
- חלבון בכל ארוחה, ירקות בלי הגבלה, 2.5–3 ליטר מים.
- 3 אימוני כוח בשבוע לגוף מלא, הליכות בימים שביניהם, ויעד צעדים שעולה בהדרגה.
- שינה של 7.5–8 שעות היא חלק מהתוכנית, לא מותרות.
- מגמה חשובה יותר ממספר ביום אחד. בודקים ממוצע שבועי.

## כשרות ושבת
- לעולם לא מערבבים בשר וחלב באותה ארוחה.
- אחרי ארוחה בשרית, הביניים פרווה. ארוחה חלבית רק כעבור 6 שעות לפחות מארוחה בשרית (אם אינך בטוח במנהג שלו, שאל).
- בשבת ובחג: אין מעקב ואין אימונים, רק הנחיות כלליות לסעודות.

## עריכת התוכניות
- save_meal_plan ו־save_workout_plan מחליפים את התוכנית כולה. קרא את הגרסה הנוכחית (get_meal_plan או get_workout_plan), שנה רק את מה שצריך, ושמור את התוכנית המלאה.
- כשהתפריט משתנה, עדכן גם את רשימת הקניות שבתוך התוכנית (shopping).
- add_shopping_items מוסיף פריטים לרשימת הקניות הפעילה באפליקציה.
- כשהוא מדווח על משקל, רשום אותו עם update_checkin בתאריך של היום.

## בטיחות
אתה לא רופא ולא דיאטן קליני. כאב בחזה, סחרחורת, כאב חד במפרקים, מחלה כרונית או תרופות קבועות: עצור והמלץ להתייעץ עם רופא או דיאטן.`;

// ---------------------------------------------------------------------------------------------

async function contextLine(store: LifeStore, agent: AgentId) {
  const date = israelToday();
  const rest = restDayOf(date);
  const memory = await loadMemory(store);
  const facts = memory.facts.length ? `\nמה ידוע עליו: ${memory.facts.join(" | ")}` : "";
  const questions =
    agent === "chief" && memory.open_questions.length
      ? `\nשאלות פתוחות: ${memory.open_questions.map((q, i) => `(${i}) ${q}`).join(" ")}`
      : "";
  return `[עכשיו: ${weekdayName(date)}, ${gregorianLabel(date)} (${date}), ${hebrewDateLabel(date)}, השעה ${israelNow()}. מחר: ${addDays(date, 1)}${rest ? `. היום ${rest.name}` : ""}${facts}${questions}]`;
}

/** JSON without null/undefined fields, so tool results cost fewer tokens. */
const json = (value: unknown) => JSON.stringify(value, (_key, v) => (v === null || v === undefined ? undefined : v));

function dayTools(store: LifeStore) {
  return [
    betaZodTool({
      name: "get_day",
      description:
        "קורא יום: ציר הזמן (עוגנים, שגרה, אימון, אירועים ומשימות משובצות), משימות פתוחות, מספר המשימות שהושלמו, הצ׳ק־אין והתפריט של היום. ברירת מחדל: היום.",
      inputSchema: z.object({ date: dateSchema.optional() }),
      run: async ({ date }) => {
        const day = await loadDay(store, date ?? israelToday());
        return json({
          date: day.date,
          weekday: day.weekday,
          restDay: day.restDay,
          timeline: day.timeline.map(({ id, start, end, title, kind, done }) => ({ id, start, end, title, kind, done: done || undefined })),
          openTasks: day.openTasks.map(({ id, title, area, priority, due_date, scheduled_time }) => ({
            id,
            title,
            area,
            priority,
            due_date,
            scheduled_time,
          })),
          doneToday: day.doneToday.length,
          checkin: day.checkin && { ...day.checkin, date: undefined, updated_at: undefined },
          learning: day.learning.finished
            ? "המסכת הושלמה"
            : { next: day.learning.next, done: day.learning.done, total: day.learning.total, neededPerWeek: day.learning.neededPerWeek },
          body: day.body.daysToStart
            ? { planStartsIn: day.body.daysToStart }
            : { meals: day.body.meals.map((m) => `${m.time} ${m.label}`), activity: day.body.activity?.title },
        });
      },
    }),
    betaZodTool({
      name: "add_task",
      description: "יוצר משימה. priority: 1 חובה, 2 רצוי, 3 נחמד. אפשר לשבץ עם due_date ו־scheduled_time. משימת הכנה לאירוע: event_id של האירוע.",
      inputSchema: newTaskSchema,
      run: async (input) => json(await store.addTask({ ...input, source: "chief" })),
    }),
    betaZodTool({
      name: "update_task",
      description: "מעדכן משימה לפי id: סימון בוצע (done), עדיפות, תאריך, שעה או כותרת.",
      inputSchema: taskPatchSchema.extend({ id: z.string() }),
      run: async ({ id, ...patch }) => {
        const task = await store.updateTask(id, patch);
        return task ? json(task) : "שגיאה: משימה לא נמצאה";
      },
    }),
    betaZodTool({
      name: "add_event",
      description:
        "מוסיף בלוק זמן ללו״ז. נדחה בשבת ובחג. נדחה אם חופף לעוגן, אלא אם override_anchor: רק לאירוע חשוב שנקבע מבחוץ (אירוע משפחתי), ורק אחרי שיעקב אישר במפורש לוותר על העוגן באותו יום.",
      inputSchema: newEventSchema.extend({ override_anchor: z.boolean().optional() }),
      run: async ({ override_anchor, ...input }) => {
        const rest = restDayOf(input.date);
        if (rest) return `שגיאה: ${input.date} הוא ${rest.name}. לא מתכננים בו.`;
        const conflict = anchorConflict(await store.getSettings(), input.start_time, input.end_time ?? null);
        if (conflict && !override_anchor) return `שגיאה: חופף לעוגן "${conflict}". בחר זמן אחר, או שאל את יעקב אם לוותר על העוגן באותו יום.`;
        return json(await store.addEvent({ ...input, source: "chief" }));
      },
    }),
    betaZodTool({
      name: "remove_event",
      description: "מוחק בלוק זמן מהלו״ז לפי id.",
      inputSchema: z.object({ id: z.string() }),
      run: async ({ id }) => ((await store.deleteEvent(id)) ? "נמחק" : "שגיאה: אירוע לא נמצא"),
    }),
    betaZodTool({
      name: "get_week",
      description:
        "קורא שבוע (ראשון עד שבת) בלי העוגנים הקבועים: אירועים, התחייבויות קבועות, אימונים, לימוד, משימות עם תאריך ופולואפים, וגם רשימת ההתחייבויות הקבועות. ברירת מחדל: השבוע הנוכחי.",
      inputSchema: z.object({ date: dateSchema.optional().describe("יום כלשהו בשבוע המבוקש") }),
      run: async ({ date }) => {
        const from = weekStart(date ?? israelToday());
        const [cal, recurring] = await Promise.all([calendarRange(store, getOpsStore(), from, addDays(from, 6)), loadRecurring(store)]);
        return json({
          days: cal.days.map((d) => ({
            date: d.date,
            rest: d.rest?.name,
            items: d.items.map(({ kind, time, end, title, id, done, prep }) => ({ kind, time, end, title, id, done: done || undefined, prep })),
          })),
          summary: cal.summary,
          recurring: recurring.map((r) => ({ id: r.id, day: WEEKDAY_LABELS[r.weekday], start: r.start_time, end: r.end_time, title: r.title })),
        });
      },
    }),
    betaZodTool({
      name: "add_recurring",
      description: "מוסיף התחייבות קבועה שחוזרת כל שבוע (weekday: 0 ראשון עד 5 שישי). נדחה אם חופף לעוגן.",
      inputSchema: newRecurringSchema,
      run: async (input) => {
        try {
          return json(await addRecurring(store, input));
        } catch (error) {
          if (error instanceof RecurringConflictError) return `שגיאה: ${error.message}`;
          throw error;
        }
      },
    }),
    betaZodTool({
      name: "remove_recurring",
      description: "מוחק התחייבות קבועה לפי id.",
      inputSchema: z.object({ id: z.string() }),
      run: async ({ id }) => ((await removeRecurring(store, id)) ? "נמחק" : "שגיאה: לא נמצא"),
    }),
  ];
}

/** Selects tools by name, so agents can share a subset without depending on array order. */
function pick<T extends { name: string }>(tools: T[], names: string[]) {
  return tools.filter((t) => names.includes(t.name));
}

function coupleTools(store: LifeStore) {
  return [
    betaZodTool({
      name: "get_couple",
      description: "הפרופיל של אשתו, רשימת רעיונות המתנה והתאריכים החשובים הקרובים (עם כמה ימים נשארו).",
      inputSchema: z.object({}),
      run: async () => {
        const summary = await coupleSummary(store);
        const missing = (["partner_name", "birthday", "anniversary"] as const).filter((k) => !summary.profile[k]);
        return json({
          profile: summary.profile,
          missing: [...missing, ...(summary.profile.likes.length ? [] : ["likes"])],
          gifts: summary.gifts.map(({ id, title, occasion, price, status }) => ({ id, title, occasion, price, status })),
          upcoming: summary.upcoming.slice(0, 6).map((o) => ({ title: occasionLabel(o), date: o.date, daysLeft: o.daysLeft })),
          dates: summary.dates,
        });
      },
    }),
    betaZodTool({
      name: "save_couple_profile",
      description: "מעדכן פרטים בפרופיל של אשתו. likes/dislikes מחליפים את הרשימה כולה, אז שלח את הרשימה המלאה (הקיימת ועוד החדש).",
      inputSchema: coupleProfileSchema.partial(),
      run: async (patch) => json(await saveCoupleProfile(store, patch)),
    }),
    betaZodTool({
      name: "add_gift_idea",
      description: "שומר רעיון למתנה (כותרת, הזדמנות, מחיר משוער, קישור).",
      inputSchema: newGiftSchema,
      run: async (input) => json(await addGift(store, input)),
    }),
    betaZodTool({
      name: "update_gift",
      description: "מעדכן מתנה לפי id, למשל status: bought (נקנתה) או given (ניתנה).",
      inputSchema: giftPatchSchema.extend({ id: z.string() }),
      run: async ({ id, ...patch }) => {
        const gift = await updateGift(store, id, patch);
        return gift ? json(gift) : "שגיאה: לא נמצא";
      },
    }),
    betaZodTool({
      name: "add_special_date",
      description: "מוסיף תאריך חשוב (למשל יום ההולדת של חמותו, הפגישה הראשונה). yearly: חוזר כל שנה.",
      inputSchema: newSpecialDateSchema,
      run: async (input) => json(await addSpecialDate(store, input)),
    }),
  ];
}

function ideaTools() {
  return [
    betaZodTool({
      name: "save_idea",
      description: "שומר רעיון במסך הרעיונות: כותרת קצרה, ובהערות הפרטים (מה לחבר, איזה API, למי זה מיועד). area ברירת מחדל: business.",
      inputSchema: newIdeaSchema,
      run: async (input) => {
        const idea = await getIdeasStore().add(input);
        return json({ id: idea.id, title: idea.title });
      },
    }),
  ];
}

function learningTools(store: LifeStore) {
  return [
    betaZodTool({
      name: "update_learning",
      description: "מעדכן את מונה הלימוד במסכת: delta = כמה עמודים נוספו (למשל 1 אחרי מפגש, או -1 לביטול).",
      inputSchema: z.object({ delta: z.number().int().min(-10).max(10) }),
      run: async ({ delta }) => {
        const goal = await loadLearningGoal(store);
        const next = { ...goal, done: Math.min(goal.total, Math.max(0, goal.done + delta)) };
        await store.saveDoc("learning_goal", next);
        const today = learningForDate(next, israelToday());
        return json({ done: today.done, total: today.total, next: today.next, neededPerWeek: today.neededPerWeek });
      },
    }),
  ];
}

function memoryTools(store: LifeStore) {
  return [
    betaZodTool({
      name: "remember",
      description: "שומר עובדה קבועה על יעקב שכל הסוכנים יראו (למשל: מתפלל מנחה ב־13:30, שיעור ביום שני ב־20:00).",
      inputSchema: z.object({ fact: z.string().min(3).max(300) }),
      run: async ({ fact }) => {
        const memory = await loadMemory(store);
        await store.saveDoc("memory", { ...memory, facts: [...memory.facts, fact].slice(-200) });
        return "נשמר";
      },
    }),
    betaZodTool({
      name: "resolve_question",
      description: "מסיר שאלה פתוחה שנענתה, לפי המספר שלה ברשימה.",
      inputSchema: z.object({ index: z.number().int().min(0).max(49) }),
      run: async ({ index }) => {
        const memory = await loadMemory(store);
        if (!memory.open_questions[index]) return "שגיאה: אין שאלה כזו";
        await store.saveDoc("memory", { ...memory, open_questions: memory.open_questions.filter((_, i) => i !== index) });
        return "השאלה סומנה כנענתה";
      },
    }),
  ];
}

function businessTools() {
  const ops = getOpsStore();
  return [
    betaZodTool({
      name: "get_business",
      description: "העסקאות (עם id, שלב, שווי, צעד הבא ותאריך), שווי הצינור הפתוח, פולואפים שהגיע זמנם ופעילות המכירה של היום מול היעד.",
      inputSchema: z.object({}),
      run: async () => {
        const b = await businessSummary(ops);
        return json({
          deals: b.deals.map(({ id, name, stage, value, next_action, next_date, contact }) => ({ id, name, stage, value, next_action, next_date, contact })),
          openValue: b.openValue,
          due: b.due.map((d) => d.name),
          activity: b.activity,
          targets: ACTIVITY_TARGETS,
        });
      },
    }),
    betaZodTool({
      name: "add_deal",
      description: "מוסיף עסקה או ליד חדש.",
      inputSchema: newDealSchema,
      run: async (input) => json(await ops.addDeal(input)),
    }),
    betaZodTool({
      name: "update_deal",
      description: "מעדכן עסקה לפי id: שלב, שווי, צעד הבא, תאריך, הערות.",
      inputSchema: dealPatchSchema.extend({ id: z.string() }),
      run: async ({ id, ...patch }) => {
        const deal = await ops.updateDeal(id, patch);
        return deal ? json(deal) : "שגיאה: עסקה לא נמצאה";
      },
    }),
    betaZodTool({
      name: "log_activity",
      description: `מוסיף לפעילות המכירה של היום: ${Object.entries(ACTIVITY_LABELS)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}. מספר שלילי מתקן.`,
      inputSchema: activityPatchSchema,
      run: async (deltas) => json(await ops.bumpActivity(israelToday(), deltas)),
    }),
  ];
}

function financeTools(store: LifeStore) {
  const ops = getOpsStore();
  return [
    betaZodTool({
      name: "get_finance",
      description: "סיכום החודש: רווח, הכנסות, הוצאות, שיווק, רווח היום, כמה צריך ביום ליעד, צפי, ו־10 התנועות האחרונות.",
      inputSchema: z.object({}),
      run: async () => {
        const f = await financeSummary(store, ops);
        return json({ ...f, cumulative: undefined, entries: f.entries.slice(0, 10) });
      },
    }),
    betaZodTool({
      name: "add_entry",
      description: "רושם הכנסה או הוצאה. kind: income/expense. scope: business (ברירת מחדל) או personal. קטגוריות הכנסה: מכירה, ריטיינר, אחר. הוצאה: שיווק, תוכנות וכלים, קבלני משנה, אחר.",
      inputSchema: financeEntrySchema,
      run: async (input) => json(await ops.addFinance(input)),
    }),
    betaZodTool({
      name: "set_finance_goal",
      description: "מעדכן את יעד הרווח החודשי.",
      inputSchema: financeGoalSchema.partial(),
      run: async (patch) => json(await store.saveDoc("finance_goal", financeGoalSchema.parse({ ...(await loadFinanceGoal(store)), ...patch }))),
    }),
  ];
}

function spiritTools(store: LifeStore) {
  return [
    betaZodTool({
      name: "get_spirit",
      description: "שבעת הימים האחרונים (תפילות והתבודדות), רצפים, מספר התפילות השבוע וההתקדמות בלימוד. בלי יומן ההתבודדות, שהוא פרטי.",
      inputSchema: z.object({}),
      run: async () => json(await spiritSummary(store)),
    }),
  ];
}

function mindTools(store: LifeStore) {
  const journal = getJournalStore();
  return [
    betaZodTool({
      name: "get_mind",
      description: "מגמות מצב רוח ואנרגיה (30 יום), ממוצעי השבוע מול השבוע הקודם, ו־5 הרפלקציות האחרונות שאינן פרטיות.",
      inputSchema: z.object({}),
      run: async () => {
        const summary = await mindSummary(store);
        // Private reflections (and the hitbodedut journal, a different kind) never reach the model.
        const reflections = (await journal.list("reflection", 15)).filter((e) => !e.private).slice(0, 5);
        return json({ ...summary, reflections: reflections.map((r) => ({ date: r.date, text: r.text })) });
      },
    }),
    betaZodTool({
      name: "save_reflection",
      description: "שומר רפלקציה קצרה ביומן הרפלקציות (לא פרטי).",
      inputSchema: z.object({ text: z.string().min(1).max(2000) }),
      run: async ({ text }) => {
        await journal.add({ date: israelToday(), kind: "reflection", text, private: false });
        return "נשמר";
      },
    }),
  ];
}

function checkinTools(store: LifeStore) {
  return [
    betaZodTool({
      name: "get_checkins",
      description: "צ׳ק־אינים של הימים האחרונים (שינה, משקל, אנרגיה, מצב רוח, תפילות, התבודדות, אימון, דירוג יום), לזיהוי מגמות.",
      inputSchema: z.object({ days: z.number().int().min(1).max(30) }),
      run: async ({ days }) => {
        const today = israelToday();
        return json(await store.listCheckins(addDays(today, -(days - 1)), today));
      },
    }),
    betaZodTool({
      name: "update_checkin",
      description: "רושם נתונים בצ׳ק־אין של יום, כשיעקב מספר עליהם בשיחה (למשל: ישנתי 7 שעות, שקלתי 84.2, התאמנתי, התפללתי מנחה).",
      inputSchema: z.object({ date: dateSchema, patch: checkinPatchSchema }),
      run: async ({ date, patch }) => json(await store.saveCheckin(date, patch)),
    }),
  ];
}

function shoppingTools(store: LifeStore) {
  return [
    betaZodTool({
      name: "list_shopping",
      description: "רשימת הקניות הפעילה (checked = כבר נקנה).",
      inputSchema: z.object({}),
      run: async () => json(await store.listShopping()),
    }),
    betaZodTool({
      name: "add_shopping_items",
      description: "מוסיף פריטים לרשימת הקניות. פריט שכבר ברשימה ולא נקנה לא יתווסף פעמיים.",
      inputSchema: z.object({ items: z.array(shoppingSeedSchema).min(1).max(80) }),
      run: async ({ items }) => json({ added: (await store.addShopping(items)).map((i) => i.title) }),
    }),
  ];
}

function bodyTools(store: LifeStore) {
  return [
    betaZodTool({
      name: "get_body",
      description: "סיכום: פרופיל, משקל נוכחי ו־BMI, 14 השקילות האחרונות והתוכנית של היום.",
      inputSchema: z.object({}),
      run: async () => {
        const plan = await loadBodyPlan(store);
        const weights = await weightSeries(store, plan.profile);
        const current = weights.at(-1)?.weight ?? plan.profile.start_weight;
        const today = bodyForDate(plan, israelToday());
        return json({
          profile: plan.profile,
          current,
          bmi: bmi(current, plan.profile.height_cm),
          weights: weights.slice(-14),
          today: {
            planStartsIn: today.daysToStart || undefined,
            meals: today.meals.map((m) => `${m.time} ${m.label}: ${m.items.join(", ")}`),
            activity: today.activity?.title,
          },
        });
      },
    }),
    betaZodTool({
      name: "get_meal_plan",
      description: "התפריט השבועי המלא (כללים, ימים 0–5, שבת ורשימת קניות). לקרוא רק לפני שינוי או כשנשאלים על יום מסוים.",
      inputSchema: z.object({}),
      run: async () => json((await loadBodyPlan(store)).meals),
    }),
    betaZodTool({
      name: "get_workout_plan",
      description: "תוכנית האימונים המלאה. לקרוא רק לפני שינוי או כשנשאלים על אימון מסוים.",
      inputSchema: z.object({}),
      run: async () => json((await loadBodyPlan(store)).workouts),
    }),
    betaZodTool({
      name: "save_body_profile",
      description: "מעדכן שדות בפרופיל: גיל, יעד משקל, יעדי קלוריות וחלבון, תאריך התחלת התוכנית.",
      inputSchema: bodyProfileSchema.partial(),
      run: async (patch) => {
        const { profile } = await loadBodyPlan(store);
        return json(await store.saveDoc("body_profile", bodyProfileSchema.parse({ ...profile, ...patch })));
      },
    }),
    betaZodTool({
      name: "save_meal_plan",
      description: "שומר תפריט שבועי מלא (מחליף את הקודם): כללים, ימים 0–5 עם ארוחות, הנחיות לשבת ורשימת קניות שבועית.",
      inputSchema: mealPlanSchema,
      run: async (plan) => {
        await store.saveDoc("meal_plan", plan);
        return "התפריט נשמר";
      },
    }),
    betaZodTool({
      name: "save_workout_plan",
      description: "שומר תוכנית אימונים מלאה (מחליפה את הקודמת): אימונים, לו״ז שבועי לימים 0–5, יעד צעדים והתקדמות.",
      inputSchema: workoutPlanSchema,
      run: async (plan) => {
        const keys = new Set(plan.workouts.map((w) => w.key));
        const missing = plan.schedule.find((s) => s.workout && !keys.has(s.workout));
        if (missing) return `שגיאה: היום ${missing.day} מפנה לאימון "${missing.workout}" שלא קיים.`;
        await store.saveDoc("workout_plan", plan);
        return "תוכנית האימונים נשמרה";
      },
    }),
  ];
}

const AGENT_CONFIG: Record<AgentId, { system: string; tools: (store: LifeStore) => BetaToolRunnerParams["tools"] }> = {
  chief: {
    system: CHIEF_PROMPT,
    tools: (s) => [...dayTools(s), ...checkinTools(s), ...shoppingTools(s), ...learningTools(s), ...memoryTools(s), ...ideaTools()],
  },
  body: { system: BODY_PROMPT, tools: (s) => [...bodyTools(s), ...checkinTools(s), ...shoppingTools(s), ...dayTools(s).slice(0, 1), ...memoryTools(s).slice(0, 1)] },
  business: { system: BUSINESS_PROMPT, tools: (s) => [...businessTools(), ...dayTools(s).slice(1, 3), ...memoryTools(s).slice(0, 1)] },
  finance: { system: FINANCE_PROMPT, tools: (s) => [...financeTools(s), ...memoryTools(s).slice(0, 1)] },
  spirit: {
    system: SPIRIT_PROMPT,
    tools: (s) => [...spiritTools(s), ...checkinTools(s).slice(1), ...learningTools(s), ...memoryTools(s).slice(0, 1)],
  },
  mind: { system: MIND_PROMPT, tools: (s) => [...mindTools(s), ...checkinTools(s), ...memoryTools(s).slice(0, 1)] },
  couple: {
    system: COUPLE_PROMPT,
    tools: (s) => [...coupleTools(s), ...pick(dayTools(s), ["add_task", "update_task", "add_event", "get_week", "add_recurring"])],
  },
};

export class AgentNotConfiguredError extends Error {}

export function isAgentConnected() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function toParams(history: ChatMessage[], context: string, userText: string): Anthropic.Beta.BetaMessageParam[] {
  const firstUser = history.findIndex((m) => m.role === "user");
  const past = firstUser === -1 ? [] : history.slice(firstUser);
  return [
    ...past.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: `${context}\n${userText}` },
  ];
}

/** Sends one message to an agent and returns its reply (its tools may change the day or plans). */
/** `deep`: a planning turn (morning plan, day close, plan changes) that gets more thinking. */
export async function askAgent(store: LifeStore, agent: AgentId, userText: string, deep = false): Promise<string> {
  if (!isAgentConnected()) {
    throw new AgentNotConfiguredError("הסוכנים עוד לא מחוברים: חסר מפתח API של Anthropic (ANTHROPIC_API_KEY).");
  }
  const config = AGENT_CONFIG[agent];
  const client = new Anthropic();
  const history = await store.listMessages(agent, HISTORY_LIMIT);

  const final = await client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: deep ? "medium" : "low" },
    system: [{ type: "text", text: config.system, cache_control: { type: "ephemeral" } }],
    tools: config.tools(store),
    messages: toParams(history, await contextLine(store, agent), userText),
    max_iterations: MAX_ITERATIONS,
  });

  if (final.stop_reason === "refusal") {
    return "לא יכולתי לענות על זה. נסה לנסח אחרת.";
  }
  const text = final.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  return text || "בוצע.";
}
