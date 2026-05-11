export type Message = {
    messageID: string;
    chatID: string;
    senderID: string;
    contactID: string;
    contents: string;
    timeStamp: string;
    timeReceived?: string;
    timeRead?: string;
}