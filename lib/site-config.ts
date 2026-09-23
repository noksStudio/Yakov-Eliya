export const WHATSAPP_NUMBER = "972532266676";

export function whatsappLink(message?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

// Chat widget and its homepage section are paused; "let's talk" buttons fall back to WhatsApp.
export const CHAT_ENABLED = false;
