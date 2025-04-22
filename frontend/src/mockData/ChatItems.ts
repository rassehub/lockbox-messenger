import { ChatItem } from "../types/ChatListItem"

export const dummyChats: ChatItem[] = [
    {
        chatId: 'sbgf',
        recipient: 'Alice',
        timeStamp: '2025-04-20T10:21:00Z',
        message: [
            {
                messageID: 'jlkm',
                chatID: 'sbgf',
                senderID: 'rtyu',
                contents: 'Okay, sounds good!',
                timeStamp: '2025-04-20T10:21:00Z',
                timeReceived: '2025-04-20T10:21:00Z',
                timeRead: '2025-04-20T10:23:00Z',
            },
        ]
    },
    {
        chatId: 'hmnb',
        recipient: 'Bob',
        timeStamp: '2025-04-20T09:21:00Z',
        message: [
            {
                messageID: 'jlkm',
                chatID: 'sbgf',
                senderID: 'gnyu',
                contents: 'Nope!',
                timeStamp: '2025-04-20T10:21:00Z',
                timeReceived: '2025-04-20T10:21:00Z',
                timeRead: '2025-04-20T10:23:00Z',
            },
        ]
    }
];