import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { whatsappLink } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "מדיניות פרטיות | יעקב-אליה",
  description: "איזה מידע נאסף באתר, למה הוא משמש, איך הוא נשמר ומה הזכויות שלכם.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage eyebrow="PRIVACY POLICY" title="מדיניות פרטיות" updated="ספטמבר 2026">
      <LegalSection title="כללי">
        <p>
          מדיניות זו מסבירה איזה מידע נאסף כשאתם משתמשים באתר של יעקב-אליה (Noks Studio), למה הוא
          משמש, איך הוא נשמר ומה הזכויות שלכם לגביו. השימוש באתר מהווה הסכמה למדיניות זו. המדיניות
          מנוסחת בלשון רבים מטעמי נוחות ומתייחסת לכל המגדרים.
        </p>
      </LegalSection>

      <LegalSection title="איזה מידע נאסף">
        <ul className="list-disc space-y-1.5 ps-6">
          <li>
            <span className="text-white">שיחות עם היועץ הדיגיטלי באתר</span> — תוכן ההודעות שאתם
            כותבים בצ׳אט, כולל תחום העסק והאתגר שתיארתם. השיחות נשמרות כדי לשפר את השירות ואת איכות
            ההכוונה.
          </li>
          <li>
            <span className="text-white">פרטי קשר</span> — שם ומספר טלפון, רק אם בחרתם להשאיר אותם
            ביוזמתכם כדי שנחזור אליכם.
          </li>
          <li>
            <span className="text-white">העדפות תצוגה</span> — הגדרות תפריט הנגישות נשמרות בדפדפן שלכם
            בלבד ואינן נשלחות אלינו.
          </li>
        </ul>
        <p>אינכם חייבים למסור מידע כלשהו על פי חוק. ללא פרטי קשר לא נוכל לחזור אליכם.</p>
      </LegalSection>

      <LegalSection title="למה אנחנו משתמשים במידע">
        <ul className="list-disc space-y-1.5 ps-6">
          <li>כדי ליצור איתכם קשר בהמשך לפנייה שלכם ולהתאים לכם את השירות המתאים.</li>
          <li>כדי לשפר את האתר, את היועץ הדיגיטלי ואת חוויית המשתמש.</li>
          <li>כדי לשלוח אליכם מידע שיווקי — רק אם נתתם לכך הסכמה מפורשת, ותמיד תוכלו לבקש להפסיק.</li>
        </ul>
      </LegalSection>

      <LegalSection title="שמירה ואבטחת מידע">
        <p>
          המידע נשמר במאגר מאובטח בשירותי ענן של ספקים מוכרים (אחסון בסיס הנתונים ב-Supabase, אחסון
          האתר ב-Vercel ושליחת התראות דוא״ל פנימיות על פניות חדשות באמצעות Resend). הגישה למידע מוגבלת
          לבעל האתר בלבד ומוגנת בסיסמה. אנו נוקטים באמצעים סבירים לאבטחת המידע, אך אין מערכת החסינה
          לחלוטין מפני חדירה.
        </p>
        <p>המידע נשמר רק כל עוד הוא נדרש למטרות שלשמן נאסף, או כפי שנדרש לפי דין.</p>
      </LegalSection>

      <LegalSection title="העברת מידע לצדדים שלישיים">
        <p>
          איננו מוכרים, משכירים או מעבירים את המידע שלכם לצדדים שלישיים, למעט ספקי השירות הטכנולוגיים
          המפורטים למעלה, שמעבדים את המידע עבורנו בלבד, או אם נידרש לכך על פי דין.
        </p>
        <p>
          לחיצה על קישור לוואטסאפ מעבירה אתכם לשירות של חברת Meta, והשימוש בו כפוף למדיניות הפרטיות
          שלה.
        </p>
      </LegalSection>

      <LegalSection title="עוגיות (Cookies) ואחסון בדפדפן">
        <p>
          האתר אינו משתמש בעוגיות פרסום או מעקב. נעשה שימוש באחסון מקומי בדפדפן לשמירת העדפות הנגישות
          בלבד. אפשר למחוק מידע זה בכל עת דרך הגדרות הדפדפן.
        </p>
      </LegalSection>

      <LegalSection title="הזכויות שלכם">
        <p>
          בהתאם לחוק הגנת הפרטיות, התשמ״א-1981, אתם רשאים לעיין במידע שנשמר עליכם, לבקש לתקן מידע שגוי
          ולבקש למחוק את המידע. לשם כך פנו אלינו בפרטים שבהמשך ונטפל בבקשה בהקדם.
        </p>
      </LegalSection>

      <LegalSection title="יצירת קשר">
        <ul className="space-y-1.5">
          <li>
            <span className="text-white">טלפון:</span>{" "}
            <a href="tel:+972532266676" className="underline underline-offset-4 hover:text-white" dir="ltr">
              053-2266676
            </a>
          </li>
          <li>
            <span className="text-white">וואטסאפ:</span>{" "}
            <a
              href={whatsappLink("היי, אני פונה בנושא פרטיות")}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-white"
            >
              שליחת הודעה
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="שינויים במדיניות">
        <p>
          אנו רשאים לעדכן מדיניות זו מעת לעת. הגרסה העדכנית תפורסם תמיד בעמוד זה, עם תאריך העדכון
          האחרון.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
