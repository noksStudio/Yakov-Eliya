import Link from "next/link";
import { Mail } from "lucide-react";
import { FacebookIcon, InstagramIcon, LinkedInIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";
import { tracks } from "@/lib/tracks";
import { CONTACT_EMAIL, SOCIAL_LINKS, whatsappLink } from "@/lib/site-config";

const socials = [
  { icon: WhatsAppIcon, label: "WhatsApp", href: whatsappLink() },
  { icon: InstagramIcon, label: "Instagram", href: SOCIAL_LINKS.instagram },
  { icon: LinkedInIcon, label: "LinkedIn", href: SOCIAL_LINKS.linkedin },
  { icon: FacebookIcon, label: "Facebook", href: SOCIAL_LINKS.facebook },
  { icon: Mail, label: "Email", href: `mailto:${CONTACT_EMAIL}` },
].filter((s) => s.href);

export function Footer() {
  return (
    <footer className="relative border-t border-border-soft px-6 py-12 text-center">
      <p className="text-xl font-black">
        <span className="text-gold-soft">יעקב</span>-אליה
      </p>
      <nav className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted">
        {tracks.map((track) => (
          <Link key={track.slug} href={track.path} className="transition-colors hover:text-foreground">
            {track.title}
          </Link>
        ))}
      </nav>
      <div className="mt-6 flex justify-center gap-3">
        {socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            aria-label={s.label}
            {...(s.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="glass flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:border-primary-2/50"
          >
            <s.icon className="h-[18px] w-[18px]" />
          </a>
        ))}
      </div>
      <p className="mx-auto mt-8 max-w-md text-muted">
        &ldquo;מחפש דרך חכמה יותר לקדם את העסק? בוא נדבר.&rdquo;
      </p>
      <nav aria-label="מידע משפטי" className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted">
        <Link href="/accessibility" className="underline-offset-4 transition-colors hover:text-foreground hover:underline">
          הצהרת נגישות
        </Link>
        <span aria-hidden className="text-muted/40">|</span>
        <Link href="/privacy" className="underline-offset-4 transition-colors hover:text-foreground hover:underline">
          מדיניות פרטיות
        </Link>
        <span aria-hidden className="text-muted/40">|</span>
        <Link href="/terms" className="underline-offset-4 transition-colors hover:text-foreground hover:underline">
          תנאי שימוש
        </Link>
      </nav>
      <p className="mt-4 text-xs text-muted/60">
        © {new Date().getFullYear()} יעקב-אליה · Noks Studio
      </p>
    </footer>
  );
}
