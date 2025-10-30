import { createContext, useContext, useState } from "react"
import { Message } from "./types/Message";

interface ChatState {
  messages: Message[];
  isConnected: boolean;
  sendMessage: (recipientId: string, text: string) => void;
  connect: () => void;
}

export const ChatContext = createContext<ChatState | undefined>(undefined);