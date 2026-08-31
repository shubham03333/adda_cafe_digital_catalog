import type { LanguageCode } from "@/lib/branding";

export type ReviewPromptInput = {
  cafeName: string;
  rating: number;
  orderedItems: string[];
  service?: string;
  recommend?: string;
  language: LanguageCode;
};

const LANGUAGE_LABEL: Record<LanguageCode, string> = {
  en: "English",
  hi: "Hindi (Devanagari)",
  mr: "Marathi (Devanagari)",
};

export function buildReviewPrompt(input: ReviewPromptInput): string {
  const items =
    input.orderedItems.length > 0
      ? input.orderedItems.join(", ")
      : "the guest did not specify dishes";
  const service = input.service ?? "not specified";
  const recommend = input.recommend ?? "not specified";

  return `You write short Google reviews as a real guest at ${input.cafeName} cafe.

Task: write EXACTLY 3 unique review texts that a real customer would paste on Google.

Guest signals:
- Star rating: ${input.rating} out of 5
- What they ordered: ${items}
- Service: ${service}
- Would recommend: ${recommend}

Write like a person, but be specific. Each review should naturally include:
- The cafe name "${input.cafeName}" once
- Exact dish names from the order list when they are known (for example Paneer Mak Burger, Peri Peri Fries, Chilax Cold Coffee, mocktail)
- Concrete food words: crispy, cheesy, spicy, chilled, grilled, filling
- Service and vibe in one short phrase (friendly staff, quick counter, casual hangout)

Hard rules:
- Language: ${LANGUAGE_LABEL[input.language]}
- Each review must be 40 to 80 words
- Sound human, not like an ad or SEO blog
- Do not repeat the same dish sentence in all three reviews
- No emojis, hashtags, or quotation marks around the reviews
- No keyword stuffing, no "best cafe near me", no ranking talk, no "hidden gem" cliches
- No phrases like "as an AI", "culinary experience", "taste buds", "must-visit destination"

Return ONLY valid JSON with this shape:
{"reviews":["review one","review two","review three"]}`;
}
