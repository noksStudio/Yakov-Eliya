import { DatabaseZap } from "lucide-react";

export function SupabaseNotConfigured() {
  return (
    <div className="p-6 sm:p-8">
      <div className="glass mx-auto flex max-w-lg flex-col items-center gap-3 rounded-2xl px-8 py-16 text-center">
        <DatabaseZap className="h-8 w-8 text-primary-2" />
        <p className="font-medium">חיבור ל-Supabase לא מוגדר עדיין</p>
        <p className="text-sm text-muted">
          יש להוסיף את משתני הסביבה <code className="text-foreground">SUPABASE_URL</code> ו-
          <code className="text-foreground">SUPABASE_SERVICE_ROLE_KEY</code> ולהריץ את הסקריפט
          ב-<code className="text-foreground">supabase/schema.sql</code> בפרויקט ה-Supabase שלך.
        </p>
      </div>
    </div>
  );
}
