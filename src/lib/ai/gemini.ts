import { buildReviewPrompt, type ReviewPromptInput } from "@/lib/ai/prompts";
import type { ReviewSuggestion } from "@/types";

const MODELS = [
  "gemini-3.1-flash-lite-preview",
  "gemini-flash-latest",
  process.env.GEMINI_MODEL,
].filter((model, index, list): model is string => Boolean(model) && list.indexOf(model) === index);

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
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
  error?: { message?: string };
}) {
  if (payload.error?.message) {
    throw new Error(payload.error.message);
  }
  const text = (payload.candidates?.[0]?.content?.parts ?? [])
    .filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return text;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

async function callModel(apiKey: string, model: string, prompt: string, options?: { temperature?: number; systemInstruction?: string }) {
  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
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
      signal: AbortSignal.timeout(20000),
    }
  );

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new GeminiError(payload.error?.message ?? `Gemini ${model} failed (${response.status})`, response.status);
  }

  return extractText(payload);
}

export async function generateGeminiJson(
  prompt: string,
  options?: { temperature?: number; systemInstruction?: string }
) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiError("GEMINI_API_KEY is not configured", 500);
  }

  let lastError: unknown;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await callModel(apiKey, model, prompt, options);
      } catch (error) {
        lastError = error;
        const status = error instanceof GeminiError ? error.status : 0;
        console.error(`[gemini] ${model} failed:`, error instanceof Error ? error.message : error);
        if (status === 503 || status === 429) {
          await sleep(800 * 2 ** attempt);
          if (attempt === 0) continue;
        }
        break;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new GeminiError("Gemini request failed");
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
