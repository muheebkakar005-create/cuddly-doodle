import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Clearing all data from Neon...");
  await prisma.review.deleteMany();
  await prisma.appointmentService.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.user.deleteMany();
  await prisma.salon.deleteMany();
  console.log("✅ All tables cleared.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
