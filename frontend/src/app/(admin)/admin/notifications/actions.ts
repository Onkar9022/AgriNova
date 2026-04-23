"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function broadcastNotification(title: string, message: string, type: "INFO" | "SUCCESS" | "WARNING" = "INFO", targetedUserId?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: Only administrators can broadcast announcements.");
    }

    if (!title || !message) {
       throw new Error("Title and message are required fields");
    }

    if (targetedUserId) {
      // Send DM
      await prisma.notification.create({
         data: {
            title,
            message,
            type,
            userId: targetedUserId
         }
      });
    } else {
      // Global Broadcast
      await prisma.notification.create({
         data: {
            title,
            message,
            type,
            userId: null
         }
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Broadcast error:", error);
    return { success: false, error: error.message || "Failed to broadcast notification" };
  }
}
// IDE CACHE BREAKER
