import { NextResponse } from "next/server";
import { predictCrop, predictFertilizer } from "@/lib/ml-client";
import { fetchWeatherData, getCurrentSeason } from "@/lib/weather";
import { getGrowthStage } from "@/lib/crop-stages";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PHStatus, NutrientStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      nitrogenN,
      phosphorusP,
      potassiumK,
      ph,
      moisture,
      temperatureSoil,
      ec,
      previousCrop,
      cropPlanted,
      plantedCropName,
      plantingDate,
      // Farmer profile data
      soilType = "BLACK_COTTON",
      irrigationType = "DRIP",
      landAreaAcres = 1,
      gpsLat,
      gpsLng,
      farmerId,
    } = body;

    // Server-side validation
    const validationErrors: string[] = [];
    if (nitrogenN == null || isNaN(nitrogenN) || nitrogenN < 0 || nitrogenN > 1999)
      validationErrors.push("Nitrogen (N) must be 0-1999");
    if (phosphorusP == null || isNaN(phosphorusP) || phosphorusP < 0 || phosphorusP > 1999)
      validationErrors.push("Phosphorus (P) must be 0-1999");
    if (potassiumK == null || isNaN(potassiumK) || potassiumK < 0 || potassiumK > 1999)
      validationErrors.push("Potassium (K) must be 0-1999");
    if (ph == null || isNaN(ph) || ph < 0 || ph > 14)
      validationErrors.push("pH must be 0-14");
    if (moisture == null || isNaN(moisture) || moisture < 0 || moisture > 100)
      validationErrors.push("Moisture must be 0-100%");
    if (temperatureSoil == null || isNaN(temperatureSoil) || temperatureSoil < -40 || temperatureSoil > 80)
      validationErrors.push("Soil temperature must be -40 to 80°C");
    if (ec == null || isNaN(ec) || ec < 0 || ec > 10000)
      validationErrors.push("EC must be 0-10000");
    if (cropPlanted && !plantedCropName)
      validationErrors.push("Planted crop name is required when crop is planted");
    if (cropPlanted && plantingDate && new Date(plantingDate) > new Date())
      validationErrors.push("Planting date cannot be in the future");

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    // Step 1: Fetch weather data using GPS
    const weather = await fetchWeatherData(
      gpsLat || 18.5, // Default to Pune coordinates
      gpsLng || 73.85
    );

    // Step 2: Determine season
    const season = getCurrentSeason();

    // Step 3: Call ML server for crop and fertilizer predictions in parallel
    const cropForFertilizer = cropPlanted ? plantedCropName : "Unknown";

    const [cropResult, fertilizerResult] = await Promise.all([
      predictCrop({
        n: nitrogenN,
        p: phosphorusP,
        k: potassiumK,
        ph,
        moisture,
        soil_temp: temperatureSoil,
        ec,
        rainfall: weather.rainfall,
        air_temp: weather.airTemp,
        humidity: weather.humidity,
        season,
        soil_type: soilType,
      }),
      predictFertilizer({
        crop_name: cropForFertilizer,
        n: nitrogenN,
        p: phosphorusP,
        k: potassiumK,
        soil_type: soilType,
        moisture,
        temperature: weather.airTemp,
        humidity: weather.humidity,
        rainfall: weather.recentRainfall,
        growth_stage: cropPlanted ? "VEGETATIVE" : undefined,
        land_area_acres: landAreaAcres,
      })
    ]);

    // Step 5: Calculate growth stage if crop is planted
    let growthStage = null;
    if (cropPlanted && plantedCropName && plantingDate) {
      const daysSincePlanting = Math.floor(
        (Date.now() - new Date(plantingDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      growthStage = getGrowthStage(plantedCropName, daysSincePlanting);
    }

    // Get Session for Secure Farmer Attachment
    const session = await getServerSession(authOptions);
    const resolvedFarmerId = session?.user?.id || farmerId;
    
    // Aesthetic crop name for UI imagery
    const targetCrop = cropPlanted ? (plantedCropName || cropResult.top_crop) : cropResult.top_crop;
    const randomSeed = Math.floor(Math.random() * 999999);
    const aestheticImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(targetCrop)}%20growing%20in%20a%20vibrant%20farm%20field?width=800&height=400&nologo=true&seed=${randomSeed}`;

    let readingRecordId = null;

    if (resolvedFarmerId) {
       // Save to database
       const newReading = await prisma.soilReading.create({
         data: {
           farmerId: resolvedFarmerId,
           nitrogenN,
           phosphorusP,
           potassiumK,
           ph,
           moisture,
           temperatureSoil,
           ec,
           rainfallMm: weather.rainfall,
           airTemp: weather.airTemp,
           airHumidity: weather.humidity,
           season: season,
           previousCrop,
           cropPlanted,
           plantedCropName,
           plantingDate: plantingDate ? new Date(plantingDate) : null,
           inputSource: "MANUAL",
         }
       });
       readingRecordId = newReading.id;

       await prisma.prediction.create({
         data: {
           readingId: newReading.id,
           farmerId: resolvedFarmerId,
           cropRank1: cropResult.top_crop,
           cropRank1Confidence: cropResult.confidence,
           cropRank2: cropResult.rank_2,
           cropRank2Confidence: cropResult.rank_2_confidence,
           cropRank3: cropResult.rank_3,
           cropRank3Confidence: cropResult.rank_3_confidence,
           fertilizerName: fertilizerResult.fertilizer_name,
           fertilizerDosageKgAcre: fertilizerResult.dose_per_acre,
           phStatus: (cropResult.ph_status as string).toUpperCase() as PHStatus,
           nStatus: (cropResult.n_status as string).toUpperCase() as NutrientStatus,
           pStatus: (cropResult.p_status as string).toUpperCase() as NutrientStatus,
           kStatus: (cropResult.k_status as string).toUpperCase() as NutrientStatus,
           growthStage: growthStage ? String(growthStage) : null,
           daysSincePlanting: cropPlanted && plantingDate 
            ? Math.floor((Date.now() - new Date(plantingDate).getTime()) / (1000 * 60 * 60 * 24))
            : null,
           moistureContent: moisture,
           explanationReasons: cropResult.explanation 
            ? JSON.parse(JSON.stringify(cropResult.explanation.factors))
            : [],
         }
       });
    }

    // Step 6: Build response
    const result = {
      // Identity
      recordId: readingRecordId,
      // Crop recommendation
      crop: cropResult,
      // Fertilizer recommendation
      fertilizer: fertilizerResult,
      // Imagery
      aestheticImageUrl,
      // Growth stage (if planted)
      growthStage,
      // Weather data used
      weather,
      // Season
      season,
      // Input data for reference
      soilReading: {
        nitrogenN,
        phosphorusP,
        potassiumK,
        ph,
        moisture,
        temperatureSoil,
        ec,
        cropPlanted,
        plantedCropName,
        daysSincePlanting: cropPlanted && plantingDate 
            ? Math.floor((Date.now() - new Date(plantingDate).getTime()) / (1000 * 60 * 60 * 24))
            : null,
      },
      // Metadata
      timestamp: new Date().toISOString(),
      farmerId: resolvedFarmerId,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Soil prediction error:", error);
    return NextResponse.json(
      {
        error: "Failed to process soil analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
