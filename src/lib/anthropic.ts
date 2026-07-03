import Anthropic from "@anthropic-ai/sdk";
import { truncate } from "@/lib/utils";

const SYSTEM_PROMPT = `You are a Pinterest SEO copywriter. Respond with ONLY raw JSON, no markdown fences: { "title" (max 100 chars, keyword-rich), "description" (max 480 chars, natural keyword usage, ending with 4-6 relevant hashtags), "alt_text" (max 120 chars, literal image description) }`;

export interface GeneratedMetadata {
  title: string;
  description: string;
  alt_text: string;
}

function parseJsonResponse(text: string): GeneratedMetadata {
  let cleaned = text.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(cleaned) as Partial<GeneratedMetadata>;

  return {
    title: truncate(String(parsed.title ?? ""), 100),
    description: truncate(String(parsed.description ?? ""), 480),
    alt_text: truncate(String(parsed.alt_text ?? ""), 120),
  };
}

export async function generatePinMetadata(
  imageUrl: string,
  topic: string,
  keywords: string
): Promise<GeneratedMetadata> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: imageUrl },
          },
          {
            type: "text",
            text: `Topic: ${topic}\nKeywords: ${keywords}`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Anthropic");
  }

  try {
    return parseJsonResponse(textBlock.text);
  } catch {
    throw new Error(`Failed to parse AI response: ${textBlock.text.slice(0, 200)}`);
  }
}
