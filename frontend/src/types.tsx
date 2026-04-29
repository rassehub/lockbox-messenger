export interface Message {
    id: string;
    senderId: string;
    recipientId: string;
    ciphertext: string;
    timestamp: number;
    iv?: string;
    salt?: string;
}

export interface User {
    id: string;
    username: string;
    publicKey?: string;
}

export interface Conversation {
    userId: string;
    username: string;
    lastMessage?: Message;
    unreadCount: number;
}