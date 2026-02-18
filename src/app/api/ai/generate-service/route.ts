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
    const body = await req.json();
    const { intention, contextSchema, nodeType } = body;
    const isDataNode = nodeType === "data";

    // DEBUG: Log the incoming request data
    console.log(">>> [DEBUG] AI Generate Request:", { nodeType, intention });

    let systemPrompt = "";
    let userPrompt = "";

    if (isDataNode) {
      systemPrompt =
        "You are an expert Data Architect. Your job is to define structured data schemas based on user intent. You ignore input context and focus purely on defining the data payload requested.";
      userPrompt = `Define a data schema for: "${intention}". \n\nEnsure 'outputSchema' is a valid JSON schema representing this data. 'inputSchema' should be an empty object '{}'.`;
    } else {
      systemPrompt =
        "You are an expert AI workflow architect. Define agentic services based on user intent. You design systems where agents pass structured data to each other.";
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

    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: zodResponseFormat(ServiceSchema, "service"),
    });

    const result = completion.choices[0].message.parsed;

    // DEBUG: Log the raw parsed result from OpenAI
    console.log(
      ">>> [DEBUG] OpenAI Parsed Result:",
      JSON.stringify(result, null, 2),
    );

    if (!result) {
      console.error(
        ">>> [DEBUG] OpenAI failed to parse response into the expected schema.",
      );
      return NextResponse.json(
        { error: "AI failed to produce valid schema data" },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    // DEBUG: Log the full error stack
    console.error(">>> [DEBUG] OpenAI Route Error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to generate service" },
      { status: 500 },
    );
  }
}
