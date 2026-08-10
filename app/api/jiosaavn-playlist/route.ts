import { NextRequest, NextResponse } from "next/server";
import { asArray, asRecord, toResolvedSong, type ResolvedSong } from "../jiosaavn/helpers";

const JIOSAAVN_API = "https://saavn.sumit.co/api/playlists";
const JIOSAAVN_SONGS_API = "https://saavn.sumit.co/api/songs";

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
    // 1. Extract playlist token to query JioSaavn live web API directly (bypasses proxy cache)
    let token = "";
    try {
      const url = new URL(link);
      const parts = url.pathname.split("/").filter(Boolean);
      token = parts[parts.length - 1] || "";
    } catch {
      token = "";
    }

    if (token) {
      const liveRes = await fetch(
        `https://www.jiosaavn.com/api.php?__call=webapi.get&token=${token}&type=playlist&p=1&n=1000&_format=json&_marker=0&api_version=4`,
        {
          headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
          cache: "no-store"
        }
      );

      if (liveRes.ok) {
        const liveData = (await liveRes.json()) as { title?: string; listname?: string; list?: { id: string }[] };
        const rawList = Array.isArray(liveData?.list) ? liveData.list : [];
        const songIds = rawList.map((item) => item.id).filter(Boolean);

        if (songIds.length > 0) {
          // Batch fetch resolved song details (download URLs, artwork, metadata) by song IDs
          const songsRes = await fetch(`${JIOSAAVN_SONGS_API}?ids=${songIds.join(",")}`, {
            cache: "no-store"
          });

          if (songsRes.ok) {
            const songsPayload = (await songsRes.json()) as unknown;
            const songsData = asArray(asRecord(songsPayload).data);
            const songs = songsData
              .map((song) => toResolvedSong(asRecord(song)))
              .filter((song) => song.src);

            if (songs.length > 0) {
              return NextResponse.json(
                {
                  name: liveData.listname || liveData.title || "बारात",
                  songs
                },
                { headers: { "Cache-Control": "no-store, max-age=0" } }
              );
            }
          }
        }
      }
    }

    // 2. Fallback to direct link lookup if live token fetch fails
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