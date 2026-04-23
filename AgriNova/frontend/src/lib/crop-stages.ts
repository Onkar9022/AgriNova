/**
 * Crop growth stage logic
 * Calculates current growth stage based on crop name and days since planting
 */

export interface GrowthStage {
  name: string;
  stageNumber: number;
  totalStages: number;
  progress: number; // 0-100%
  description: string;
  nextMilestone: string;
  daysInStage: number;
}

interface CropStageConfig {
  stages: { name: string; daysStart: number; daysEnd: number; description: string }[];
  totalDays: number;
}

const CROP_STAGES: Record<string, CropStageConfig> = {
  rice: {
    totalDays: 120,
    stages: [
      { name: "Germination", daysStart: 0, daysEnd: 14, description: "Seed sprouting and root development" },
      { name: "Tillering", daysStart: 15, daysEnd: 45, description: "Multiple shoots emerge from the base" },
      { name: "Booting", daysStart: 46, daysEnd: 70, description: "Panicle development inside the stem" },
      { name: "Tasseling", daysStart: 71, daysEnd: 90, description: "Flowering and pollination stage" },
      { name: "Grain Fill", daysStart: 91, daysEnd: 110, description: "Grain development and maturation" },
      { name: "Harvest", daysStart: 111, daysEnd: 120, description: "Ready for harvest" },
    ],
  },
  wheat: {
    totalDays: 135,
    stages: [
      { name: "Germination", daysStart: 0, daysEnd: 14, description: "Seed sprouting" },
      { name: "Seedling", daysStart: 15, daysEnd: 30, description: "Early leaf development" },
      { name: "Tillering", daysStart: 31, daysEnd: 60, description: "Multiple shoot growth" },
      { name: "Stem Extension", daysStart: 61, daysEnd: 85, description: "Stem elongation" },
      { name: "Heading", daysStart: 86, daysEnd: 105, description: "Ear emergence" },
      { name: "Ripening", daysStart: 106, daysEnd: 125, description: "Grain maturation" },
      { name: "Harvest", daysStart: 126, daysEnd: 135, description: "Ready for harvest" },
    ],
  },
  maize: {
    totalDays: 110,
    stages: [
      { name: "Emergence", daysStart: 0, daysEnd: 10, description: "Seedling emergence" },
      { name: "Vegetative", daysStart: 11, daysEnd: 40, description: "Leaf and stem growth" },
      { name: "Tasseling", daysStart: 41, daysEnd: 60, description: "Tassel development and pollen shed" },
      { name: "Silking", daysStart: 61, daysEnd: 75, description: "Silk emergence, pollination" },
      { name: "Grain Fill", daysStart: 76, daysEnd: 100, description: "Kernel development" },
      { name: "Harvest", daysStart: 101, daysEnd: 110, description: "Ready for harvest" },
    ],
  },
  cotton: {
    totalDays: 180,
    stages: [
      { name: "Germination", daysStart: 0, daysEnd: 14, description: "Seed sprouting" },
      { name: "Seedling", daysStart: 15, daysEnd: 35, description: "Early growth" },
      { name: "Squaring", daysStart: 36, daysEnd: 70, description: "Flower bud formation" },
      { name: "Flowering", daysStart: 71, daysEnd: 110, description: "Bloom and boll setting" },
      { name: "Boll Development", daysStart: 111, daysEnd: 150, description: "Fiber development" },
      { name: "Harvest", daysStart: 151, daysEnd: 180, description: "Boll opening, ready for picking" },
    ],
  },
  sugarcane: {
    totalDays: 365,
    stages: [
      { name: "Germination", daysStart: 0, daysEnd: 35, description: "Bud sprouting" },
      { name: "Tillering", daysStart: 36, daysEnd: 120, description: "Multiple shoot formation" },
      { name: "Grand Growth", daysStart: 121, daysEnd: 270, description: "Active cane elongation" },
      { name: "Maturation", daysStart: 271, daysEnd: 340, description: "Sugar accumulation" },
      { name: "Harvest", daysStart: 341, daysEnd: 365, description: "Ready for harvest" },
    ],
  },
  soybean: {
    totalDays: 100,
    stages: [
      { name: "Emergence", daysStart: 0, daysEnd: 10, description: "Seedling emergence" },
      { name: "Vegetative", daysStart: 11, daysEnd: 40, description: "Leaf and node development" },
      { name: "Flowering", daysStart: 41, daysEnd: 60, description: "Flower production" },
      { name: "Pod Development", daysStart: 61, daysEnd: 80, description: "Pod filling" },
      { name: "Maturation", daysStart: 81, daysEnd: 95, description: "Seed maturation" },
      { name: "Harvest", daysStart: 96, daysEnd: 100, description: "Ready for harvest" },
    ],
  },
};

// Default stages for crops not explicitly defined
const DEFAULT_STAGES: CropStageConfig = {
  totalDays: 120,
  stages: [
    { name: "Germination", daysStart: 0, daysEnd: 15, description: "Seed sprouting" },
    { name: "Vegetative", daysStart: 16, daysEnd: 50, description: "Leaf and stem growth" },
    { name: "Reproductive", daysStart: 51, daysEnd: 80, description: "Flowering and fruit set" },
    { name: "Maturation", daysStart: 81, daysEnd: 110, description: "Ripening" },
    { name: "Harvest", daysStart: 111, daysEnd: 120, description: "Ready for harvest" },
  ],
};

export function getGrowthStage(
  cropName: string,
  daysSincePlanting: number
): GrowthStage {
  const config = CROP_STAGES[cropName.toLowerCase()] || DEFAULT_STAGES;
  const totalStages = config.stages.length;

  // Find current stage
  let currentStage = config.stages[config.stages.length - 1];
  let stageNumber = totalStages;

  for (let i = 0; i < config.stages.length; i++) {
    if (daysSincePlanting <= config.stages[i].daysEnd) {
      currentStage = config.stages[i];
      stageNumber = i + 1;
      break;
    }
  }

  // Calculate progress within current stage
  const stageDuration = currentStage.daysEnd - currentStage.daysStart;
  const daysIntoStage = daysSincePlanting - currentStage.daysStart;
  const progress = Math.min(
    100,
    Math.round((daysIntoStage / stageDuration) * 100)
  );

  // Next milestone
  const nextStage =
    stageNumber < totalStages ? config.stages[stageNumber] : null;
  const nextMilestone = nextStage
    ? `${nextStage.name} in ${currentStage.daysEnd - daysSincePlanting} days`
    : "Crop is ready for harvest";

  return {
    name: currentStage.name,
    stageNumber,
    totalStages,
    progress: Math.max(0, Math.min(100, (daysSincePlanting / config.totalDays) * 100)),
    description: currentStage.description,
    nextMilestone,
    daysInStage: Math.max(0, daysIntoStage),
  };
}
