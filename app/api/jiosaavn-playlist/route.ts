import { NextRequest, NextResponse } from "next/server";
import { asArray, asRecord, toResolvedSong, type ResolvedSong } from "../jiosaavn/helpers";

const JIOSAAVN_API = "https://saavn.sumit.co/api/playlists";
const JIOSAAVN_SONGS_API = "https://saavn.sumit.co/api/songs";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0, private",
  "Pragma": "no-cache",
  "Expires": "0",
  "Surrogate-Control": "no-store"
};

function extractJioSaavnToken(link: string): string {
  try {
    const url = new URL(link);
    const parts = url.pathname.split("/").filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i].trim();
      if (p.endsWith("__") || (p.length >= 10 && !["playlist", "featured", "s"].includes(p))) {
        return p;
      }
    }
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
}

export async function GET(request: NextRequest) {
  const link = request.nextUrl.searchParams.get("link")?.trim();

  if (!link) {
    return NextResponse.json(
      { error: "link is required" },
      { status: 400, headers: NO_CACHE_HEADERS }
    );
  }

  try {
    const token = extractJioSaavnToken(link);

    if (token) {
      // Query JioSaavn official API directly with cache-busting _t param to bypass Vercel & proxy caches
      const liveRes = await fetch(
        `https://www.jiosaavn.com/api.php?__call=webapi.get&token=${token}&type=playlist&p=1&n=1000&_format=json&_marker=0&api_version=4&_t=${Date.now()}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Cache-Control": "no-cache, no-store"
          },
          cache: "no-store"
        }
      );

      if (liveRes.ok) {
        const liveData = (await liveRes.json()) as { title?: string; listname?: string; list?: { id: string }[] };
        const rawList = Array.isArray(liveData?.list) ? liveData.list : [];
        const songIds = rawList.map((item) => item.id).filter(Boolean);

        if (songIds.length > 0) {
          // Batch fetch resolved song details by IDs with cache-busting timestamp
          const songsRes = await fetch(`${JIOSAAVN_SONGS_API}?ids=${songIds.join(",")}&_t=${Date.now()}`, {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache, no-store" }
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
                { headers: NO_CACHE_HEADERS }
              );
            }
          }
        }
      }
    }

    // Fallback to link fetch if live token lookup returns empty
    const response = await fetch(
      `${JIOSAAVN_API}?link=${encodeURIComponent(link)}&limit=500&_t=${Date.now()}`,
      {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache, no-store" }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { name: "", songs: [] as ResolvedSong[] },
        { headers: NO_CACHE_HEADERS }
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
      { headers: NO_CACHE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { name: "", songs: [] as ResolvedSong[] },
      { headers: NO_CACHE_HEADERS }
    );
  }
}