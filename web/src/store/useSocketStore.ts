import { create } from 'zustand';

interface SocketState {
    status: 'connected' | 'disconnected' | 'connecting' | 'error';
    setStatus: (status: 'connected' | 'disconnected' | 'connecting' | 'error') => void;
}

export const useSocketStore = create<SocketState>((set) => ({
    status: 'disconnected',
    setStatus: (status) => set({ status }),
}));
