import { Resend } from "resend";
import type { Barber, Service } from "@/lib/types";
import { formatTime12h } from "@/lib/booking/availability";
import { formatDateLabel } from "@/lib/booking/date-utils";
import { absoluteUrl } from "@/lib/seo";

const SHOP_ADDRESS = "1418 S Congress Ave, Austin, TX 78704";

interface BookingEmailInput {
  service: Service;
  barber: Barber;
  date: string;
  time: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  confirmationToken: string;
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY. Check .env.local.");
  return new Resend(apiKey);
}

/**
 * Both send functions below are called from lib/actions/booking.ts
 * *after* the appointment has already been written and the Server
 * Action has already decided to report success. Nothing in here is
 * allowed to change that outcome — see the comment at the call site for
 * why email failing must never mean the booking didn't happen.
 */
export async function sendCustomerConfirmationEmail(input: BookingEmailInput): Promise<void> {
  const resend = getResendClient();
  const cancelUrl = absoluteUrl(`/cancel/${input.confirmationToken}`);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Ironclad Barbers <onboarding@resend.dev>",
    to: input.customerEmail,
    subject: `You're booked — ${formatDateLabel(input.date)} at ${formatTime12h(input.time)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #211F1C;">
        <h1 style="font-size: 20px; color: #1B1917;">You're booked at Ironclad Barbers</h1>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #6b6b6b;">Service</td><td style="padding: 6px 0; text-align: right;">${input.service.name}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b6b6b;">Barber</td><td style="padding: 6px 0; text-align: right;">${input.barber.name}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b6b6b;">Date</td><td style="padding: 6px 0; text-align: right;">${formatDateLabel(input.date)}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b6b6b;">Time</td><td style="padding: 6px 0; text-align: right;">${formatTime12h(input.time)}</td></tr>
        </table>
        <p>${SHOP_ADDRESS}</p>
        <p style="color: #6b6b6b; font-size: 14px;">Running more than 10 minutes late? Call the shop and we'll hold your slot if we can.</p>
        <p style="margin-top: 24px;">
          <a href="${cancelUrl}" style="color: #8B6E3A;">Need to cancel? Click here.</a>
        </p>
      </div>
    `,
  });
}

export async function sendShopNotificationEmail(input: BookingEmailInput): Promise<void> {
  const resend = getResendClient();
  const shopEmail = process.env.SHOP_NOTIFICATION_EMAIL;
  if (!shopEmail) return; // Optional — don't fail a booking over a missing internal-only setting.

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Ironclad Barbers <onboarding@resend.dev>",
    to: shopEmail,
    subject: `New booking: ${input.customerName} — ${formatDateLabel(input.date)} ${formatTime12h(input.time)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #211F1C;">
        <h1 style="font-size: 20px; color: #1B1917;">New booking</h1>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 6px 0; color: #6b6b6b;">Customer</td><td style="padding: 6px 0; text-align: right;">${input.customerName}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b6b6b;">Email</td><td style="padding: 6px 0; text-align: right;">${input.customerEmail}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b6b6b;">Phone</td><td style="padding: 6px 0; text-align: right;">${input.customerPhone}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b6b6b;">Service</td><td style="padding: 6px 0; text-align: right;">${input.service.name}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b6b6b;">Barber</td><td style="padding: 6px 0; text-align: right;">${input.barber.name}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b6b6b;">Date</td><td style="padding: 6px 0; text-align: right;">${formatDateLabel(input.date)}</td></tr>
          <tr><td style="padding: 6px 0; color: #6b6b6b;">Time</td><td style="padding: 6px 0; text-align: right;">${formatTime12h(input.time)}</td></tr>
        </table>
      </div>
    `,
  });
}
