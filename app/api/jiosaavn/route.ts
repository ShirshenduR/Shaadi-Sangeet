import { NextRequest, NextResponse } from "next/server";

type JsonRecord = Record<string, unknown>;

function pickString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => pickString(item))
      .filter(Boolean)
      .join(", ");

    return joined;
  }

  if (value && typeof value === "object") {
    const record = value as JsonRecord;

    for (const key of ["name", "title", "label", "text"]) {
      const candidate = pickString(record[key]);
      if (candidate) {
        return candidate;
      }
    }
  }

  return "";
}

function pickArtwork(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of [...value].reverse()) {
      const candidate = pickArtwork(item);
      if (candidate) {
        return candidate;
      }
    }

    return "";
  }

  if (value && typeof value === "object") {
    const record = value as JsonRecord;

    for (const key of ["url", "image", "src", "link"]) {
      const candidate = pickArtwork(record[key]);
      if (candidate) {
        return candidate;
      }
    }
  }

  return "";
}

function pickResult(payload: unknown): JsonRecord {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const root = payload as JsonRecord;
  const data = root.data && typeof root.data === "object" ? (root.data as JsonRecord) : root;

  for (const key of ["results", "songs", "items"]) {
    const list = data[key];
    if (Array.isArray(list) && list.length > 0 && list[0] && typeof list[0] === "object") {
      return list[0] as JsonRecord;
    }
  }

  return data;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim();

  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}`);

    if (!response.ok) {
      return NextResponse.json({ query, artwork: "", title: query, artist: "" });
    }

    const payload = (await response.json()) as unknown;
    const result = pickResult(payload);

    return NextResponse.json({
      query,
      artwork: pickArtwork(result.image ?? result.artwork ?? result.cover ?? result.thumbnail) || "",
      title: pickString(result.name ?? result.title) || query,
      artist: pickString(result.primaryArtists ?? result.artists ?? result.singers ?? result.subtitle)
    });
  } catch {
    return NextResponse.json({ query, artwork: "", title: query, artist: "" });
  }
}