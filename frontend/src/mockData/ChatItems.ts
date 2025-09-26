import { ChatItem } from "../types/ChatListItem"

export const dummyChats: ChatItem[] = [
    {
        chatId: 'sbgf',
        recipient: 'Alice',
        timeStamp: '2025-04-20T10:21:00Z',
        message: [
            {
                messageID: 'trhb',
                chatID: 'sbgf',
                senderID: 'rtyu',
                contents: 'Are we still on for tommorrow?',
                timeStamp: '2025-04-21T13:16:00Z',
                timeReceived: '2025-04-21T13:16:00Z',
                timeRead: '2025-04-21T13:19:00Z',
            },
            {
                messageID: 'rhtd',
                chatID: 'sbgf',
                senderID: 'rtyu',
                contents: 'At 2pm right?',
                timeStamp: '2025-04-21T13:17:00Z',
                timeReceived: '2025-04-21T13:17:00Z',
                timeRead: '2025-04-21T13:19:00Z',
            },
            {
                messageID: 'bhky',
                chatID: 'sbgf',
                senderID: '2',
                contents: 'Yep!',
                timeStamp: '2025-04-21T13:20:00Z',
                timeReceived: '2025-04-21T13:20:00Z',
                timeRead: '2025-04-21T13:21:00Z',
            },
        ]
    },
    {
        chatId: 'hmnb',
        recipient: 'Bob',
        timeStamp: '2025-04-20T09:21:00Z',
        message: [
            {
                messageID: 'thth',
                chatID: 'hmnb',
                senderID: 'gnyu',
                contents: 'Fuck you!',
                timeStamp: '2025-04-21T13:20:00Z',
                timeReceived: '2025-04-21T13:20:00Z',
                timeRead: '2025-04-21T13:21:00Z',
            },
            {
                messageID: 'ghgh',
                chatID: 'hmnb',
                senderID: '2',
                contents: 'Sure',
                timeStamp: '2025-04-21T13:20:00Z',
                timeReceived: '2025-04-21T13:20:00Z',
                timeRead: '2025-04-21T13:21:00Z',
            },
        ]
    }
];