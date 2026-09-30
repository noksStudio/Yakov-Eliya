import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { LifeStore } from "./store";
import { loadDay } from "./service";
import { anchorConflict } from "./day";
import { checkinPatchSchema, dateSchema, newEventSchema, newTaskSchema, taskPatchSchema } from "./schemas";
import { addDays, gregorianLabel, hebrewDateLabel, israelNow, israelToday, restDayOf, weekdayName } from "./time";
import type { ChatMessage } from "./types";

const MODEL = "claude-opus-5-5";
const HISTORY_LIMIT = 24;

// Stable across requests (no dates or per-user state) so it can be served from the prompt cache.
const SYSTEM_PROMPT = `אתה "המנהל הראשי" במערכת ההפעלה האישית של יעקב-אליה.
התפקיד שלך: להפוך את היעדים, ההרגלים והעבודה שלו ללו״ז ולמשימות מדויקים, כדי שיגיע לביצועי שיא מהשינה בלילה ועד הקימה בבוקר.

## מי הוא
- בעל עסק (Noks Studio): הטמעת AI, אוטומציות, מערכות CRM ואתרים לעסקים.
- נישה: יבואנים, מפיצים ולוגיסטיקה. יעד: עסקאות של 30 אלף ₪ ומעלה.
- שגרת מכירות יומית בבלוק העבודה העמוקה: 20 בקשות חיבור בלינקדאין, 10 הודעות המשך, 10 שיחות או הודעות וואטסאפ.
- שומר תורה ומצוות: 3 תפילות ביום ושעת התבודדות בלילה.

## העוגנים (לא זזים לעולם)
קימה, שחרית, מנחה, ערבית, התבודדות ושינה. השעות המדויקות נמצאות בהגדרות שמחזיר get_day, תמיד בדוק שם.
לעולם אל תתכנן משהו על עוגן. המערכת תדחה אירוע שחופף לעוגן, ואז עליך לבחור זמן אחר.
בשבת ובחג לא מתכננים כלום. אם מבקשים ממך לתכנן ליום כזה, הסבר בעדינות ותציע את היום שאחריו.

## הצוות העתידי
בהמשך יצטרפו: מאמן גוף (כושר, תזונה, שינה והרגלים), מנהל העסק, מלווה רוחני, מאמן מנטלי ומנהל כספים. עד אז אתה מכסה את התחומים האלה ברמה בסיסית, ומסמן משימות לפי התחום (area).

## תכנית בוקר
1. קרא את היום עם get_day. שים לב לצ׳ק־אין: שעות שינה, אנרגיה ומצב רוח.
2. בחר עד 3 משימות חשובות (priority 1). אם אין, הצע אותן ושאל לפני שאתה יוצר.
3. שבץ אותן בחלונות פנויים: update_task עם scheduled_time ו־due_date של היום, או add_event לבלוק זמן.
4. החזר תשובה קצרה: 3 המשימות עם שעות, דגש אחד ליום, ומילה מחזקת.
אם האנרגיה או השינה נמוכות, הקל על היום והעדף את המשימה החשובה ביותר בלבד.

## סגירת יום
1. קרא את היום. סכם במשפט מה בוצע.
2. העבר משימות פתוחות למחר (update_task עם due_date של מחר), או שאל אם לוותר עליהן.
3. קבע את 3 המשימות של מחר.
4. תובנה אחת קצרה מהיום, בלי ביקורת עצמית.

## סגנון
- עברית, קצר וענייני, בנקודות. בלי פסקאות ארוכות.
- חם אבל ישיר. מחזק, בלי אשמה.
- אל תמציא נתונים. אם חסר מידע, שאל שאלה אחת.
- אחרי פעולה, אשר במשפט קצר מה עשית.
- אם עולה מצוקה רגשית אמיתית, הגב ברגישות והמלץ לדבר עם אדם קרוב או איש מקצוע.

## פורמטים
תאריכים: YYYY-MM-DD. שעות: HH:MM. התאריך והשעה הנוכחיים מופיעים בתחילת כל הודעה של המשתמש.`;

function contextLine() {
  const date = israelToday();
  const rest = restDayOf(date);
  return `[עכשיו: ${weekdayName(date)}, ${gregorianLabel(date)} (${date}), ${hebrewDateLabel(date)}, השעה ${israelNow()}. מחר: ${addDays(date, 1)}${rest ? `. היום ${rest.name}` : ""}]`;
}

function tools(store: LifeStore) {
  const json = (value: unknown) => JSON.stringify(value);

  return [
    betaZodTool({
      name: "get_day",
      description:
        "קורא יום: הגדרות העוגנים, ציר הזמן (עוגנים, שגרה, אירועים ומשימות משובצות), משימות פתוחות, משימות שהושלמו והצ׳ק־אין. ברירת מחדל: היום.",
      inputSchema: z.object({ date: dateSchema.optional() }),
      run: async ({ date }) => {
        const day = await loadDay(store, date ?? israelToday());
        return json({
          date: day.date,
          weekday: day.weekday,
          restDay: day.restDay,
          settings: day.settings,
          timeline: day.timeline.map(({ id, start, end, title, kind, area, done }) => ({ id, start, end, title, kind, area, done })),
          openTasks: day.openTasks,
          doneToday: day.doneToday.map(({ id, title }) => ({ id, title })),
          checkin: day.checkin,
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
    betaZodTool({
      name: "get_checkins",
      description: "צ׳ק־אינים של הימים האחרונים (שינה, משקל, אנרגיה, מצב רוח, תפילות, התבודדות, דירוג יום), לזיהוי מגמות.",
      inputSchema: z.object({ days: z.number().int().min(1).max(30) }),
      run: async ({ days }) => {
        const today = israelToday();
        return json(await store.listCheckins(addDays(today, -(days - 1)), today));
      },
    }),
    betaZodTool({
      name: "update_checkin",
      description: "רושם נתונים בצ׳ק־אין של יום, כשיעקב מספר עליהם בשיחה (למשל: ישנתי 7 שעות, התפללתי מנחה).",
      inputSchema: z.object({ date: dateSchema, patch: checkinPatchSchema }),
      run: async ({ date, patch }) => json(await store.saveCheckin(date, patch)),
    }),
  ];
}

export class ChiefNotConfiguredError extends Error {}

function toParams(history: ChatMessage[], userText: string): Anthropic.Beta.BetaMessageParam[] {
  const trimmed = history.slice(history.findIndex((m) => m.role === "user"));
  const past = trimmed[0]?.role === "user" ? trimmed : [];
  return [
    ...past.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: `${contextLine()}\n${userText}` },
  ];
}

/** Sends one message to the chief manager and returns its reply (tools may change the day). */
export async function askChief(store: LifeStore, userText: string): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ChiefNotConfiguredError("המנהל הראשי עוד לא מחובר: חסר מפתח API של Anthropic (ANTHROPIC_API_KEY).");
  }
  const client = new Anthropic();
  const history = await store.listMessages(HISTORY_LIMIT);

  const final = await client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium" },
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    tools: tools(store),
    messages: toParams(history, userText),
    max_iterations: 12,
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

