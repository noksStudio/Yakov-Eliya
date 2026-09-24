import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { CONTACT_EMAIL, whatsappLink } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "תנאי שימוש | יעקב-אליה",
  description: "תנאי השימוש באתר של יעקב-אליה (Noks Studio).",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="TERMS OF USE" title="תנאי שימוש" updated="ספטמבר 2026">
      <LegalSection title="כללי">
        <p>
          ברוכים הבאים לאתר של יעקב-אליה (Noks Studio). השימוש באתר, על כל תכניו ושירותיו, כפוף
          לתנאים המפורטים כאן. הגלישה באתר מהווה הסכמה לתנאים אלה, ואם אינכם מסכימים להם — אנא הימנעו
          משימוש באתר. התנאים מנוסחים בלשון רבים מטעמי נוחות ומתייחסים לכל המגדרים.
        </p>
      </LegalSection>

      <LegalSection title="מטרת האתר">
        <p>
          האתר נועד להציג את השירותים של יעקב-אליה בתחומי שיווק, טכנולוגיה, אוטומציה ובניית מערכות,
          ולאפשר יצירת קשר. המידע באתר הוא כללי בלבד, אינו מהווה הצעה מחייבת ואינו תחליף לייעוץ מקצועי
          המותאם לעסק שלכם. תנאי כל שירות ייקבעו בהסכם נפרד בין הצדדים.
        </p>
      </LegalSection>

      <LegalSection title="קניין רוחני">
        <p>
          כל התכנים באתר — לרבות טקסטים, עיצוב, תמונות, איורים, סימנים מסחריים וקוד — שייכים ליעקב-אליה
          או לצדדים שהעניקו לו רישיון שימוש, ומוגנים בדיני זכויות יוצרים. אין להעתיק, להפיץ, לשכפל,
          לפרסם או לעשות בהם שימוש מסחרי ללא אישור מראש ובכתב.
        </p>
      </LegalSection>

      <LegalSection title="שימוש מותר באתר">
        <p>אתם מתחייבים להשתמש באתר למטרות חוקיות בלבד, ובין היתר שלא:</p>
        <ul className="list-disc space-y-1.5 ps-6">
          <li>למסור פרטים כוזבים או פרטים של אדם אחר ללא הסכמתו.</li>
          <li>לפגוע בפעילות האתר, לנסות לחדור למערכותיו או לאסוף ממנו מידע באופן אוטומטי.</li>
          <li>להעלות או לשלוח תוכן פוגעני, מטעה או מפר זכויות.</li>
        </ul>
      </LegalSection>

      <LegalSection title="אחריות">
        <p>
          האתר והתכנים בו מוצגים כפי שהם (AS IS). אנו עושים מאמצים שהמידע יהיה מדויק ועדכני, אך ייתכנו
          בו טעויות או אי-דיוקים, ואין אנו מתחייבים שהאתר יפעל ללא הפרעות או תקלות. יעקב-אליה לא יישא
          באחריות לנזק ישיר או עקיף שייגרם כתוצאה מהשימוש באתר או מהסתמכות על התכנים בו, ככל שהדין
          מאפשר זאת.
        </p>
      </LegalSection>

      <LegalSection title="קישורים לאתרים חיצוניים">
        <p>
          האתר עשוי לכלול קישורים לשירותים חיצוניים, כגון וואטסאפ ורשתות חברתיות. אין לנו שליטה על
          שירותים אלה ואיננו אחראים לתכנים או למדיניות שלהם. השימוש בהם כפוף לתנאים של מפעיליהם.
        </p>
      </LegalSection>

      <LegalSection title="פרטיות">
        <p>
          השימוש במידע שנמסר באתר כפוף ל
          <Link href="/privacy" className="underline underline-offset-4 hover:text-white">
            מדיניות הפרטיות
          </Link>
          , המהווה חלק בלתי נפרד מתנאים אלה.
        </p>
      </LegalSection>

      <LegalSection title="שינויים באתר ובתנאים">
        <p>
          אנו רשאים לשנות את האתר, את תכניו ואת תנאי השימוש מעת לעת, ללא הודעה מוקדמת. הגרסה העדכנית
          של התנאים תפורסם תמיד בעמוד זה.
        </p>
      </LegalSection>

      <LegalSection title="דין וסמכות שיפוט">
        <p>
          על תנאים אלה ועל השימוש באתר יחולו דיני מדינת ישראל בלבד. סמכות השיפוט הבלעדית בכל עניין
          הנוגע לאתר נתונה לבתי המשפט המוסמכים בישראל.
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
            <span className="text-white">מייל:</span>{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("שאלה לגבי תנאי השימוש באתר")}`}
              className="underline underline-offset-4 hover:text-white"
              dir="ltr"
            >
              {CONTACT_EMAIL}
            </a>
          </li>
          <li>
            <span className="text-white">וואטסאפ:</span>{" "}
            <a
              href={whatsappLink("היי, יש לי שאלה לגבי תנאי השימוש באתר")}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-white"
            >
              שליחת הודעה
            </a>
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
