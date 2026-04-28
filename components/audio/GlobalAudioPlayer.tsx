"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { saveReadingProgress } from "@/hooks/useAudioPersistence";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAudioStore } from "@/lib/store/useAudioStore";

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getCompletionPercentage(currentTime: number, duration: number) {
  if (!duration) {
    return 0;
  }

  return Math.min(100, Math.round((currentTime / duration) * 100));
}

export default function GlobalAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSavedAtRef = useRef(0);
  const upgradeToastShownRef = useRef(false);
  const {
    bookId,
    title,
    isExpanded,
    isPremiumUser,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setIsExpanded,
    reset,
  } = useAudioStore();
  const {
    chapters,
    currentChapter,
    chapterIndex,
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    togglePlay,
    seek,
    nextChapter,
    previousChapter,
    setPlaybackRate,
  } = useAudioPlayer();

  const persistProgress = () => {
    if (!bookId) {
      return;
    }

    void saveReadingProgress({
      bookId,
      chapterIndex,
      audioPosition: Math.floor(currentTime),
      completionPercentage: getCompletionPercentage(currentTime, duration || currentChapter?.audioDuration || 0),
    }).catch((error) => {
      console.error("Failed to save audio progress", error);
    });
  };

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    if (Math.abs(audioRef.current.currentTime - currentTime) > 1) {
      audioRef.current.currentTime = currentTime;
    }
  }, [chapterIndex, currentTime]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    if (isPlaying) {
      void audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, setIsPlaying]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();

      if (tagName === "input" || tagName === "textarea" || tagName === "select") {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
      }

      if (event.key === "ArrowLeft") {
        seek(Math.max(0, currentTime - 10));
      }

      if (event.key === "ArrowRight") {
        seek(Math.min(duration || currentTime + 10, currentTime + 10));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentTime, duration, seek, togglePlay]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      persistProgress();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  });

  if (!bookId || !currentChapter) {
    return null;
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) {
      return;
    }

    const nextTime = audioRef.current.currentTime;
    setCurrentTime(nextTime);

    if (!isPremiumUser && nextTime >= 10) {
      audioRef.current.pause();
      audioRef.current.currentTime = 10;
      setCurrentTime(10);
      setIsPlaying(false);

      if (!upgradeToastShownRef.current) {
        toast.error("Free users can only listen to 10 seconds. Upgrade for full access.");
        upgradeToastShownRef.current = true;
      }

      return;
    }

    if (nextTime - lastSavedAtRef.current >= 10) {
      lastSavedAtRef.current = nextTime;
      persistProgress();
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    persistProgress();
  };

  const handleEnded = () => {
    persistProgress();
    nextChapter();
  };

  const handleChapterChange = (direction: "previous" | "next") => {
    persistProgress();
    if (direction === "previous") {
      previousChapter();
    } else {
      nextChapter();
    }
  };

  const handleClose = () => {
    persistProgress();
    reset();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <audio
        ref={audioRef}
        src={currentChapter.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPause={handlePause}
        onEnded={handleEnded}
      />

      <div className="mx-auto max-w-7xl px-4 py-3">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close audio player"
          className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold leading-none text-slate-600 shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          ×
        </button>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
            <p className="truncate text-xs text-slate-600 dark:text-slate-400">
              Chapter {currentChapter.chapterNumber}: {currentChapter.chapterTitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleChapterChange("previous")}
              disabled={chapterIndex === 0}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => handleChapterChange("next")}
              disabled={chapterIndex === chapters.length - 1}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>

          <div className="flex items-center gap-3 md:w-72">
            <span className="w-10 text-right text-xs text-slate-500">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || currentChapter.audioDuration || 0}
              value={Math.min(currentTime, duration || currentChapter.audioDuration || 0)}
              onChange={(event) => seek(Number(event.target.value))}
              className="h-2 flex-1 cursor-pointer accent-emerald-600"
            />
            <span className="w-10 text-xs text-slate-500">
              {formatTime(duration || currentChapter.audioDuration || 0)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Speed
              </label>
              <select
                value={playbackRate}
                onChange={(event) => setPlaybackRate(Number(event.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}x
                  </option>
                ))}
              </select>
            </div>

            {!isPremiumUser && (
              <div className="text-sm text-amber-700 dark:text-amber-300">
                Free preview is limited to 10 seconds.{" "}
                <Link href="/pricing" className="font-semibold underline">
                  Upgrade for full access
                </Link>
              </div>
            )}

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Shortcuts: Space play/pause, Left/Right seek 10s
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
