import { create } from 'zustand';

interface FeedState {
    hasNewPosts: boolean;
    setHasNewPosts: (val: boolean) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
    hasNewPosts: false,
    setHasNewPosts: (val) => set({ hasNewPosts: val }),
}));
