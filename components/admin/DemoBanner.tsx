import { FlaskConical } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="mx-6 mt-6 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 sm:mx-8">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
      <p>
        <span className="font-semibold">מצב הדגמה.</span> Supabase עוד לא מחובר, אז מוצגים נתוני דוגמה. שינויים לא נשמרים.
        אחרי שתוסיף את <code className="text-amber-50">SUPABASE_URL</code> ו־<code className="text-amber-50">SUPABASE_SECRET_KEY</code>{" "}
        ותריץ את <code className="text-amber-50">supabase/schema.sql</code>, יופיעו כאן הנתונים האמיתיים.
      </p>
    </div>
  );
}
