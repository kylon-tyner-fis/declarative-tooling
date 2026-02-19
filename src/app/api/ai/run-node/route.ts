import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { definition, inputData, outputSchema, displaySchema } =
      await req.json();

    const systemPrompt = `You are an AI agent executing a workflow task.
    
    YOUR GOAL:
    ${definition}

    YOUR OUTPUT STRUCTURE:
    You must return a single JSON object with EXACTLY two keys:
    1. "output": Data matching this schema: ${JSON.stringify(outputSchema)}
    2. "display": UI artifacts matching this schema: ${JSON.stringify(displaySchema)}

    STRICT RULES:
    - Return ONLY valid JSON.
    - Do not include markdown formatting.
    - If a schema is empty, return an empty object {} for that key.`;

    const userPrompt = `### INPUT DATA ###\n${JSON.stringify(inputData, null, 2)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
