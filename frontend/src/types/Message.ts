export type Message = {
    messageID: string;
    chatID: string;
    senderID: string;
    contents: string;
    timeStamp: string;
    timeReceived?: string;
    timeRead?: string;
}