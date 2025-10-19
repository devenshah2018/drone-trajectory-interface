// app/api/create-issue/route.ts
import { NextRequest, NextResponse } from "next/server";

const MAX_SUBMISSIONS_PER_DAY = 5;
const COOKIE_NAME = "feedback_submissions";
const RESET_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface FeedbackData {
  count: number;
  lastResetTime: number; // Unix timestamp in milliseconds
}

function getFeedbackData(req: NextRequest): FeedbackData {
  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie) {
    return { count: 0, lastResetTime: Date.now() };
  }

  try {
    return JSON.parse(cookie.value);
  } catch {
    return { count: 0, lastResetTime: Date.now() };
  }
}

function shouldResetCount(lastResetTime: number): boolean {
  return Date.now() - lastResetTime >= RESET_INTERVAL_MS;
}

function setFeedbackCookie(response: NextResponse, data: FeedbackData) {
  // Set cookie to expire in 24 hours from last reset
  const expiryDate = new Date(data.lastResetTime + RESET_INTERVAL_MS);

  response.cookies.set(COOKIE_NAME, JSON.stringify(data), {
    expires: expiryDate,
    httpOnly: true,
    sameSite: "strict",
    path: "/",
  });
}

export async function GET(req: NextRequest) {
  const feedbackData = getFeedbackData(req);

  // Reset count if more than 24 hours have passed
  if (shouldResetCount(feedbackData.lastResetTime)) {
    return NextResponse.json({ count: 0, remaining: MAX_SUBMISSIONS_PER_DAY });
  }

  return NextResponse.json({
    count: feedbackData.count,
    remaining: Math.max(0, MAX_SUBMISSIONS_PER_DAY - feedbackData.count),
  });
}

export async function POST(req: NextRequest) {
  const feedbackData = getFeedbackData(req);

  // Reset count if more than 24 hours have passed
  if (shouldResetCount(feedbackData.lastResetTime)) {
    feedbackData.count = 0;
    feedbackData.lastResetTime = Date.now();
  }

  // Check rate limit
  if (feedbackData.count >= MAX_SUBMISSIONS_PER_DAY) {
    const response = NextResponse.json(
      { 
        error: "You have reached the maximum number of feedback submissions for today. Please try again tomorrow.",
        remaining: 0
      },
      { status: 429 }
    );
    setFeedbackCookie(response, feedbackData);
    return response;
  }

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
    const errorResponse = NextResponse.json({ error: data.message }, { status: response.status });
    setFeedbackCookie(errorResponse, feedbackData);
    return errorResponse;
  }

  // Increment submission count
  feedbackData.count += 1;

  const successResponse = NextResponse.json({ 
    success: true, 
    issueUrl: data.html_url,
    remaining: MAX_SUBMISSIONS_PER_DAY - feedbackData.count
  });
  
  setFeedbackCookie(successResponse, feedbackData);

  return successResponse;
}
