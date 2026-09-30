import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { BetaToolRunnerParams } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { learningForDate, loadLearningGoal } from "./learning";
import { z } from "zod";
import type { LifeStore } from "./store";
import { loadDay } from "./service";
import { anchorConflict } from "./day";
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
מאמן הגוף כבר פעיל (תזונה, אימונים, שינה, רשימת קניות) ויש לו מסך משלו. get_day מחזיר גם את התפריט והפעילות של היום. בשאלות עומק על תזונה ואימונים, הפנה אותו למאמן הגוף.
בהמשך יצטרפו: מנהל העסק, מלווה רוחני, מאמן מנטלי ומנהל כספים. עד אז אתה מכסה את התחומים האלה ברמה בסיסית.

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

function contextLine() {
  const date = israelToday();
  const rest = restDayOf(date);
  return `[עכשיו: ${weekdayName(date)}, ${gregorianLabel(date)} (${date}), ${hebrewDateLabel(date)}, השעה ${israelNow()}. מחר: ${addDays(date, 1)}${rest ? `. היום ${rest.name}` : ""}]`;
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
      description: "יוצר משימה. priority: 1 חובה, 2 רצוי, 3 נחמד. אפשר לשבץ עם due_date ו־scheduled_time.",
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
      description: "מוסיף בלוק זמן ללו״ז. נדחה אם הוא חופף לעוגן או נופל בשבת או בחג.",
      inputSchema: newEventSchema,
      run: async (input) => {
        const rest = restDayOf(input.date);
        if (rest) return `שגיאה: ${input.date} הוא ${rest.name}. לא מתכננים בו.`;
        const conflict = anchorConflict(await store.getSettings(), input.start_time, input.end_time ?? null);
        if (conflict) return `שגיאה: חופף לעוגן "${conflict}". בחר זמן אחר.`;
        return json(await store.addEvent({ ...input, source: "chief" }));
      },
    }),
    betaZodTool({
      name: "remove_event",
      description: "מוחק בלוק זמן מהלו״ז לפי id.",
      inputSchema: z.object({ id: z.string() }),
      run: async ({ id }) => ((await store.deleteEvent(id)) ? "נמחק" : "שגיאה: אירוע לא נמצא"),
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
  chief: { system: CHIEF_PROMPT, tools: (s) => [...dayTools(s), ...checkinTools(s), ...shoppingTools(s), ...learningTools(s)] },
  body: { system: BODY_PROMPT, tools: (s) => [...bodyTools(s), ...checkinTools(s), ...shoppingTools(s), ...dayTools(s).slice(0, 1)] },
};

export class AgentNotConfiguredError extends Error {}

export function isAgentConnected() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function toParams(history: ChatMessage[], userText: string): Anthropic.Beta.BetaMessageParam[] {
  const firstUser = history.findIndex((m) => m.role === "user");
  const past = firstUser === -1 ? [] : history.slice(firstUser);
  return [
    ...past.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: `${contextLine()}\n${userText}` },
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
    messages: toParams(history, userText),
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
