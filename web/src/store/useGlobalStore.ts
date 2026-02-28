import { create } from "zustand";

interface GlobalState {
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
    isSidebarOpen: true,
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}));
