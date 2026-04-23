import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import GrievanceClient from "./GrievanceClient";

export const dynamic = "force-dynamic";

export default async function GrievancePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch only grievances belonging to this specific farmer, latest first
  const historicalGrievances = await prisma.grievance.findMany({
    where: { farmerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const serializedData = historicalGrievances.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    status: g.status,
    adminResponse: g.adminResponse,
    createdAt: g.createdAt.toISOString(),
    updatedAt: g.updatedAt.toISOString(),
  }));

  return <GrievanceClient historicalGrievances={serializedData} />;
}
