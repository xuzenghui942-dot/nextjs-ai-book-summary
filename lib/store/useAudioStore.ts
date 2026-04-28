import { create } from "zustand";

export type AudioChapter = {
  id: number;
  chapterNumber: number;
  chapterTitle: string;
  audioUrl: string;
  audioDuration: number;
};

type AudioState = {
  bookId: number | null;
  title: string;
  chapters: AudioChapter[];
  chapterIndex: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  playbackRate: number;
  isExpanded: boolean;
  isPremiumUser: boolean;
  setTrack: (track: {
    bookId: number;
    title: string;
    chapters: AudioChapter[];
    chapterIndex?: number;
    currentTime?: number;
    isPremiumUser?: boolean;
  }) => void;
  setChapterIndex: (chapterIndex: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackRate: (playbackRate: number) => void;
  setIsExpanded: (isExpanded: boolean) => void;
  setIsPremiumUser: (isPremiumUser: boolean) => void;
  reset: () => void;
};

const initialState = {
  bookId: null,
  title: "",
  chapters: [],
  chapterIndex: 0,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  playbackRate: 1,
  isExpanded: false,
  isPremiumUser: false,
};

export const useAudioStore = create<AudioState>((set) => ({
  ...initialState,
  setTrack: ({
    bookId,
    title,
    chapters,
    chapterIndex = 0,
    currentTime = 0,
    isPremiumUser = false,
  }) =>
    set({
      bookId,
      title,
      chapters,
      chapterIndex,
      currentTime,
      duration: 0,
      isPlaying: false,
      isPremiumUser,
    }),
  setChapterIndex: (chapterIndex) => set({ chapterIndex, currentTime: 0, isPlaying: false }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setIsExpanded: (isExpanded) => set({ isExpanded }),
  setIsPremiumUser: (isPremiumUser) => set({ isPremiumUser }),
  reset: () => set(initialState),
}));
