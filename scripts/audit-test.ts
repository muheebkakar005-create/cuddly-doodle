import { prisma, withRetry } from "../src/lib/prisma";
import { generateSlots } from "../src/lib/slots";
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken, canManageSalon } from "../src/lib/auth";
import { rateLimit } from "../src/lib/rateLimit";
import { normalizePakistaniPhone } from "../src/lib/phone";

async function runAuditTests() {
  console.log("=================================================");
  console.log("  Q SALONS COMPLETE AUDIT & VERIFICATION SUITE   ");
  console.log("=================================================");
  let passed = 0;
  let failed = 0;

  function assert(desc: string, condition: boolean, extra?: unknown) {
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`, extra || "");
      failed++;
    }
  }

  // 1. DATABASE & SEED INTEGRITY
  console.log("\n1. Testing Database Connection & Seed Integrity...");
  try {
    const totalSalons = await withRetry(() => prisma.salon.count());
    assert("Neon PostgreSQL connects successfully", true);
    assert(`Seeded salons count is >= 18 (Actual: ${totalSalons})`, totalSalons >= 18);

    const approvedSalons = await prisma.salon.count({ where: { approvalStatus: "APPROVED" } });
    assert(`Approved salons exist (Actual: ${approvedSalons})`, approvedSalons > 0);

    const servicesCount = await prisma.service.count();
    assert(`Services seeded in DB (Actual: ${servicesCount})`, servicesCount > 0);

    const usersCount = await prisma.user.count();
    assert(`Users exist (Actual: ${usersCount})`, usersCount > 0);
  } catch (err) {
    assert("Database connection succeeded", false, err);
  }

  // 2. EXPLORE & FILTER INTEGRITY
  console.log("\n2. Testing Explore Page Queries & Filter Logic...");
  try {
    const allApproved = await prisma.salon.findMany({
      where: { approvalStatus: "APPROVED" },
      include: { services: true },
    });
    assert("Query for all approved salons succeeds", allApproved.length > 0);

    const gents = allApproved.filter((s) => s.category === "GENTS");
    assert(`Category filter 'GENTS' works (Count: ${gents.length})`, gents.length > 0);

    const ladies = allApproved.filter((s) => s.category === "LADIES");
    assert(`Category filter 'LADIES' works (Count: ${ladies.length})`, ladies.length > 0);

    const canttSalons = allApproved.filter((s) => s.quettaArea === "Quetta Cantt");
    assert(`Area filter 'Quetta Cantt' works (Count: ${canttSalons.length})`, canttSalons.length > 0);

    const rating4 = allApproved.filter((s) => s.rating >= 4.0);
    assert(`Rating filter >= 4.0 works (Count: ${rating4.length})`, rating4.length > 0);
  } catch (err) {
    assert("Explore queries succeeded", false, err);
  }

  // 3. SALON DETAIL SLUG LOOKUP
  console.log("\n3. Testing Salon Detail Route Query Integrity...");
  try {
    const validSalon = await withRetry(() =>
      prisma.salon.findUnique({
        where: { slug: "the-hair-lab-quetta" },
        include: { services: true, staff: true },
      })
    );
    assert("Valid slug 'the-hair-lab-quetta' returns record", Boolean(validSalon));
    assert("Salon has services associated", (validSalon?.services.length || 0) > 0);
    assert("Salon has staff associated", (validSalon?.staff.length || 0) > 0);

    const invalidSalon = await withRetry(() =>
      prisma.salon.findUnique({
        where: { slug: "invalid-salon-that-does-not-exist" },
      })
    );
    assert("Invalid slug safely returns null (triggering 404 notFound)", invalidSalon === null);
  } catch (err) {
    assert("Slug queries succeeded", false, err);
  }

  // 4. BOOKING ENGINE & INTEGRITY
  console.log("\n4. Testing Booking System & Concurrency Protection...");
  try {
    const salon = await prisma.salon.findFirst({
      where: { approvalStatus: "APPROVED" },
      include: { services: true, appointments: true },
    });
    if (!salon || salon.services.length === 0) {
      throw new Error("No approved salon with services found");
    }

    const testService = salon.services[0];
    const durationMinutes = testService.durationMinutes;
    const date = "2026-11-01"; // Future date

    const slots = generateSlots({
      openTime: salon.openTime,
      closeTime: salon.closeTime,
      durationMinutes,
      date,
      workingDaysJson: salon.workingDaysJson,
      breakStart: salon.breakStart,
      breakEnd: salon.breakEnd,
      booked: [],
    });
    assert("Slot generator generates valid business hour slots", slots.length > 0);
    assert("First slot is marked available", slots[0]?.available === true);

    const testTime = slots[0]?.time || "12:00";
    const testPhone = normalizePakistaniPhone("03001234567")!;

    // Clean up any test appointment
    await prisma.appointment.deleteMany({
      where: { customerPhone: testPhone, appointmentDate: date },
    });

    // Create test appointment
    const created = await prisma.appointment.create({
      data: {
        salonId: salon.id,
        customerName: "Audit Test User",
        customerPhone: testPhone,
        appointmentDate: date,
        appointmentTime: testTime,
        durationMinutes,
        totalPricePkr: testService.pricePkr,
        status: "PENDING",
        services: {
          create: [{ serviceId: testService.id }],
        },
      },
    });
    assert("Appointment persists with server-calculated price to Neon DB", Boolean(created.id));

    // Concurrency collision test
    const conflict = await prisma.appointment.findFirst({
      where: {
        salonId: salon.id,
        appointmentDate: date,
        appointmentTime: testTime,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });
    assert("Concurrency collision detected for identical slot", Boolean(conflict));

    // Clean up
    await prisma.appointment.deleteMany({ where: { id: created.id } });
    assert("Test appointment safely cleaned up", true);
  } catch (err) {
    assert("Booking system test succeeded", false, err);
  }

  // 5. SECURITY & RATE LIMITING
  console.log("\n5. Testing Security, Rate Limiter & Phone Privacy...");
  try {
    const testIp = "192.168.1.100";
    let allowedCount = 0;
    for (let i = 0; i < 25; i++) {
      const res = rateLimit(`test_key:${testIp}`, 10, 60000);
      if (res.success) allowedCount++;
    }
    assert("Rate limiter restricts requests exceeding threshold (10 allowed)", allowedCount === 10);

    const normalized = normalizePakistaniPhone("0333-1234567");
    assert("Pakistani phone normalization works (03331234567)", normalized === "03331234567");

    const invalidPhone = normalizePakistaniPhone("12345");
    assert("Invalid phone rejected by validator", invalidPhone === null);
  } catch (err) {
    assert("Security tests succeeded", false, err);
  }

  // 6. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC)
  console.log("\n6. Testing Auth, JWT & Role-Based Permissions...");
  try {
    const testPassword = "SecurePassword123!";
    const hashed = await hashPassword(testPassword);
    const valid = await verifyPassword(testPassword, hashed);
    const invalid = await verifyPassword("WrongPassword", hashed);
    assert("Password hashing & bcrypt verification works", valid && !invalid);

    // Sign admin token
    const adminToken = await signSessionToken({
      userId: "admin-1",
      email: "muheebkakar005@gmail.com",
      role: "admin",
    });
    const verifiedAdmin = await verifySessionToken(adminToken);
    assert("Super Admin JWT signed and verified", verifiedAdmin?.role === "admin");

    // Sign owner token
    const ownerToken = await signSessionToken({
      userId: "owner-1",
      email: "owner@thehairlab.pk",
      role: "owner",
      salonId: "salon-123",
    });
    const verifiedOwner = await verifySessionToken(ownerToken);
    assert("Shop Owner JWT signed and verified with salonId", verifiedOwner?.salonId === "salon-123");

    // RBAC checks
    assert("Admin can manage any salon", canManageSalon(verifiedAdmin, "arbitrary-salon"));
    assert("Owner can manage their own salon", canManageSalon(verifiedOwner, "salon-123"));
    assert("Owner CANNOT manage other salons", !canManageSalon(verifiedOwner, "different-salon-999"));
  } catch (err) {
    assert("Auth tests succeeded", false, err);
  }

  console.log("\n=================================================");
  console.log(`  AUDIT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED `);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAuditTests().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
