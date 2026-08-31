import { buildReviewPrompt, type ReviewPromptInput } from "@/lib/ai/prompts";
import type { ReviewSuggestion } from "@/types";

const MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.6-flash",
  "gemini-flash-latest",
].filter((model): model is string => Boolean(model));

function parseReviews(raw: string): string[] {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const jsonText = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  const parsed = JSON.parse(jsonText) as { reviews?: unknown };
  if (!Array.isArray(parsed.reviews) || parsed.reviews.length < 3) {
    throw new Error("Gemini returned an unexpected shape");
  }
  return parsed.reviews.slice(0, 3).map((item) => String(item).trim()).filter(Boolean);
}

function extractText(payload: {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
}) {
  if (payload.error?.message) {
    throw new Error(payload.error.message);
  }
  const text = (payload.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return text;
}

async function generateWithModel(apiKey: string, model: string, prompt: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.95,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Gemini ${model} failed (${response.status})`);
  }

  return parseReviews(extractText(payload));
}

export async function generateReviewSuggestions(
  input: ReviewPromptInput
): Promise<ReviewSuggestion[]> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = buildReviewPrompt(input);
  let lastError: unknown;

  for (const model of MODELS) {
    try {
      const reviews = await generateWithModel(apiKey, model, prompt);
      return reviews.map((review, index) => ({
        id: `suggestion-${index + 1}`,
        text: review,
      }));
    } catch (error) {
      lastError = error;
      console.error(`[gemini] ${model} failed:`, error instanceof Error ? error.message : error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini request failed");
}
