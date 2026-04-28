import { create } from "zustand";

type AudioState = {
  bookId: number | null;
  title: string;
  chapterIndex: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  setTrack: (track: { bookId: number; title: string; chapterIndex?: number }) => void;
  setChapterIndex: (chapterIndex: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackRate: (playbackRate: number) => void;
  reset: () => void;
};

const initialState = {
  bookId: null,
  title: "",
  chapterIndex: 0,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  playbackRate: 1,
};

export const useAudioStore = create<AudioState>((set) => ({
  ...initialState,
  setTrack: ({ bookId, title, chapterIndex = 0 }) =>
    set({ bookId, title, chapterIndex, currentTime: 0, duration: 0, isPlaying: false }),
  setChapterIndex: (chapterIndex) => set({ chapterIndex, currentTime: 0, isPlaying: false }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  reset: () => set(initialState),
}));
