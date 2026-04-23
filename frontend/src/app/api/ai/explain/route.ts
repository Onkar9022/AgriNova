import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { askGemini } from "@/lib/gemini";
import { prisma } from "@/lib/db";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Per-user rate limiting: max 10 requests/minute
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

/**
 * Round values into buckets so close readings share the same cache key
 * pH rounded to nearest 0.5, nutrients to nearest 10, moisture to nearest 5
 */
function buildCacheKey(type: string, data: Record<string, any>): string {
  const roundPh = Math.round((data.ph || 0) * 2) / 2;       // 6.8 → 7.0, 6.3 → 6.5
  const roundN = Math.round((data.n || 0) / 10) * 10;       // 47 → 50, 123 → 120
  const roundP = Math.round((data.p || 0) / 10) * 10;
  const roundK = Math.round((data.k || 0) / 10) * 10;
  const roundM = Math.round((data.moisture || 0) / 5) * 5;  // 23.4 → 25
  const crop = (data.crop || data.fertilizer || "").toLowerCase().trim();

  return `${type}:${crop}:ph${roundPh}:n${roundN}:p${roundP}:k${roundK}:m${roundM}`;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: "Too many AI requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const { type, data } = await request.json();

    // 1. Check database cache first
    const cacheKey = buildCacheKey(type, data);
    try {
      const cached = await prisma.aiCache.findUnique({
        where: { cacheKey },
      });

      if (cached && cached.expiresAt.getTime() > Date.now()) {
        return NextResponse.json({ explanation: cached.explanation, cached: true });
      } else if (cached) {
        // Clean up expired cache entry asynchronously
        prisma.aiCache.delete({ where: { cacheKey } }).catch(() => {});
      }
    } catch (e) {
      console.error("Cache read error:", e);
    }

    // 2. Build prompt
    let prompt = "";

    if (type === "crop_explain") {
      const conf = Number(data.confidence) || 0;
      const confDisplay = conf > 1 ? conf.toFixed(1) : (conf * 100).toFixed(1);
      prompt = `Soil analysis data:
Crop: ${data.crop || "Unknown"} (${confDisplay}% match), pH: ${data.ph ?? "N/A"}, N: ${data.n ?? 0}, P: ${data.p ?? 0}, K: ${data.k ?? 0}, Moisture: ${data.moisture ?? 0}%, Rainfall: ${data.rainfall ?? 0}mm

Write exactly 4 bullet points:
• Why this crop suits these exact soil conditions
• Optimal pH range for ${data.crop || "this crop"} and how this soil compares
• Which nutrients are strong vs deficient for this crop
• One specific tip to maximize yield

RULES: Start directly with the first bullet point. No introduction, no greeting, no preamble. Use • for bullets. Keep each point to 1-2 lines.`;
    } else if (type === "fertilizer_explain") {
      prompt = `Crop: ${data.crop || "Unknown"}, Fertilizer: ${data.fertilizer || "Unknown"}, Soil: N=${data.n ?? 0}, P=${data.p ?? 0}, K=${data.k ?? 0}, pH=${data.ph ?? "N/A"}

Write exactly 3 bullet points:
• Why this fertilizer matches these soil deficiencies
• Best application time and method for ${data.crop || "this crop"}
• One important precaution

RULES: Start directly with the first bullet point. No introduction, no greeting, no preamble. Use • for bullets. Keep each point to 1-2 lines.`;
    } else if (type === "soil_health") {
      prompt = `Soil data: pH=${data.ph ?? "N/A"}, N=${data.n ?? 0}, P=${data.p ?? 0}, K=${data.k ?? 0}, Moisture=${data.moisture ?? 0}%, EC=${data.ec ?? 0}, Temp=${data.soilTemp ?? "N/A"}°C

Write exactly 3 bullet points:
• Overall soil health verdict (good/moderate/poor and why)
• Specific deficiencies or excesses found
• One actionable improvement step

RULES: Start directly with the first bullet point. No introduction, no greeting, no preamble. Use • for bullets. Keep each point to 1-2 lines.`;
    } else if (type === "custom") {
      prompt = `${data.question || "Provide general agricultural advice."}

RULES: Answer in 3-4 bullet points only. Start directly with the first bullet point. No introduction, no greeting, no preamble. Use • for bullets. Be practical and concise.`;
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // 3. Call Gemini
    const result = await askGemini(prompt);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // 4. Store in database cache
    try {
      await prisma.aiCache.upsert({
        where: { cacheKey },
        update: {
          explanation: result.text,
          expiresAt: new Date(Date.now() + CACHE_TTL),
        },
        create: {
          cacheKey,
          explanation: result.text,
          expiresAt: new Date(Date.now() + CACHE_TTL),
        },
      });
    } catch (e) {
      console.error("Cache write error:", e);
    }

    return NextResponse.json({ explanation: result.text, cached: false });
  } catch (error: any) {
    console.error("AI explain error:", error);
    return NextResponse.json(
      { error: "AI service temporarily unavailable" },
      { status: 500 }
    );
  }
}
