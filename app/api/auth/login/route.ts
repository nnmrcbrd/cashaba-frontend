import { NextRequest, NextResponse } from "next/server";

// Replace this with your real database + password hashing when ready.
const TEST_USER = {
  id: "u_001",
  name: "Anna Reyes",
  email: "anna@example.com",
  role: ["Working"] as const,
  memberSince: "2025-01-10",
  accountType: "Standard User" as const,
  status: "Active" as const,
};

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (email === TEST_USER.email && password === "password") {
    return NextResponse.json({
      user: TEST_USER,
      token: "demo-token-" + Date.now(),
    });
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}