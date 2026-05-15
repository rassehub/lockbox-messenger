import { Message } from "./Message";

export type ChatItem = {
    chatId: string;
    recipient: string;
    name?: string;
    timeStamp: string;
    avatarUrl?: string;
    message: Message[];
}