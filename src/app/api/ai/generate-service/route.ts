import { NextResponse } from "next/server";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ServiceSchema = z.object({
  label: z.string(),
  definition: z.string(),
  inputSchema: z
    .string()
    .describe("JSON schema for inputs required from upstream."),
  // Updated: Logical and Display data merged here
  outputSchema: z
    .string()
    .describe(
      "JSON schema for all outputs. To mark a property as display-only (not passed downstream), add 'displayOnly': true to its definition.",
    ),
  plugins: z
    .array(
      z.object({
        pluginId: z.string(),
        label: z.string(),
        targetProperty: z.string(),
        config: z.array(z.object({ key: z.string(), value: z.string() })),
      }),
    )
    .describe("Mapping of schema properties to UI widgets."),
});

export async function POST(req: Request) {
  try {
    const { intention, contextSchema, nodeType } = await req.json();
    const isDataNode = nodeType === "data";

    let systemPrompt = "";
    let userPrompt = "";

    if (isDataNode) {
      systemPrompt = "Expert Data Architect. Define raw payload schemas.";
      userPrompt = `Define data for: "${intention}". inputSchema/displaySchema must be '{}'. plugins must be [].`;
    } else {
      // Inside the POST handler in src/app/api/ai/generate-service/route.ts
      systemPrompt = `You are an expert AI workflow architect.
Every single data property in inputSchema and outputSchema MUST be mapped to a UI widget.

WIDGETS:
- 'standard-input': Default for basic data.
- 'code-editor': For code/logic.
- 'markdown-viewer': For long-form text.

STRICT RULE:
The 'plugins' array MUST contain exactly one entry for every key found in 'inputSchema' and 'outputSchema'. 
The 'targetProperty' field in the plugin must match the schema key exactly.`;
      userPrompt = `Generate service: "${intention}". Context: ${contextSchema || "{}"}`;
    }

    const completion = await openai.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: zodResponseFormat(ServiceSchema, "service"),
    });

    return NextResponse.json(completion.choices[0].message.parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
