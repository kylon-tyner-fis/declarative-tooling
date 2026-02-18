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
      "A valid JSON schema definition representing input parameters (Empty object for Data nodes)",
    ),
  outputSchema: z
    .string()
    .describe("A valid JSON schema definition representing the return data"),
});

export async function POST(req: Request) {
  try {
    const { intention, contextSchema, nodeType } = await req.json();
    const isDataNode = nodeType === "data";

    let systemPrompt = "";
    let userPrompt = "";

    if (isDataNode) {
      // ... existing data node logic
    } else {
      systemPrompt = "You are an expert AI workflow architect...";
      userPrompt = `Generate a service definition for: "${intention}"`;

      if (contextSchema && contextSchema.trim() !== "") {
        userPrompt += `
### CRITICAL INPUT CONTEXT ###
This agent is receiving data from previous nodes. 

YOUR TASK:
1. Parse the provided context below.
2. The 'inputSchema' you return MUST be a merge of ALL properties found in the context.
3. Do not omit any existing fields like "code" or "challengeDescription".
4. If the user's intention requires NEW inputs (auxiliary config), add them as additional properties.

PREVIOUS NODE OUTPUTS (CONTEXT):
${contextSchema}`;
      }
    }
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate service" },
      { status: 500 },
    );
  }
}
