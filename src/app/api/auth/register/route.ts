import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, sessionCookieOptions, signSessionToken } from "@/lib/auth";
import { AREAS } from "@/lib/constants";
import { normalizePakistaniPhone } from "@/lib/phone";
import { slugify } from "@/lib/slug";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const ownerName = String(body.ownerName || "").trim();
  const salonName = String(body.salonName || "").trim();
  const category = String(body.category || "GENTS");
  const quettaArea = String(body.quettaArea || "");
  const address = String(body.address || "").trim();
  const phone = normalizePakistaniPhone(String(body.phone || "")) || String(body.phone || "").trim();
  const whatsappNumber = normalizePakistaniPhone(String(body.whatsappNumber || body.phone || "")) || phone;

  // Payment Onboarding Fields
  const paymentProvider = String(body.paymentProvider || "JAZZCASH").toUpperCase();
  const accountHolderName = String(body.accountHolderName || ownerName).trim();
  const accountNumber = String(body.accountNumber || phone).trim();
  const bankName = body.bankName ? String(body.bankName).trim() : null;
  const branchCode = body.branchCode ? String(body.branchCode).trim() : null;
  const cnic = body.cnic ? String(body.cnic).trim() : null;
  const businessTitle = body.businessTitle ? String(body.businessTitle).trim() : null;

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: "Email and a password of at least 6 characters are required." }, { status: 400 });
  }
  if (!ownerName || !salonName || !address || !quettaArea) {
    return NextResponse.json({ error: "Fill owner name, salon name, area and street address." }, { status: 400 });
  }
  if (!AREAS.includes(quettaArea as (typeof AREAS)[number])) {
    return NextResponse.json({ error: "Select a valid Quetta area." }, { status: 400 });
  }

  // Validate mandatory payment account registration
  if (!accountHolderName || !accountNumber) {
    return NextResponse.json(
      { error: "Payment account holder name and wallet/IBAN account number are required for onboarding." },
      { status: 400 }
    );
  }

  if (paymentProvider === "BANK" && !bankName) {
    return NextResponse.json(
      { error: "Bank Name is required when choosing Bank Account/IBAN." },
      { status: 400 }
    );
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  let slug = slugify(salonName);
  if (await prisma.salon.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;

  // Atomic creation of Salon, User, and Initial PENDING Payment Account
  const result = await prisma.$transaction(async (tx) => {
    const salon = await tx.salon.create({
      data: {
        name: salonName,
        slug,
        category: ["GENTS", "LADIES", "UNISEX"].includes(category) ? category : "GENTS",
        quettaArea,
        address,
        phone,
        whatsappNumber,
        openTime: body.openTime || "11:00",
        closeTime: body.closeTime || "22:00",
        breakStart: body.breakStart || "",
        breakEnd: body.breakEnd || "",
        workingDaysJson: JSON.stringify(body.workingDays || [1, 2, 3, 4, 5, 6]),
        imageUrl: body.imageUrl || "https://images.unsplash.com/photo-1521590832167-7bcbfaaae1b2?auto=format&fit=crop&w=1400&q=80",
        galleryJson: JSON.stringify([body.imageUrl].filter(Boolean)),
        mapsUrl: body.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(address + " Quetta")}`,
        approvalStatus: "PENDING",
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        role: "owner",
        name: ownerName,
        phone,
        salonId: salon.id,
      },
    });

    const paymentAccount = await tx.salonPaymentAccount.create({
      data: {
        salonId: salon.id,
        ownerId: user.id,
        provider: ["JAZZCASH", "EASYPAISA", "BANK"].includes(paymentProvider) ? paymentProvider : "JAZZCASH",
        accountHolderName,
        accountNumber,
        bankName: paymentProvider === "BANK" ? bankName : null,
        branchCode: paymentProvider === "BANK" ? branchCode : null,
        cnic,
        businessTitle,
        verificationStatus: "PENDING",
      },
    });

    await tx.paymentAccountAuditLog.create({
      data: {
        salonPaymentAccountId: paymentAccount.id,
        action: "CREATED_DURING_ONBOARDING",
        changedBy: email,
        newValuesJson: JSON.stringify({
          provider: paymentProvider,
          accountHolderName,
          accountNumber: accountNumber.replace(/.(?=.{4})/g, "*"),
          bankName,
        }),
      },
    });

    return { salon, user, paymentAccount };
  });

  const token = await signSessionToken({
    userId: result.user.id,
    email: result.user.email,
    role: result.user.role,
    salonId: result.salon.id,
  });

  const res = NextResponse.json({ ok: true, salon: result.salon, redirect: "/owner" }, { status: 201 });
  const cookie = sessionCookieOptions();
  res.cookies.set(cookie.name, token, cookie);
  return res;
}
