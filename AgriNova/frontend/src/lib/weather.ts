/**
 * OpenWeatherMap API integration
 * Auto-fetches air temperature, humidity, and rainfall using farmer GPS
 */

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

export interface WeatherData {
  airTemp: number;
  humidity: number;
  rainfall: number;        // Estimated annual rainfall (mm) — for crop prediction
  recentRainfall: number;  // Last 1h measured rainfall (mm) — for irrigation decisions
  description: string;
}

export async function fetchWeatherData(
  lat: number,
  lng: number
): Promise<WeatherData> {
  if (!API_KEY || API_KEY === "YOUR_OPENWEATHER_API_KEY") {
    // Fallback with reasonable defaults for Maharashtra
    console.warn("OpenWeatherMap API key not configured. Using defaults.");
    return {
      airTemp: 28.0,
      humidity: 65.0,
      rainfall: 800.0,
      recentRainfall: 0.0,
      description: "Default values (API key not set)",
    };
  }

  try {
    // Current weather for temp and humidity
    const currentResponse = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lng}&appid=${API_KEY}&units=metric`
    );
    const currentData = await currentResponse.json();

    // Historical data for rainfall (approximate annual)
    // Using current month's rainfall × 12 as rough estimate
    const airTemp = currentData.main?.temp ?? 28.0;
    const humidity = currentData.main?.humidity ?? 65.0;
    const rainToday = currentData.rain?.["1h"] ?? 0;

    // Estimate annual rainfall based on location and current conditions
    // For more accuracy, use climate data API
    const estimatedAnnualRainfall = estimateAnnualRainfall(lat, lng, humidity);

    return {
      airTemp: Math.round(airTemp * 10) / 10,
      humidity: Math.round(humidity * 10) / 10,
      rainfall: estimatedAnnualRainfall,
      recentRainfall: rainToday,
      description: currentData.weather?.[0]?.description ?? "unknown",
    };
  } catch (error) {
    console.error("Weather API error:", error);
    return {
      airTemp: 28.0,
      humidity: 65.0,
      rainfall: 800.0,
      recentRainfall: 0.0,
      description: "Error fetching weather (using defaults)",
    };
  }
}

/**
 * Estimate annual rainfall based on GPS coordinates
 * Maharashtra rainfall zones (approximate):
 * - Konkan coast: 2000-4000mm
 * - Western Ghats: 1000-2500mm
 * - Marathwada: 600-900mm
 * - Vidarbha: 800-1200mm
 */
function estimateAnnualRainfall(
  lat: number,
  lng: number,
  humidity: number
): number {
  // Simple heuristic based on longitude (west = more rain in Maharashtra)
  if (lng < 74) return 2500; // Konkan
  if (lng < 75.5) return 1500; // Western Maharashtra
  if (lng < 77) return 750; // Marathwada
  return 1000; // Vidarbha

  // Override with humidity-based estimate if lat/lng not in Maharashtra range
  // return humidity > 70 ? 1200 : humidity > 50 ? 800 : 500;
}

/**
 * Determine current growing season based on date
 */
export function getCurrentSeason(): "KHARIF" | "RABI" | "ZAID" {
  const month = new Date().getMonth() + 1; // 1-12

  if (month >= 6 && month <= 10) return "KHARIF"; // June-October
  if (month >= 11 || month <= 3) return "RABI"; // November-March
  return "ZAID"; // April-June
}
