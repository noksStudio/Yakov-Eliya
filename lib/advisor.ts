import { tracks, type Track } from "@/lib/tracks";

export function classify(text: string, maxResults = 3): Track[] {
  const normalized = text.trim();
  if (!normalized) return [];

  const scored = tracks
    .map((track) => {
      const score = track.keywords.reduce(
        (acc, kw) => (normalized.includes(kw) ? acc + kw.length : acc),
        0
      );
      return { track, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults).map((entry) => entry.track);
}

export const painChips = [
  { label: "אין מספיק לקוחות חדשים", sample: "אין לי מספיק לקוחות ופניות חדשות" },
  { label: "קשה לנהל לידים וגבייה", sample: "קשה לי לנהל את הלידים והגבייה מהלקוחות" },
  { label: "הנוכחות הדיגיטלית לא משדרת ערך", sample: "העסק שלי לא נראה טוב באינטרנט" },
  { label: "יש לי רעיון למיזם", sample: "יש לי רעיון למיזם טכנולוגי ולא יודע מאיפה להתחיל" },
  { label: "אני מחפש להשקיע", sample: "אני מחפש הזדמנויות השקעה בסטארטאפים" },
];
