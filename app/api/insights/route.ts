import { NextResponse } from "next/server";

/** AI insights require authenticated, verified account data before activation. */
export async function POST() {
  return NextResponse.json(
    { error: "AI insights are not available yet. Import a CSV report to review your measured results." },
    { status: 410 },
  );
}
