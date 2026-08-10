"use client";

import { useEffect, useRef, useState } from "react";

// Your JioSaavn baarat playlist — swap this link for any other JioSaavn
// playlist URL and the whole player repopulates from it automatically.
const jiosaavnPlaylistUrl =
  "https://www.jiosaavn.com/s/playlist/8fa1c266e2d572af6074fb2316b29c53/baarat/GJBgT9Oq3qk14faDlWgB3A__";

const accents = ["#f6c15b", "#ef7b60", "#69d4a5", "#79b8ff", "#d8a1ff"];

type PlaylistSong = {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  src: string;
  duration: number;
};

function formatIndianTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  const dayPeriod = (parts.find((part) => part.type === "dayPeriod")?.value ?? "").toLowerCase();

  return `${hour}:${minute} ${dayPeriod}`.trim();
}

function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function Page() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [playlistName, setPlaylistName] = useState("बारात");
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [indianTime, setIndianTime] = useState(() => formatIndianTime(new Date()));
  const onlineCount = 31;

  const currentTrack = songs[currentTrackIndex];
  const accent = accents[currentTrackIndex % accents.length];
  const duration = currentTrack?.duration || 0;
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  useEffect(() => {
    const updateStatus = () => setIndianTime(formatIndianTime(new Date()));
    updateStatus();
    const interval = window.setInterval(updateStatus, 1000 * 30);
    return () => window.clearInterval(interval);
  }, []);

  // Pull the whole baarat playlist from JioSaavn on mount.
  useEffect(() => {
    let active = true;

    const loadPlaylist = async () => {
      try {
        const response = await fetch(`/api/jiosaavn-playlist?link=${encodeURIComponent(jiosaavnPlaylistUrl)}`);
        const data = (await response.json()) as { name?: string; songs?: PlaylistSong[] };

        if (!active) return;

        if (data.songs && data.songs.length > 0) {
          setSongs(data.songs);
          setPlaylistName(data.name || "बारात");
          setLoadState("ready");
        } else {
          setLoadState("error");
        }
      } catch {
        if (active) setLoadState("error");
      }
    };

    void loadPlaylist();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.src) return;

    audio.src = currentTrack.src;
    audio.load();

    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.src]);

  const playCurrent = async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.src) return;

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const pauseCurrent = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      pauseCurrent();
      return;
    }
    void playCurrent();
  };

  const goToTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const handlePrevious = () => {
    if (songs.length === 0) return;
    goToTrack((currentTrackIndex - 1 + songs.length) % songs.length);
  };

  const handleNext = () => {
    if (songs.length === 0) return;
    goToTrack((currentTrackIndex + 1) % songs.length);
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = (value / 100) * duration;
    setCurrentTime(audio.currentTime);
  };

  const isLoadingPlaylist = loadState === "loading";
  const isErrorPlaylist = loadState === "error";

  return (
    <main className="page-shell">
      <div className="page-backdrop" aria-hidden="true" />
      <div className="halo halo-left" />
      <div className="halo halo-right" />

      <header className="chrome-bar">
        <span className="time-chip">{indianTime}</span>

        <div className="status-pill glass-panel" aria-live="polite">
          <span className="status-dot" aria-hidden="true" />
          <span>{onlineCount} online</span>
        </div>

        <div className="platform-links">
          <a className="link-pill glass-panel" href={jiosaavnPlaylistUrl} target="_blank" rel="noreferrer">
            JioSaavn
          </a>
        </div>
      </header>

      <section className="stage-shell">
        <div className="hero-copy">
          <h1 className="hero-title">बारात</h1>
        </div>

        {isErrorPlaylist ? (
          <div className="player-shell glass-panel player-error">
            <p>Couldn&apos;t load the playlist from JioSaavn right now.</p>
            <a href={jiosaavnPlaylistUrl} target="_blank" rel="noreferrer">
              Open {playlistName} on JioSaavn instead
            </a>
          </div>
        ) : (
          <div className="player-shell glass-panel" style={{ ["--accent" as string]: accent }}>
            <audio
              ref={audioRef}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              onEnded={handleNext}
            />

            <div className="player-top">
              <button
                className={`album-art ${isPlaying ? "is-playing" : ""}`}
                type="button"
                onClick={togglePlayback}
                disabled={isLoadingPlaylist || !currentTrack?.src}
                aria-label={isPlaying ? "Pause track" : "Play track"}
              >
                {isLoadingPlaylist ? (
                  <span className="album-skeleton" />
                ) : (
                  <img src={currentTrack?.artwork || "/background/baarat.png"} alt="" />
                )}
                {!isLoadingPlaylist && (
                  <span className="album-play-overlay" aria-hidden="true">
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </span>
                )}
              </button>

              <div className="player-copy">
                <div className="track-meta">
                  <h2 className="track-title">{isLoadingPlaylist ? "Loading…" : currentTrack?.title}</h2>
                  <p className="track-artist">{isLoadingPlaylist ? "" : currentTrack?.artist || "—"}</p>
                </div>

                <div className="timeline">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(event) => handleSeek(Number(event.target.value))}
                    aria-label="Track progress"
                    disabled={isLoadingPlaylist || !currentTrack?.src}
                    style={{ ["--progress" as string]: `${progress}%` }}
                  />
                  <p className="timeline-clock">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </p>
                </div>
              </div>

              <div className="player-controls player-controls-bottom">
                <button type="button" className="icon-btn icon-btn-small" onClick={handlePrevious} aria-label="Previous track">
                  <PrevIcon />
                </button>
                <button
                  type="button"
                  className="play-btn"
                  onClick={togglePlayback}
                  disabled={isLoadingPlaylist || !currentTrack?.src}
                  aria-label={isPlaying ? "Pause track" : "Play track"}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <button type="button" className="icon-btn icon-btn-small" onClick={handleNext} aria-label="Next track">
                  <NextIcon />
                </button>
              </div>
            </div>

            <div className="track-count-row">
              <span className="track-count">
                {songs.length > 0 ? `${currentTrackIndex + 1} / ${songs.length}` : "—"}
              </span>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5.5h3.25v13H7v-13Zm6.75 0H17v13h-3.25v-13Z" fill="currentColor" />
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 6.5 9.5 12 18 17.5v-11Zm-11.5 0H8v11H6.5v-11Z" fill="currentColor" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 17.5 14.5 12 6 6.5v11Zm9.5 0H17v-11h-1.5v11Z" fill="currentColor" />
    </svg>
  );
}