import { NextRequest, NextResponse } from "next/server";
import { asArray, asRecord, toResolvedSong, type ResolvedSong } from "../jiosaavn/helpers";

// Sumit Kolhe's JioSaavn API — https://saavn.sumit.co (saavn.dev aliases here)
const JIOSAAVN_API = "https://saavn.sumit.co/api/playlists";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const link = request.nextUrl.searchParams.get("link")?.trim();

  if (!link) {
    return NextResponse.json(
      { error: "link is required" },
      { status: 400, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  try {
    // Fetch fresh playlist with limit=500 to capture all new songs
    const response = await fetch(
      `${JIOSAAVN_API}?link=${encodeURIComponent(link)}&limit=500`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return NextResponse.json(
        { name: "", songs: [] as ResolvedSong[] },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const payload = (await response.json()) as unknown;
    const data = asRecord(asRecord(payload).data);
    const songs = asArray(data.songs)
      .map((song) => toResolvedSong(asRecord(song)))
      .filter((song) => song.src);

    return NextResponse.json(
      {
        name: typeof data.name === "string" ? data.name : "",
        image: typeof data.image === "object" ? data.image : [],
        songs
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch {
    return NextResponse.json(
      { name: "", songs: [] as ResolvedSong[] },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}