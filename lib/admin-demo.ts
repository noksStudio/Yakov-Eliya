import type { Conversation, Lead } from "@/lib/types";

// Sample records shown in the admin panel while Supabase is not connected, so the panel can be
// reviewed as a mockup. Every page that uses them shows a "demo mode" banner; nothing is saved.

const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

function lead(id: number, hours: number, fields: Partial<Lead>): Lead {
  return {
    id: `demo-lead-${id}`,
    created_at: ago(hours),
    name: null,
    phone: null,
    email: null,
    business_type: null,
    pain: null,
    track_slug: null,
    gender: null,
    age: null,
    status: "new",
    notes: null,
    conversation_id: null,
    ...fields,
  };
}

export const DEMO_LEADS: Lead[] = [
  lead(1, 2, { name: "משה (דוגמה)", phone: "050-0000001", business_type: "יבואן כלי בית", pain: "הזמנות מגיעות בוואטסאפ ומוקלדות ידנית", track_slug: "automation", status: "new" }),
  lead(2, 9, { name: "רחל (דוגמה)", phone: "052-0000002", business_type: "מפיצה של מוצרי ניקיון", pain: "לקוחות מפסיקים להזמין ולא שמים לב", track_slug: "automation", status: "contacted", notes: "שיחה ראשונה ביום ג׳, מבקשת הצעה" }),
  lead(3, 26, { name: "יוסי (דוגמה)", phone: "054-0000003", business_type: "חברת הובלות", pain: "לקוחות מתקשרים לשאול איפה המשלוח", track_slug: "automation", status: "qualified", notes: "מתאים לאבחון. 12 עובדים" }),
  lead(4, 50, { name: "דנה (דוגמה)", phone: "053-0000004", business_type: "קליניקה לאסתטיקה", pain: "לידים מפייסבוק לא מקבלים מענה מהר", track_slug: "leads", status: "new" }),
  lead(5, 75, { name: "אבי (דוגמה)", phone: "058-0000005", business_type: "משרד רואי חשבון", pain: "רוצה אתר שמביא פניות", track_slug: "branding", status: "contacted" }),
  lead(6, 120, { name: "שרה (דוגמה)", phone: "050-0000006", business_type: "חנות אונליין", pain: "קמפיינים לא רווחיים", track_slug: "leads", status: "customer", notes: "סגרנו פיילוט" }),
  lead(7, 190, { name: "רון (דוגמה)", phone: "052-0000007", business_type: "סטארטאפ בשלב רעיון", track_slug: "community", status: "lost", notes: "לא רלוונטי כרגע" }),
];

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: "demo-conv-1",
    created_at: ago(3),
    updated_at: ago(2),
    business_type: "יבואן כלי בית",
    pain: "הקלדת הזמנות ידנית",
    track_slugs: ["automation"],
    messages: [
      { id: 1, role: "assistant", text: "היי! במה העסק שלך עוסק?" },
      { id: 2, role: "user", text: "אנחנו יבואנים של כלי בית, מוכרים לחנויות" },
      { id: 3, role: "assistant", text: "מה הכי מעסיק אותך היום בעסק?" },
      { id: 4, role: "user", text: "ההזמנות מגיעות בוואטסאפ ומישהי מקלידה הכל ידנית" },
      { id: 5, role: "assistant", text: "זה בדיוק מה שאפשר לאוטומט. רוצה שיעקב יחזור אליך?" },
    ],
  },
  {
    id: "demo-conv-2",
    created_at: ago(30),
    updated_at: ago(29),
    business_type: "קליניקה לאסתטיקה",
    pain: "מענה איטי ללידים",
    track_slugs: ["leads", "automation"],
    messages: [
      { id: 1, role: "assistant", text: "היי! במה העסק שלך עוסק?" },
      { id: 2, role: "user", text: "קליניקה לטיפולי פנים" },
      { id: 3, role: "assistant", text: "מאיפה מגיעים הלקוחות שלך היום?" },
      { id: 4, role: "user", text: "מפייסבוק, אבל אני לא מספיקה לענות לכולם" },
    ],
  },
  {
    id: "demo-conv-3",
    created_at: ago(80),
    updated_at: ago(80),
    business_type: null,
    pain: null,
    track_slugs: [],
    messages: [
      { id: 1, role: "assistant", text: "היי! במה העסק שלך עוסק?" },
      { id: 2, role: "user", text: "רק מסתכל" },
    ],
  },
];
