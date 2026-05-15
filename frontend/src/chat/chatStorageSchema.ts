import type { Contact } from '../types/Contact';
import type { Message } from '../types/Message';
import type { Me } from '../types/Me';

export type ChatStorageSchema = {
  contacts: Record<string, Contact>;
  messages: Record<string, Message[]>;
  me: Me;
};
