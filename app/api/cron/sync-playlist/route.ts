import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret if configured in environment variables
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = "GJBgT9Oq3qk14faDlWgB3A__";
    const res = await fetch(
      `https://www.jiosaavn.com/api.php?__call=webapi.get&token=${token}&type=playlist&p=1&n=1000&_format=json&_marker=0&api_version=4&_t=${Date.now()}`,
      { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" } }
    );

    const data = (await res.json()) as { list?: unknown[] };
    const songCount = Array.isArray(data?.list) ? data.list.length : 0;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      songCount
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
