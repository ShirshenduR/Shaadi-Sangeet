"use client";

import { useEffect, useRef, useState } from "react";

type Track = {
  title: string;
  artist: string;
  year: string;
  accent: string;
  query: string;
  src: string;
};

const tracks: Track[] = [
  {
    title: "Mujhse Mohabbat Ka Izhaar Karta",
    artist: "Satrang Music Official",
    year: "1990s",
    accent: "#f6c15b",
    query: "Mujhse Mohabbat Ka Izhaar Karta",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    title: "Mehndi Laga Ke Rakhna",
    artist: "Wedding Classics",
    year: "1990s",
    accent: "#ef7b60",
    query: "Mehndi Laga Ke Rakhna",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    title: "Bole Chudiyan",
    artist: "Shaadi Floor",
    year: "2000s",
    accent: "#69d4a5",
    query: "Bole Chudiyan",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  },
  {
    title: "London Thumakda",
    artist: "Shaadi Hits",
    year: "2010s",
    accent: "#79b8ff",
    query: "London Thumakda",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
  },
  {
    title: "Gallan Goodiyan",
    artist: "Family Dance",
    year: "2010s",
    accent: "#d8a1ff",
    query: "Gallan Goodiyan",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
  }
];

const spotifyPlaylistUrl = "https://open.spotify.com/playlist/39dRgNEeF9yJC7j8N3W8Vc?si=RXsyfbwLQBKu3ADmkG8Ujw";
const jiosaavnUrl = "https://saavn.sumit.co/";

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

  return `${hour} ${minute} ${dayPeriod}`.trim();
}

export default function Page() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [indianTime, setIndianTime] = useState(() => formatIndianTime(new Date()));
  const onlineCount = 31;
  const [artworks, setArtworks] = useState<Record<string, string>>({});

  const currentTrack = tracks[currentTrackIndex];
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
  const currentArtwork = artworks[currentTrack.query] ?? "/background/baarat.png";

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      setIndianTime(formatIndianTime(now));
    };

    updateStatus();
    const interval = window.setInterval(updateStatus, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let active = true;

    const loadArtworks = async () => {
      const resolved = await Promise.all(
        tracks.map(async (track) => {
          try {
            const response = await fetch(`/api/jiosaavn?query=${encodeURIComponent(track.query)}`);

            if (!response.ok) {
              return [track.query, ""] as const;
            }

            const data = (await response.json()) as { artwork?: string };
            return [track.query, typeof data.artwork === "string" ? data.artwork : ""] as const;
          } catch {
            return [track.query, ""] as const;
          }
        })
      );

      if (!active) {
        return;
      }

      const nextArtworks: Record<string, string> = {};

      for (const [query, artwork] of resolved) {
        if (artwork) {
          nextArtworks[query] = artwork;
        }
      }

      setArtworks(nextArtworks);
    };

    void loadArtworks();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.src = currentTrack.src;
    audio.load();

    if (isPlaying) {
      void audio.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, [currentTrack.src, isPlaying]);

  const playCurrent = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

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
    setDuration(0);
  };

  const handlePrevious = () => {
    const nextIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    goToTrack(nextIndex);
  };

  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    goToTrack(nextIndex);
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) {
      return;
    }

    audio.currentTime = (value / 100) * duration;
    setCurrentTime(audio.currentTime);
  };

  return (
    <main className="page-shell">
      <div className="grain grain-a" />
      <div className="grain grain-b" />
      <div className="grain grain-c" />
      <div className="halo halo-left" />
      <div className="halo halo-right" />
      <div className="baraat-scene" aria-hidden="true" />

      <header className="chrome-bar">
        <div className="status-time">
          <span>{indianTime}</span>
        </div>

        <div className="status-pill glass-panel" aria-live="polite">
          <span className="status-dot" aria-hidden="true" />
          <span className="status-copy">{onlineCount} online</span>
        </div>

        <div className="platform-links">
          <a className="link-pill glass-panel" href={spotifyPlaylistUrl} target="_blank" rel="noreferrer">
            Spotify
          </a>
          <a className="link-pill glass-panel" href={jiosaavnUrl} target="_blank" rel="noreferrer">
            YT Music
          </a>
        </div>
      </header>

      <section className="stage-shell">
        <div className="hero-title">
          <h1>बारात</h1>
        </div>

        <div className="player-shell glass-panel" style={{ ["--accent" as string]: currentTrack.accent }}>
          <audio
            ref={audioRef}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
            onEnded={handleNext}
          />

          <div className="player-card">
            <button
              className={`album-art ${isPlaying ? "is-spinning" : ""}`}
              type="button"
              onClick={togglePlayback}
              aria-label={isPlaying ? "Pause track" : "Play track"}
            >
              <span className="album-image">
                <img src={currentArtwork} alt="" />
              </span>
              <span className="album-center" aria-hidden="true" />
            </button>

            <div className="player-copy">
              <p className="player-label">Now playing</p>
              <h2>{currentTrack.title}</h2>
              <p className="player-subtitle">
                {currentTrack.artist} · {currentTrack.year}
              </p>

              <div className="timeline">
                <div className="timeline-track">
                  <div className="timeline-fill" style={{ width: `${progress}%` }} />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(event) => handleSeek(Number(event.target.value))}
                  aria-label="Track progress"
                />
                <div className="timeline-row">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>
            </div>

            <div className="player-controls">
              <button type="button" className="icon-btn" onClick={handlePrevious} aria-label="Previous track">
                <PrevIcon />
              </button>
              <button type="button" className="play-btn" onClick={togglePlayback} aria-label={isPlaying ? "Pause track" : "Play track"}>
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button type="button" className="icon-btn" onClick={handleNext} aria-label="Next track">
                <NextIcon />
              </button>
            </div>
          </div>
        </div>
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

function formatDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}
