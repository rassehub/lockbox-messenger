import { createContext, useContext, useEffect, useState } from "react"
import { Message } from "./types/Message";
import { useSession } from "./SessionContext";
import { ChatStorage } from "./chat/chatStorage";
import { AppSession } from "./bootstrap";
import { useAuthentication } from "./AuthContext";

type ChatContextType = {
  messages: Message[];
  isConnected: boolean;
  storage: ChatStorage | undefined;
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
        if(!storage) return;
        if(!username || !phonenumber || !userId) console.error('Missing info, username:', username, 'phonenumber:', phonenumber, 'userId:', userId);
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
    console.log(chat);
    const validatedMessages = (chat ?? []).filter(
      (item): item is Message => item !== null && item !== undefined
    );
    console.log('validated:', validatedMessages)
    const uniqueMessages = Array.from(
      new Map(validatedMessages.map((m) => [m.messageID, m])).values()
    );
    console.log('unique:', uniqueMessages)

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

    try {
      session.ws.sendMessage(recipientId, encrypted);
    } catch (err) {
      console.warn('ws.sendMessage failed', err);
    }

    if (!storage) return;
    storage.appendMessage(chatId, message);
  };

  const withTimeout = <T,>(p: Promise<T>, ms = 10000): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), ms);
      p.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
    });

  const searchUsers = async (searchText: string): Promise<string[]> => {
    if (!session) {
      console.warn('searchUsers: no session');
      return [];
    }
    if (!session.api || typeof session.api.makeRequest !== 'function') {
      console.warn('searchUsers: session.api.makeRequest missing', session?.api);
      return [];
    }

    try {
      const res = await withTimeout(session.api.makeRequest('searchUsers', { userQuery: searchText }), 10000);
      console.log('res:', res);
      return res?.data?.usernames ?? [];
    } catch (err) {
      console.error('searchUsers failed', err);
      return [];
    }
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
    <ChatContext.Provider value={{ messages, isConnected, storage, sendMessage, searchUsers, getUserId, connectWs, disconnect, refreshChats, refreshKey}}>
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