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
    isInitiator?: boolean;
    isPeerTyping?: boolean;
    vibeSaved?: boolean;
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
    setMatched: (roomId: string, strangerId: string, peerName?: string, peerAvatar?: string, isDirectCall?: boolean, isInitiator?: boolean) => void;
    setSearching: (searching: boolean) => void;
    addMessage: (message: Message) => void;
    setIncomingCall: (call: IncomingCall | null) => void;
    setOutgoingCall: (call: OutgoingCall | null) => void;
    setPeerTyping: (isTyping: boolean) => void;
    setVibeSaved: (val: boolean) => void;
    disconnect: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    session: {
        roomId: null,
        strangerId: null,
        isMatched: false,
        messages: [],
        isPeerTyping: false,
        vibeSaved: false
    },
    isSearching: false,
    incomingCall: null,
    outgoingCall: null,
    setMatched: (roomId, strangerId, peerName, peerAvatar, isDirectCall, isInitiator) => set((state) => ({
        session: { ...state.session, roomId, strangerId, isMatched: true, peerName, peerAvatar, isDirectCall, isInitiator, isPeerTyping: false, vibeSaved: false },
        isSearching: false
    })),
    setSearching: (searching) => set({ isSearching: searching }),
    setIncomingCall: (call) => set({ incomingCall: call }),
    setOutgoingCall: (call) => set({ outgoingCall: call }),
    setPeerTyping: (isTyping) => set((state) => ({
        session: { ...state.session, isPeerTyping: isTyping }
    })),
    setVibeSaved: (val) => set((state) => ({
        session: { ...state.session, vibeSaved: val }
    })),
    addMessage: (message) => set((state) => ({
        session: { ...state.session, messages: [...state.session.messages, message], isPeerTyping: false }
    })),
    disconnect: () => set({
        session: { roomId: null, strangerId: null, isMatched: false, messages: [], isPeerTyping: false, vibeSaved: false },
        isSearching: false,
        incomingCall: null,
        outgoingCall: null
    })
}));
