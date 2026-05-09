import { createContext, useContext, useEffect, useState } from "react"
import { Message } from "./types/Message";
import { useSession } from "./SessionContext";
import { ChatStorage } from "./chat/chatStorage";

type ChatContextType = {
  messages: Message[];
  isConnected: boolean;
  storage: ChatStorage | undefined;
  loadChat: (chatId: string) => Promise<Message[]>;
  sendMessage: (chatId: string, recipientId: string, text: string) => Promise<void>;
  connect: () => void;
  disconnect: () => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useSession();
  const [storage, setStorage] = useState<ChatStorage>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if(!session) {
      setIsConnected(false);
      setStorage(undefined);
      setMessages([]);
      return;
    }

    session.ws.connect();
    setIsConnected(true);
    setStorage(session.chatStorage);

    session.ws.onMessage(async (raw: any) => {
      const plaintext = await session.cryptoManager.decryptMessage(raw.sender, raw.ciphertext);
      const message: Message = {
        messageID: raw.messageID || raw.messageId,
        chatID: raw.chatID || raw.chatId,
        senderID: raw.senderID || raw.sender,
        contents: plaintext,
        timeStamp: raw.timeStamp || raw.timeSent,
        timeRead: undefined,
      };

      if (!message.messageID) return;

      setMessages((prev) => [...prev, message]);
    });

    return () => {
      session.ws.disconnect();
      setIsConnected(false);
    };
  }, [session]);

  const loadChat = async (chatId: string) => {
    if(!storage) return [];
    const chat = await storage.getMessages(chatId);
    const validatedMessages = (chat ?? []).filter(
      (item): item is Message => item !== null && item !== undefined
    );
    const uniqueMessages = Array.from(
      new Map(validatedMessages.map((m) => [m.messageID, m])).values()
    );
    setMessages(uniqueMessages);
    return uniqueMessages;
  }

  const sendMessage = async (chatId: string, recipientId: string, text: string): Promise<void> => {
  if (!session) throw new Error('No active session');

  const message: Message = {
    messageID: (globalThis as any)?.crypto?.randomUUID?.() ?? `local-${Date.now()}`,
    chatID: chatId,
    senderID: session.userId,
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

  if(!storage) return;
  storage.appendMessage(chatId, message);
};

  const connect = () => session?.ws.connect();
  const disconnect = () => session?.ws.disconnect();

  return(
    <ChatContext.Provider value={{ messages, isConnected, storage, loadChat, sendMessage, connect, disconnect}}>
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