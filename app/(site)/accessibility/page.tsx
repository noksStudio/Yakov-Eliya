import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { whatsappLink } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "הצהרת נגישות | יעקב-אליה",
  description: "הצהרת הנגישות של האתר — רמת ההנגשה, ההתאמות שבוצעו ודרכי פנייה לרכז הנגישות.",
};

export default function AccessibilityStatementPage() {
  return (
    <LegalPage eyebrow="ACCESSIBILITY" title="הצהרת נגישות" updated="ספטמבר 2026">
      <LegalSection title="מחויבות לנגישות">
        <p>
          אנו רואים חשיבות רבה במתן שירות שוויוני לכלל הגולשים, ובכלל זה לאנשים עם מוגבלות. השקענו
          מאמצים כדי שהאתר יהיה נוח, ידידותי וזמין לשימוש עבור כולם, מתוך אמונה שלכל אדם מגיעה הזכות
          לחיות בשוויון, בכבוד ובעצמאות.
        </p>
      </LegalSection>

      <LegalSection title="רמת הנגישות באתר">
        <p>
          האתר הונגש בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות),
          התשע&quot;ג-2013, ובהתאם להמלצות התקן הישראלי ת&quot;י 5568 לנגישות תכנים באינטרנט ברמה AA,
          המבוסס על הנחיות WCAG 2.0 של ארגון W3C.
        </p>
        <p>ההנגשה נבדקה בדפדפנים Chrome, Safari, Firefox ו-Edge, בגרסאות העדכניות, במחשב ובנייד.</p>
      </LegalSection>

      <LegalSection title="התאמות שבוצעו באתר">
        <ul className="list-disc space-y-1.5 ps-6">
          <li>הגדרת שפת האתר (עברית) וכיווניות מימין לשמאל.</li>
          <li>מבנה כותרות היררכי ותגיות סמנטיות לניווט נוח עם קוראי מסך.</li>
          <li>טקסט חלופי לתמונות בעלות משמעות; תמונות דקורטיביות מסומנות כך שקוראי מסך מדלגים עליהן.</li>
          <li>אפשרות ניווט מלאה באמצעות המקלדת, עם סימון בולט של הרכיב שבפוקוס.</li>
          <li>קישור &quot;דלג לתוכן הראשי&quot; בתחילת כל עמוד.</li>
          <li>תוויות נגישות לכפתורים ולרכיבים אינטראקטיביים.</li>
          <li>התחשבות בהגדרת המערכת &quot;צמצום תנועה&quot; — האנימציות מצטמצמות אוטומטית.</li>
          <li>התאמה מלאה לתצוגה בטלפונים ניידים ובטאבלטים.</li>
        </ul>
      </LegalSection>

      <LegalSection title="תפריט הנגישות">
        <p>
          בצד שמאל של המסך זמין תפריט נגישות (הכפתור השחור עם סמל הנגישות), המאפשר להתאים את התצוגה
          לצרכים אישיים. ההגדרות נשמרות בדפדפן לביקורים הבאים:
        </p>
        <ul className="list-disc space-y-1.5 ps-6">
          <li>הגדלת והקטנת טקסט.</li>
          <li>ניגודיות גבוהה, היפוך צבעים ותצוגה בגווני אפור.</li>
          <li>הדגשת קישורים.</li>
          <li>מעבר לגופן קריא.</li>
          <li>הגדלת ריווח בין אותיות, מילים ושורות.</li>
          <li>עצירת אנימציות.</li>
          <li>סמן עכבר מוגדל.</li>
          <li>איפוס כל ההגדרות בלחיצה.</li>
        </ul>
      </LegalSection>

      <LegalSection title="הסתייגות">
        <p>
          אנו ממשיכים לפעול לשיפור נגישות האתר כחלק ממחויבותנו לאפשר שימוש בו לכלל האוכלוסייה. ייתכן
          שיימצאו באתר רכיבים או תכנים שטרם הונגשו במלואם, או תכנים של צדדים שלישיים (כגון וואטסאפ)
          שאינם בשליטתנו. אם נתקלתם בקושי — נשמח שתעדכנו אותנו ונפעל לתקן זאת בהקדם.
        </p>
      </LegalSection>

      <LegalSection title="פנייה בנושא נגישות">
        <p>
          נתקלתם בבעיה או שיש לכם הצעה לשיפור? אפשר לפנות לרכז הנגישות, ונשתדל להשיב תוך 5 ימי עסקים:
        </p>
        <ul className="space-y-1.5">
          <li>
            <span className="text-white">רכז הנגישות:</span> יעקב-אליה
          </li>
          <li>
            <span className="text-white">טלפון:</span>{" "}
            <a href="tel:+972532266676" className="underline underline-offset-4 hover:text-white" dir="ltr">
              053-2266676
            </a>
          </li>
          <li>
            <span className="text-white">וואטסאפ:</span>{" "}
            <a
              href={whatsappLink("היי, אני פונה בנושא נגישות האתר")}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-white"
            >
              שליחת הודעה
            </a>
          </li>
        </ul>
        <p>כדי שנוכל לטפל בפנייה, נשמח לקבל תיאור של הבעיה, העמוד שבו נתקלתם בה והדפדפן שבו השתמשתם.</p>
      </LegalSection>
    </LegalPage>
  );
}
