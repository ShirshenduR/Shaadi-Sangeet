import { NextRequest, NextResponse } from "next/server";
import { asArray, asRecord, toResolvedSong, type ResolvedSong } from "../jiosaavn/helpers";

// Sumit Kolhe's JioSaavn API — https://saavn.sumit.co (saavn.dev aliases here)
const JIOSAAVN_API = "https://saavn.sumit.co/api/playlists";

export async function GET(request: NextRequest) {
  const link = request.nextUrl.searchParams.get("link")?.trim();

  if (!link) {
    return NextResponse.json({ error: "link is required" }, { status: 400 });
  }

  try {
    // limit=50 so the whole playlist comes back in one page — bump this
    // if your playlist ever grows past 50 tracks.
    const response = await fetch(
      `${JIOSAAVN_API}?link=${encodeURIComponent(link)}&limit=50`,
      { next: { revalidate: 60 * 60 } }
    );

    if (!response.ok) {
      return NextResponse.json({ name: "", songs: [] as ResolvedSong[] });
    }

    const payload = (await response.json()) as unknown;
    const data = asRecord(asRecord(payload).data);
    const songs = asArray(data.songs)
      .map((song) => toResolvedSong(asRecord(song)))
      .filter((song) => song.src);

    return NextResponse.json({
      name: typeof data.name === "string" ? data.name : "",
      image: typeof data.image === "object" ? data.image : [],
      songs
    });
  } catch {
    return NextResponse.json({ name: "", songs: [] as ResolvedSong[] });
  }
}