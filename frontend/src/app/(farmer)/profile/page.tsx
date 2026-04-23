import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProfileForm from "./ProfileForm";


export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar userName={user.name} role={user.role} />
      
      <main className="page-container animate-fade-in">
        <div style={{ marginBottom: "2rem" }}>
          <p className="section-label">ACCOUNT MANAGER</p>
          <h1 className="section-title">Farmer Profile</h1>
          <p className="section-subtitle">
            Manage your personal details and adjust your farm's active metrics.
          </p>
        </div>

        <div className="card">
           <ProfileForm initialData={user} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
