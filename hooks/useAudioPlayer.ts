"use client";

import { useAudioStore } from "@/lib/store/useAudioStore";

export function useAudioPlayer() {
  const {
    chapters,
    chapterIndex,
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    setChapterIndex,
    setCurrentTime,
    setIsPlaying,
    setPlaybackRate,
  } = useAudioStore();

  const currentChapter = chapters[chapterIndex];

  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const togglePlay = () => setIsPlaying(!isPlaying);
  const seek = (time: number) => setCurrentTime(Math.max(0, time));

  const nextChapter = () => {
    if (chapterIndex < chapters.length - 1) {
      setChapterIndex(chapterIndex + 1);
    }
  };

  const previousChapter = () => {
    if (chapterIndex > 0) {
      setChapterIndex(chapterIndex - 1);
    }
  };

  return {
    chapters,
    currentChapter,
    chapterIndex,
    currentTime,
    duration,
    isPlaying,
    playbackRate,
    play,
    pause,
    togglePlay,
    seek,
    nextChapter,
    previousChapter,
    setPlaybackRate,
  };
}
