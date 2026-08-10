export type JsonRecord = Record<string, unknown>;

export type ResolvedSong = {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  src: string;
  duration: number;
};

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" ? (value as JsonRecord) : {};
}

// Image + downloadUrl both come back as an array of { quality, url },
// ordered lowest -> highest quality. Grab the last one for best quality.
export function bestQualityUrl(value: unknown): string {
  const list = asArray(value);
  if (list.length === 0) return "";

  const last = asRecord(list[list.length - 1]);
  if (typeof last.url === "string" && last.url) return last.url;

  for (const item of [...list].reverse()) {
    const rec = asRecord(item);
    if (typeof rec.url === "string" && rec.url) return rec.url;
  }

  return "";
}

export function primaryArtistNames(result: JsonRecord): string {
  const artists = asRecord(result.artists);
  const primary = asArray(artists.primary);

  const names = primary
    .map((artist) => asRecord(artist).name)
    .filter((name): name is string => typeof name === "string" && name.length > 0);

  if (names.length > 0) return names.join(", ");

  if (typeof result.primaryArtists === "string") return result.primaryArtists;
  if (typeof result.subtitle === "string") return result.subtitle;

  return "";
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"');
}

export function toResolvedSong(result: JsonRecord): ResolvedSong {
  return {
    id: typeof result.id === "string" ? result.id : "",
    title: typeof result.name === "string" && result.name ? decodeHtmlEntities(result.name) : "",
    artist: decodeHtmlEntities(primaryArtistNames(result)),
    artwork: bestQualityUrl(result.image),
    src: bestQualityUrl(result.downloadUrl),
    duration: typeof result.duration === "number" ? result.duration : Number(result.duration) || 0
  };
}