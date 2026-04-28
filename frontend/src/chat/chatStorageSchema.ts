import type { Contact } from '../types/Contact';
import type { Message } from '../types/Message';

export type ChatStorageSchema = {
  contacts: Record<string, Contact>;
  messages: Record<string, Message[]>;
};
