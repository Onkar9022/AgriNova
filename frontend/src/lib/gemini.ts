/**
 * Gemini AI Client — Server-side only
 * Uses Gemini 3 Flash Preview for fast, contextual agricultural insights
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiResponse {
  text: string;
  error?: string;
}

export async function askGemini(prompt: string): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    return { text: "", error: "Gemini API key not configured" };
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
          topP: 0.9,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return { text: "", error: `Gemini API returned ${response.status}` };
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return { text };
  } catch (error: any) {
    console.error("Gemini request failed:", error.message);
    return { text: "", error: error.message };
  }
}

