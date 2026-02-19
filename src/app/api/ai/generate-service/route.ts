import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ServiceSchema = z.object({
  label: z
    .string()
    .describe("A short, catchy name for the agent or data payload"),
  definition: z
    .string()
    .describe(
      "A description of what this agent does or what this data contains",
    ),
  inputSchema: z
    .string()
    .describe(
      "A valid JSON schema definition representing the inputs this agent requires.",
    ),
  outputSchema: z
    .string()
    .describe(
      "JSON schema for data that MUST be passed downstream to subsequent agents.",
    ),
  displaySchema: z
    .string()
    .describe(
      "JSON schema for artifacts used ONLY for display in the current step (e.g. status reports, narrative text, summaries). Not passed downstream.",
    ), // NEW
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { intention, contextSchema, nodeType } = body;
    const isDataNode = nodeType === "data";

    let systemPrompt = "";
    let userPrompt = "";

    if (isDataNode) {
      systemPrompt =
        "You are an expert Data Architect. Define the structure of a raw data payload based on user intent.";
      userPrompt = `Define data schema for: "${intention}". \n\n'inputSchema' and 'displaySchema' should be empty objects '{}'.`;
    } else {
      systemPrompt = `You are an expert AI workflow architect. 
      You design agentic services that process data. You distinguish strictly between:
      1. 'outputSchema': The core structured data required for the next agent in the sequence to function.
      2. 'displaySchema': Information that is purely for the user's benefit at this specific stage (e.g., an explanation of why a code failed, a summary of a character's backstory, or a visual status update). This data is NOT used as logic input by downstream nodes.`;

      userPrompt = `Generate a service definition for: "${intention}"`;

      if (
        contextSchema &&
        contextSchema.trim() !== "" &&
        contextSchema !== "{}"
      ) {
        userPrompt += `\n\n### INPUT CONTEXT ###\nThis agent receives these properties from upstream. Incorporate them into your 'inputSchema' configuration as needed:\n${contextSchema}`;
      }
    }

    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: zodResponseFormat(ServiceSchema, "service"),
    });

    const result = completion.choices[0].message.parsed;

    if (!result) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate service" },
      { status: 500 },
    );
  }
}
