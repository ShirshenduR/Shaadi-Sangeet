import { NextRequest, NextResponse } from "next/server";
import { asArray, asRecord, toResolvedSong } from "./helpers";

// Sumit Kolhe's JioSaavn API — https://saavn.sumit.co (saavn.dev aliases here)
const JIOSAAVN_API = "https://saavn.sumit.co/api/search/songs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "query is required" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  const empty = { id: "", title: query, artist: "", artwork: "", src: "", duration: 0 };

  try {
    const response = await fetch(`${JIOSAAVN_API}?query=${encodeURIComponent(query)}&limit=1`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json(empty, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }

    const payload = (await response.json()) as unknown;
    const data = asRecord(asRecord(payload).data);
    const results = asArray(data.results);
    const result = asRecord(results[0]);

    if (Object.keys(result).length === 0) {
      return NextResponse.json(empty, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }

    const resolved = toResolvedSong(result);
    return NextResponse.json(
      { ...resolved, title: resolved.title || query },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json(empty, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}