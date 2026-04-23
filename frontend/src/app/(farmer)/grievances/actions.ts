"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { grievanceSchema } from "@/lib/validators";

export async function submitGrievance(data: z.infer<typeof grievanceSchema>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Validate the input
    const validData = grievanceSchema.parse(data);

    // Insert into database
    await prisma.grievance.create({
      data: {
        farmerId: session.user.id,
        title: validData.title,
        description: validData.description,
        status: "OPEN",
      },
    });

    revalidatePath("/grievances");
    return { success: true };
  } catch (error: any) {
    console.error("Grievance submission error:", error);
    return { success: false, error: error.message || "Failed to submit grievance" };
  }
}
