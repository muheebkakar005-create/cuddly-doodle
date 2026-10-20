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
}): string {
  return `Salam ${params.salonName}! ✂️
I have booked an appointment via Quetta Salon Connect:
• Customer Name: ${params.customerName}
• Phone: ${params.phone}
• Area: ${params.area}
• Selected Services: ${params.services.join(" + ")}
• Total Amount: Rs. ${params.total.toLocaleString("en-PK")} PKR
• Date: ${params.date}
• Time Slot: ${params.time}
Please confirm my appointment slot. Thank you!`;
}

export function whatsappChatUrl(phone: string, message?: string): string {
  const e164 = toWhatsAppE164(phone);
  const base = `https://wa.me/${e164}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
