import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ message: 'A valid JSON request is required' }, { status: 400 }); }
  if (!body || typeof body !== 'object') return NextResponse.json({ message: 'A valid chat request is required' }, { status: 400 });
  const message = typeof body.message === "string"
    ? body.message
    : Array.isArray(body.messages)
      ? [...body.messages].reverse().find((item) => item?.role === "user")?.content
      : null;

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ message: "A user message is required" }, { status: 400 });
  }

  const apiBase = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  const response = await fetch(`${apiBase}/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
    },
    body: JSON.stringify({ message: message.trim(), confirmationId: body.confirmationId, clarificationId: body.clarificationId }),
    cache: "no-store",
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
