import { NextRequest, NextResponse } from "next/server";

// Replace with a real LLM call (e.g. the Anthropic API) when ready.
export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const reply = `I heard: "${message}". Once connected to a real model, I'll give you personalized budgeting advice here.`;

  return NextResponse.json({
    id: crypto.randomUUID(),
    role: "assistant",
    content: reply,
    timestamp: new Date().toISOString(),
  });
}