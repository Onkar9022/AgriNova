import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      password,
      state,
      district,
      taluka,
      soilType,
      irrigationType,
      landAreaAcres,
      primaryCrop,
      gpsLat,
      gpsLng,
    } = body;

    // Validate required fields
    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "Name, phone, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this phone number already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        passwordHash,
        role: "FARMER",
        state: state || null,
        district: district || null,
        taluka: taluka || null,
        soilType: soilType || null,
        irrigationType: irrigationType || null,
        landAreaAcres: landAreaAcres || null,
        primaryCrop: primaryCrop || null,
        gpsLat: gpsLat || null,
        gpsLng: gpsLng || null,
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
