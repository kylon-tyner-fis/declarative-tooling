import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the exact shape we want the AI to return
const ServiceSchema = z.object({
  label: z.string().describe("A short, catchy name for the service"),
  definition: z
    .string()
    .describe("A clear 1-2 sentence description of what it does"),
  inputSchema: z
    .string()
    .describe("A valid JSON schema definition representing input parameters"),
  outputSchema: z
    .string()
    .describe("A valid JSON schema definition representing the return data"),
});

export async function POST(req: Request) {
  try {
    const { intention } = await req.json();

    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-mini", // Cost-effective and supports structured outputs
      messages: [
        {
          role: "system",
          content:
            "You are an expert software architect. Define technical services based on user intent.",
        },
        {
          role: "user",
          content: `Generate a service definition for: "${intention}"`,
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
