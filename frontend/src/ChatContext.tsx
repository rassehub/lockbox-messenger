import { createContext, use, useContext, useEffect, useState } from "react"
import { Message } from "./types/Message";
import { useSession } from "./SessionContext";
import { ChatStorage } from "./chat/chatStorage";
import { EncryptedMessage } from "./crypto/types";
import { AppSession } from "./bootstrap";
import { useAuthentication } from "./AuthContext";

type ChatContextType = {
  messages: Message[];
  isConnected: boolean;
  storage: ChatStorage | undefined;
  loadChat: (chatId: string) => Promise<Message[]>;
  sendMessage: (chatId: string, recipientId: string, text: string) => Promise<void>;
  searchUsers: (searchText: string) => Promise<string[]>;
  getUserId: (username: string) => Promise<string>;
  connectWs: (s: AppSession) => void;
  disconnect: () => void;
  refreshChats: () => void;
  refreshKey: number;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useSession();
  const { userId, username, phonenumber } = useAuthentication();
  const [storage, setStorage] = useState<ChatStorage>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshChats = () => {
    setRefreshKey((v) => v +1);
  };

  useEffect(() => {
    if (!session) {
      setIsConnected(false);
      setStorage(undefined);
      setMessages([]);
      return;
    }

    const saveMyInfo = async () => {
      console.log('userId:', userId, 'username:', username, 'phonenumber:', phonenumber)
        if(!storage) return;
        if(!username || !phonenumber || !userId) return;
        console.log('save my info')
        console.log('save my info');
        storage.saveMyInfo(userId, username, phonenumber);
    }

    saveMyInfo();

    const setupChat = async () => {
      try {
        await connectWs(session);
        setIsConnected(true);
        setStorage(session.chatStorage);

        if (session.ws) {
          session.ws.onMessage(async (raw: any) => {
            const plaintext = await session.cryptoManager.decryptMessage(raw.sender, raw.ciphertext);
            const message: Message = {
              messageID: raw.messageID || raw.messageId,
              chatID: raw.chatID || raw.chatId,
              senderID: raw.senderID || raw.sender,
              contactID: raw.senderID || raw.sender,
              contents: plaintext,
              timeStamp: raw.timeStamp || raw.timeSent,
              timeRead: undefined,
            };

            if (!message.messageID) return;

            setMessages((prev) => [...prev, message]);
          });
        }
      } catch (err) {
        console.error('Failed to setup chat:', err);
        setIsConnected(false);
      }
    };

    setupChat();

    return () => {
      session?.ws?.disconnect();
      setIsConnected(false);
    };
  }, [session]);

  const loadChat = async (chatId: string) => {
    if (!storage) return [];
    const chat = await storage.getMessages(chatId);
    const validatedMessages = (chat ?? []).filter(
      (item): item is Message => item !== null && item !== undefined
    );
    const uniqueMessages = Array.from(
      new Map(validatedMessages.map((m) => [m.messageID, m])).values()
    );

    setMessages(uniqueMessages);
    console.log(uniqueMessages)
    return uniqueMessages;
  }

  const sendMessage = async (chatId: string, recipientId: string, text: string): Promise<void> => {
    if (!session) throw new Error('No active session');

    const message: Message = {
      messageID: (globalThis as any)?.crypto?.randomUUID?.() ?? `local-${Date.now()}`,
      chatID: chatId,
      senderID: session.userId,
      contactID: recipientId,
      contents: text,
      timeStamp: new Date().toISOString(),
      timeRead: undefined,
    };

    setMessages((prev) => {
      const next = [...prev, message];
      return next;
    });

    let encrypted;
    try {
      encrypted = await session.cryptoManager.encryptMessage(recipientId, text);
    } catch(err) {
      console.error('encryptMessage failed', err);
      throw err;
    }
    const test: EncryptedMessage = {
      type: 12,
      body: text,
      registrationId: 1
    }

    try {
      session.ws.sendMessage(recipientId, encrypted);
    } catch (err) {
      console.warn('ws.sendMessage failed', err);
    }

    if (!storage) return;
    storage.appendMessage(chatId, message);
  };

  const searchUsers = async (searchText: string): Promise<string[]> => {
    if (!session) return [];
    console.log('test')
    const res = await session.api.makeRequest('searchUsers', { userQuery: searchText });
    console.log('res:', res);
    return res.data.usernames;
  }

  const getUserId = async (username: string): Promise<string> => {
    if(!session) return '';
    const res = await session.api.makeRequest('getUserId', {username: username});
    return res.data.userId;
  }
  
  const connectWs = async (s: AppSession) => {
    const t = await s.auth.getWsTicket();
    s.ws.connect(t);
  }
  const disconnect = () => session?.ws.disconnect();

  return(
    <ChatContext.Provider value={{ messages, isConnected, storage, loadChat, sendMessage, searchUsers, getUserId, connectWs, disconnect, refreshChats, refreshKey}}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if(!context) {
    throw new Error('useChat must be used within ChatProvider');
  };
  return context;
};