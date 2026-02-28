"use client";

import { create } from 'zustand';
import { User } from './useAuthStore';

interface FriendState {
    friends: User[];
    activeFriend: User | null;
    setFriends: (friends: User[]) => void;
    setActiveFriend: (friend: User | null) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
    friends: [],
    activeFriend: null,
    setFriends: (friends) => set({ friends }),
    setActiveFriend: (friend) => set({ activeFriend: friend }),
}));
