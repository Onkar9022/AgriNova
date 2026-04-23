"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function respondToGrievance(grievanceId: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED", adminResponse: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: Only administrators can respond to grievances");
    }

    if (!grievanceId || !status) {
       throw new Error("Missing required fields");
    }

    const grievance = await prisma.grievance.update({
      where: { id: grievanceId },
      data: {
        status,
        adminResponse: adminResponse || null,
      },
      select: { farmerId: true, title: true }
    });

    // Synthesize a high-priority system notification to visually alert the farmer
    await prisma.notification.create({
       data: {
         userId: grievance.farmerId,
         title: `Grievance Ticket Updated: ${status.replace("_", " ")}`,
         message: `Your ticket "${grievance.title}" has been updated by the administration team.`,
         type: status === "RESOLVED" ? "SUCCESS" : "INFO"
       }
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/grievances");
    return { success: true };
  } catch (error: any) {
    console.error("Grievance response error:", error);
    return { success: false, error: error.message || "Failed to update grievance" };
  }
}
