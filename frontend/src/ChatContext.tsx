import { createContext, useContext, useEffect, useState } from "react"
import { Message } from "./types/Message";
import { useSession } from "./SessionContext";
import { ChatStorage } from "./chat/chatStorage";

type ChatContextType = {
  messages: Message[];
  isConnected: boolean;
  storage: ChatStorage | undefined;
  sendMessage: (recipientId: string, text: string) => Promise<void>;
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
      return;
    }

    session.ws.connect();
    setIsConnected(true);
    setStorage(session.chatStorage);

    session.ws.onMessage(async (raw: any) => {
      const plaintext = await session.cryptoManager.decryptMessage(raw.sender, raw.ciphertext);
      const message: Message = {
        messageID: raw.messageId,
        chatID: raw.chatId,
        senderID: raw.sender,
        contents: plaintext,
        timeStamp: raw.timeSent,
        timeRead: undefined,
      };
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      session.ws.disconnect();
      setIsConnected(false);
    };
  }, [session]);

  const sendMessage = async (recipientId: string, text: string): Promise<void> => {
    if(!session) throw new Error('No active session');
    const encrypted = await session.cryptoManager.encryptMessage(recipientId, text);
    session.ws.sendMessage(recipientId, encrypted);
  };

  const connect = () => session?.ws.connect();
  const disconnect = () => session?.ws.disconnect();

  return(
    <ChatContext.Provider value={{ messages, isConnected, storage, sendMessage, connect, disconnect}}>
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