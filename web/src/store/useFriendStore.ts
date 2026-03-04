"use client";

import { create } from 'zustand';
import { User } from './useAuthStore';

interface FriendState {
    friends: User[];
    activeFriend: User | null;
    hasNewRequests: boolean;
    setFriends: (friends: User[]) => void;
    setActiveFriend: (friend: User | null) => void;
    setHasNewRequests: (val: boolean) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
    friends: [],
    activeFriend: null,
    hasNewRequests: false,
    setFriends: (friends) => set({ friends }),
    setActiveFriend: (friend) => set({ activeFriend: friend }),
    setHasNewRequests: (val) => set({ hasNewRequests: val }),
}));
