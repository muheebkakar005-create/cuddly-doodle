import { toWhatsAppE164 } from "./phone";

export function buildBookingMessage(params: {
  salonName: string;
  customerName: string;
  phone: string;
  area: string;
  services: string[];
  total: number;
  date: string;
  time: string;
  advancePaid?: number;
  remainingDue?: number;
  paymentProvider?: string;
  paymentRef?: string;
  paymentStatus?: string;
}): string {
  const isPaid = params.paymentStatus === "PAID" || (params.advancePaid && params.advancePaid > 0);

  const paymentDetails = isPaid
    ? `\n• Advance Paid Online (50%): Rs. ${(params.advancePaid || Math.round(params.total / 2)).toLocaleString("en-PK")} PKR (Verified via ${params.paymentProvider || "Online"}${params.paymentRef ? ` - Ref: ${params.paymentRef}` : ""})\n• Remaining Balance at Salon: Rs. ${(params.remainingDue != null ? params.remainingDue : Math.round(params.total / 2)).toLocaleString("en-PK")} PKR`
    : `\n• Payment Status: 50% Advance Online Pending`;

  return `Salam ${params.salonName}! ✂️
I have booked an appointment via QSalon:
• Customer Name: ${params.customerName}
• Phone: ${params.phone}
• Area: ${params.area}
• Selected Services: ${params.services.join(" + ")}
• Total Amount: Rs. ${params.total.toLocaleString("en-PK")} PKR${paymentDetails}
• Date: ${params.date}
• Time Slot: ${params.time}
${isPaid ? "Advance payment completed online. Please confirm my appointment slot." : "Please find my booking details. Thank you!"}`;
}

export function whatsappChatUrl(phone: string, message?: string): string {
  const e164 = toWhatsAppE164(phone);
  const base = `https://wa.me/${e164}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
