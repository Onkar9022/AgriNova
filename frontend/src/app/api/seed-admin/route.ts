import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const adminEmail = "onkarpatil9022@gmail.com";
    const adminPassword = "12345678";
    const adminPhone = "0000000000";

    // Check if admin already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: adminEmail }, { phone: adminPhone }],
      } as any,
    });

    if (existing) {
      return NextResponse.json({
        message: "Admin user already exists",
        id: existing.id,
        role: existing.role,
      });
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

    return NextResponse.json({
      message: "Admin user created successfully",
      id: admin.id,
      email: adminEmail,
      role: admin.role,
    });
  } catch (error) {
    console.error("Seed admin error:", error);
    return NextResponse.json(
      { error: "Failed to seed admin" },
      { status: 500 }
    );
  }
}
