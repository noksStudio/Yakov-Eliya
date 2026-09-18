import { Resend } from "resend";
import { getTrack } from "@/lib/tracks";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function notifyNewLead(lead: {
  name: string;
  phone: string;
  business_type?: string | null;
  pain?: string | null;
  track_slug?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFICATION_EMAIL;
  if (!apiKey || !to) return;

  const from = process.env.RESEND_FROM_EMAIL || "יעקב-אליה <onboarding@resend.dev>";
  const trackTitle = lead.track_slug ? getTrack(lead.track_slug)?.title : null;

  const rows = [
    ["שם", lead.name],
    ["טלפון", lead.phone],
    lead.business_type ? ["תחום עיסוק", lead.business_type] : null,
    lead.pain ? ["קושי שדווח", lead.pain] : null,
    trackTitle ? ["מסלול מתאים", trackTitle] : null,
  ].filter((row): row is [string, string] => row !== null);

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #111;">
      <h2 style="margin: 0 0 16px;">ליד חדש מהאתר 🎉</h2>
      ${rows
        .map(
          ([label, value]) =>
            `<p style="margin: 4px 0;"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`
        )
        .join("")}
    </div>
  `;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: `ליד חדש: ${lead.name}`,
      html,
    });
  } catch (error) {
    console.error("Failed to send lead notification email", error);
  }
}
