import { generateGeminiJson } from "@/lib/ai/gemini";
import { buildWaiterUserPrompt, WAITER_SYSTEM_PROMPT, type WaiterPromptInput } from "@/lib/ai/waiter-prompt";

export type WaiterRecommendation = {
  id: string;
  name: string;
  reason: string;
};

export type WaiterReply = {
  reply: string;
  language: "en" | "hi" | "mr";
  recommendations: WaiterRecommendation[];
  upsell: WaiterRecommendation | null;
  followUp: string;
};

function asRec(value: unknown): WaiterRecommendation | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const name = String(row.name || "").trim();
  const id = String(row.id || "").trim();
  if (!name && !id) return null;
  return {
    id,
    name,
    reason: String(row.reason || "").trim().slice(0, 160),
  };
}

export function parseWaiterReply(raw: string): WaiterReply {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const jsonText = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  const parsed = JSON.parse(jsonText) as Record<string, unknown>;
  const language = parsed.language === "hi" || parsed.language === "mr" ? parsed.language : "en";
  const recs = Array.isArray(parsed.recommendations)
    ? parsed.recommendations.map(asRec).filter((item): item is WaiterRecommendation => Boolean(item)).slice(0, 3)
    : [];
  return {
    reply: String(parsed.reply || "").trim().slice(0, 900) || "I'm here to help with our cafe menu.",
    language,
    recommendations: recs,
    upsell: asRec(parsed.upsell),
    followUp: String(parsed.followUp || "").trim().slice(0, 160),
  };
}

export async function generateWaiterReply(input: WaiterPromptInput): Promise<WaiterReply> {
  const raw = await generateGeminiJson(buildWaiterUserPrompt(input), {
    temperature: 0.4,
    systemInstruction: WAITER_SYSTEM_PROMPT,
  });
  try {
    return parseWaiterReply(raw);
  } catch {
    return {
      reply: "I'm not completely sure about that. Let me ask one of our staff members.",
      language: "en",
      recommendations: [],
      upsell: null,
      followUp: "",
    };
  }
}
