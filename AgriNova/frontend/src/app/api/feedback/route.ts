import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { predictionId, followedRecommendation, actualCropPlanted, outcomeRating, notes } = body;

    if (!predictionId) {
      return NextResponse.json({ error: "Prediction ID is required" }, { status: 400 });
    }

    // Verify prediction belongs to user
    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction || prediction.farmerId !== session.user.id) {
      return NextResponse.json({ error: "Prediction not found or forbidden" }, { status: 404 });
    }

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        predictionId,
        farmerId: session.user.id,
        followedRecommendation: Boolean(followedRecommendation),
        actualCropPlanted: followedRecommendation ? prediction.cropRank1 : actualCropPlanted,
        outcomeRating: outcomeRating ? Number(outcomeRating) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, data: feedback }, { status: 201 });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
