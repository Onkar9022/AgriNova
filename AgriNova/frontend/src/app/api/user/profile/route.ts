import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    const allowedUpdates = {
      name: data.name ?? undefined,
      state: data.state ?? undefined,
      district: data.district ?? undefined,
      taluka: data.taluka ?? undefined,
      primaryCrop: data.primaryCrop ?? undefined,
      landAreaAcres: data.landAreaAcres ? parseFloat(data.landAreaAcres) : undefined,
      irrigationType: data.irrigationType ?? undefined,
    };

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: allowedUpdates,
    });

    return NextResponse.json({ message: "Profile updated successfully.", user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
