import { create } from 'zustand';

interface DMState {
    totalUnreadCount: number;
    setTotalUnreadCount: (count: number) => void;
    incrementUnread: () => void;
    decrementUnread: () => void;
}

export const useDMStore = create<DMState>((set) => ({
    totalUnreadCount: 0,
    setTotalUnreadCount: (count) => set({ totalUnreadCount: count }),
    incrementUnread: () => set((state) => ({ totalUnreadCount: state.totalUnreadCount + 1 })),
    decrementUnread: () => set((state) => ({ totalUnreadCount: Math.max(0, state.totalUnreadCount - 1) })),
}));
