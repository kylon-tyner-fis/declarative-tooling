import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { definition, inputData, outputSchema } = await req.json();

    const systemPrompt = `You are an autonomous AI agent responsible for executing a specific task within a larger workflow.
    
    YOUR GOAL:
    ${definition}

    YOUR CONSTRAINTS:
    1. You must strictly adhere to the provided JSON Schema for your output.
    2. You must use the provided Input Data to generate the result.
    3. Return ONLY valid JSON. Do not include markdown formatting or explanation.
    `;

    const userPrompt = `
    ### INPUT DATA ###
    ${JSON.stringify(inputData, null, 2)}

    ### REQUIRED OUTPUT SCHEMA ###
    ${JSON.stringify(outputSchema, null, 2)}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const result = completion.choices[0].message.content;

    // Parse to ensure validity before sending back
    const parsedResult = JSON.parse(result || "{}");

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("Agent Execution Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute agent" },
      { status: 500 },
    );
  }
}
