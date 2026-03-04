import { create } from 'zustand';

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: number;
}

interface ChatSession {
    roomId: string | null;
    strangerId: string | null;
    isMatched: boolean;
    messages: Message[];
    peerName?: string;
    peerAvatar?: string;
    isDirectCall?: boolean;
}

interface IncomingCall {
    from: string;
    fromName: string;
    fromAvatar: string;
    offer: any;
}

interface OutgoingCall {
    to: string;
    toName: string;
    toAvatar: string;
}

interface ChatState {
    session: ChatSession;
    isSearching: boolean;
    incomingCall: IncomingCall | null;
    outgoingCall: OutgoingCall | null;
    setMatched: (roomId: string, strangerId: string, peerName?: string, peerAvatar?: string, isDirectCall?: boolean) => void;
    setSearching: (searching: boolean) => void;
    addMessage: (message: Message) => void;
    setIncomingCall: (call: IncomingCall | null) => void;
    setOutgoingCall: (call: OutgoingCall | null) => void;
    disconnect: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    session: {
        roomId: null,
        strangerId: null,
        isMatched: false,
        messages: []
    },
    isSearching: false,
    incomingCall: null,
    outgoingCall: null,
    setMatched: (roomId, strangerId, peerName, peerAvatar, isDirectCall) => set((state) => ({
        session: { ...state.session, roomId, strangerId, isMatched: true, peerName, peerAvatar, isDirectCall },
        isSearching: false
    })),
    setSearching: (searching) => set({ isSearching: searching }),
    setIncomingCall: (call) => set({ incomingCall: call }),
    setOutgoingCall: (call) => set({ outgoingCall: call }),
    addMessage: (message) => set((state) => ({
        session: { ...state.session, messages: [...state.session.messages, message] }
    })),
    disconnect: () => set({
        session: { roomId: null, strangerId: null, isMatched: false, messages: [] },
        isSearching: false,
        incomingCall: null,
        outgoingCall: null
    })
}));
