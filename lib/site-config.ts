export const WHATSAPP_NUMBER = "972532266676";
export const CONTACT_EMAIL = "yaakovt100@gmail.com";

// Social profiles shown in the footer; an empty link is hidden until it is filled in.
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/yakov_eliya_tamam/",
  linkedin: "",
  facebook: "",
};

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

// Chat widget and its homepage section are paused; "let's talk" buttons fall back to WhatsApp.
export const CHAT_ENABLED = false;
