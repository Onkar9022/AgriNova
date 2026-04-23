import { prisma } from "@/lib/db";
import { AdminClient } from "./AdminClient";

// Prevents static caching so the dashboard is always live
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Sequential fetch: Bypasses strict connection limits on pgBouncer
  const farmersData = await prisma.user.findMany({
    where: { role: "FARMER" },
    include: { _count: { select: { soilReadings: true } } },
    orderBy: { createdAt: "desc" },
  });

  const grievancesData = await prisma.grievance.findMany({
    include: { farmer: { select: { name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalReadingsCount = await prisma.soilReading.count();

  // Map the Prisma data explicitly to format the Client UI expects
  const serializedFarmers = farmersData.map((farmer: any) => ({
    id: farmer.id,
    name: farmer.name,
    phone: farmer.phone,
    district: farmer.district,
    taluka: farmer.taluka,
    state: farmer.state,
    soilType: farmer.soilType,
    landAreaAcres: farmer.landAreaAcres,
    totalReadings: farmer._count.soilReadings,
    createdAt: farmer.createdAt.toISOString()
  }));

  const serializedGrievances = grievancesData.map((g: any) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    status: g.status,
    createdAt: g.createdAt.toISOString(),
    farmer: { name: g.farmer.name }
  }));

  return (
    <AdminClient 
      farmers={serializedFarmers} 
      grievances={serializedGrievances} 
      totalReadings={totalReadingsCount} 
    />
  );
}
