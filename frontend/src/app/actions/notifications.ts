"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const NOTIFICATION_TIMEOUT = 800; // 800ms max

export async function getNotifications() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, data: [] };

    // Race between DB query and timeout to avoid blocking dashboard
    const notifications = await Promise.race([
      prisma.notification.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            { userId: null }
          ]
        },
        orderBy: { createdAt: "desc" },
        take: 10
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Notification fetch timeout")), NOTIFICATION_TIMEOUT)
      ),
    ]);

    return { success: true, data: notifications || [] };
  } catch (error) {
    console.error("Notifications error:", (error as Error).message);
    return { success: false, data: [] };
  }
}
