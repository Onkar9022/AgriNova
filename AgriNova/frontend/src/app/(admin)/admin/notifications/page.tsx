import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminNotificationClient } from "./AdminNotificationClient";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Admin can select specific farmers
  const farmers = await prisma.user.findMany({
    where: { role: "FARMER" },
    select: { id: true, name: true, phone: true }
  });

  // Admin sees all historically dispatched notification blasts
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } }
  });

  return <AdminNotificationClient farmers={farmers} history={notifications} />;
}
// END OF FILE - CACHE BREAKER
