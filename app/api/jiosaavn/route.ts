import { NextRequest, NextResponse } from "next/server";
import { asArray, asRecord, toResolvedSong } from "./helpers";

const JIOSAAVN_API = "https://saavn.sumit.co/api/search/songs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0, private",
  "Pragma": "no-cache",
  "Expires": "0",
  "Surrogate-Control": "no-store"
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "query is required" },
      { status: 400, headers: NO_CACHE_HEADERS }
    );
  }

  const empty = { id: "", title: query, artist: "", artwork: "", src: "", duration: 0 };

  try {
    const response = await fetch(`${JIOSAAVN_API}?query=${encodeURIComponent(query)}&limit=1&_t=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache, no-store" }
    });

    if (!response.ok) {
      return NextResponse.json(empty, { headers: NO_CACHE_HEADERS });
    }

    const payload = (await response.json()) as unknown;
    const data = asRecord(asRecord(payload).data);
    const results = asArray(data.results);
    const result = asRecord(results[0]);

    if (Object.keys(result).length === 0) {
      return NextResponse.json(empty, { headers: NO_CACHE_HEADERS });
    }

    const resolved = toResolvedSong(result);
    return NextResponse.json(
      { ...resolved, title: resolved.title || query },
      { headers: NO_CACHE_HEADERS }
    );
  } catch {
    return NextResponse.json(empty, { headers: NO_CACHE_HEADERS });
  }
}