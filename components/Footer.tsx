import { Mail } from "lucide-react";
import { FacebookIcon, LinkedInIcon, WhatsAppIcon } from "@/components/ui/BrandIcons";

const socials = [
  { icon: WhatsAppIcon, label: "WhatsApp", href: "https://wa.me/972000000000" },
  { icon: LinkedInIcon, label: "LinkedIn", href: "#" },
  { icon: FacebookIcon, label: "Facebook", href: "#" },
  { icon: Mail, label: "Email", href: "mailto:hello@example.com" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border-soft px-6 py-12 text-center">
      <p className="text-xl font-bold">
        יעקב<span className="text-gradient">-אליה</span>
      </p>
      <div className="mt-6 flex justify-center gap-3">
        {socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            aria-label={s.label}
            className="glass flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:border-primary-2/50"
          >
            <s.icon className="h-[18px] w-[18px]" />
          </a>
        ))}
      </div>
      <p className="mx-auto mt-8 max-w-md text-muted">
        &ldquo;מחפש דרך חכמה יותר לקדם את העסק? בוא נדבר.&rdquo;
      </p>
      <p className="mt-6 text-xs text-muted/60">
        © {new Date().getFullYear()} יעקב-אליה · Noks Studio
      </p>
    </footer>
  );
}
