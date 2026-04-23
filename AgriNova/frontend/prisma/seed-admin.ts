/**
 * Seed Script: Creates the default ADMIN user for AgriNova.
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed-admin.ts
 * Or:  npx tsx prisma/seed-admin.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "onkarpatil9022@gmail.com";
  const adminPassword = "12345678";
  const adminPhone = "0000000000"; // Placeholder phone for admin

  // Check if admin already exists
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: adminEmail }, { phone: adminPhone }],
    } as any,
  });

  if (existing) {
    console.log("✅ Admin user already exists with ID:", existing.id);
    console.log("   Email:", (existing as any).email || adminEmail);
    console.log("   Role:", existing.role);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      name: "Onkar Patil",
      email: adminEmail,
      phone: adminPhone,
      passwordHash: hashedPassword,
      role: "ADMIN",
      state: "Maharashtra",
      district: "Pune",
    },
  });

  console.log("🌱 Admin user seeded successfully!");
  console.log("   ID:", admin.id);
  console.log("   Email:", adminEmail);
  console.log("   Password:", adminPassword);
  console.log("   Role:", admin.role);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
