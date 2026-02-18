import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ServiceSchema = z.object({
  label: z.string().describe("A short, catchy name for the agent/service"),
  definition: z
    .string()
    .describe("A clear 1-2 sentence description of what this agent does"),
  inputSchema: z
    .string()
    .describe("A valid JSON schema definition representing input parameters"),
  outputSchema: z
    .string()
    .describe("A valid JSON schema definition representing the return data"),
});

export async function POST(req: Request) {
  try {
    const { intention, contextSchema } = await req.json();

    const systemPrompt =
      "You are an expert AI workflow architect. Define agentic services based on user intent. You design systems where agents pass structured data to each other.";

    let userPrompt = `Generate a service definition for: "${intention}"`;

    // If context is provided, enforce it as the input schema
    if (
      contextSchema &&
      contextSchema !== "{}" &&
      contextSchema.trim() !== ""
    ) {
      userPrompt += `\n\n### CRITICAL INPUT CONTEXT ###\nThis agent is receiving data from a previous node. You MUST use the following JSON Schema as the 'inputSchema' for this new service. Do not invent new inputs unless they are auxiliary configuration. The definition should explain how the agent processes this specific input.\n\nPREVIOUS NODE OUTPUT (THIS NODE'S INPUT):\n${contextSchema}`;
    }

    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: zodResponseFormat(ServiceSchema, "service"),
    });

    const result = completion.choices[0].message.parsed;
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate service" },
      { status: 500 },
    );
  }
}
