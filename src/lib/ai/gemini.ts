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

export async function generateGeminiJson(
  prompt: string,
  options?: { temperature?: number; systemInstruction?: string }
) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  let lastError: unknown;
  for (const model of MODELS) {
    try {
      const body: Record<string, unknown> = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.95,
          responseMimeType: "application/json",
        },
      };
      if (options?.systemInstruction) {
        body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
      }
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(body),
        }
      );
      const payload = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(payload.error?.message ?? `Gemini ${model} failed (${response.status})`);
      }
      return extractText(payload);
    } catch (error) {
      lastError = error;
      console.error(`[gemini] ${model} failed:`, error instanceof Error ? error.message : error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini request failed");
}

export async function generateReviewSuggestions(
  input: ReviewPromptInput
): Promise<ReviewSuggestion[]> {
  const prompt = buildReviewPrompt(input);
  const raw = await generateGeminiJson(prompt, { temperature: 0.95 });
  const reviews = parseReviews(raw);
  return reviews.map((review, index) => ({
    id: `suggestion-${index + 1}`,
    text: review,
  }));
}
