import { Message } from "./Message";

export type ChatItem = {
    chatId: string;
    recipient: string;
    timeStamp: string;
    avatarUrl?: string;
    message: Message[];
}