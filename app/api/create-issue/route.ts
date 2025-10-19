// app/api/create-issue/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { title, body, type } = await req.json();

  const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GH_TOKEN!;

  // Add label based on type (bug or enhancement)
  const labels = type === "bug" ? ["bug"] : ["enhancement"];

  const response = await fetch(
    `https://api.github.com/repos/devenshah2018/drone-trajectory-interface/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        body,
        labels,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json({ error: data.message }, { status: response.status });
  }

  return NextResponse.json({ success: true, issueUrl: data.html_url });
}
