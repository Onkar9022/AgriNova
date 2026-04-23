import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: any }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const reading = await prisma.soilReading.findUnique({
      where: { id },
      include: { prediction: true }
    });

    if (!reading || reading.farmerId !== session.user.id) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    if (!reading.prediction) {
       return NextResponse.json({ error: "Prediction data missing" }, { status: 404 });
    }

    // Map DB structure to expected frontend AnalysisResult structure
    const result = {
      recordId: reading.id,
      timestamp: reading.createdAt,
      farmerId: reading.farmerId,
      crop: {
        top_crop: reading.prediction.cropRank1,
        confidence: reading.prediction.cropRank1Confidence,
        rank_2: reading.prediction.cropRank2,
        rank_2_confidence: reading.prediction.cropRank2Confidence,
        rank_3: reading.prediction.cropRank3,
        rank_3_confidence: reading.prediction.cropRank3Confidence,
        ph_status: reading.prediction.phStatus,
        n_status: reading.prediction.nStatus,
        p_status: reading.prediction.pStatus,
        k_status: reading.prediction.kStatus,
        explanation: { factors: reading.prediction.explanationReasons || [] }
      },
      fertilizer: {
        fertilizer_name: reading.prediction.fertilizerName,
        dose_per_acre: reading.prediction.fertilizerDosageKgAcre,
      },
      growthStage: reading.prediction.growthStage ? { name: reading.prediction.growthStage } : null,
      season: reading.season,
      soilReading: {
        nitrogenN: reading.nitrogenN,
        phosphorusP: reading.phosphorusP,
        potassiumK: reading.potassiumK,
        ph: reading.ph,
        moisture: reading.moisture,
        temperatureSoil: reading.temperatureSoil,
        ec: reading.ec,
        cropPlanted: reading.cropPlanted,
        plantedCropName: reading.plantedCropName,
        daysSincePlanting: reading.prediction.daysSincePlanting
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching history record:", error);
    return NextResponse.json({ error: "Failed to fetch record" }, { status: 500 });
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: any }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Verify ownership
    const reading = await prisma.soilReading.findUnique({
      where: { id },
    });

    if (!reading || reading.farmerId !== session.user.id) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    // Delete record (cascade should ideally drop related predictions, 
    // but Prisma sometimes needs explicit drops depending on relation settings)
    await prisma.prediction.deleteMany({
      where: { readingId: id }
    });

    await prisma.soilReading.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting history record:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
