import type { ChatStorageSchema } from './chatStorageSchema';
import type { Contact } from '../types/Contact';
import type { Message } from '../types/Message';
import type { Me } from '../types/Me';

const contactMapCodec = {
  encode: (value: Record<string, Contact>): string => JSON.stringify(value),
  decode: (raw: string): Record<string, Contact> => JSON.parse(raw),
};

const messageMapCodec = {
  encode: (value: Record<string, Message[]>): string => JSON.stringify(value),
  decode: (raw: string): Record<string, Message[]> => JSON.parse(raw),
};

const meMapCodec = {
  encode: (value: Me): string => JSON.stringify(value),
  decode: (raw: string): Me => JSON.parse(raw),
};

export const chatCodecs: {
  [K in keyof ChatStorageSchema]: {
    encode: (value: ChatStorageSchema[K]) => string;
    decode: (raw: string) => ChatStorageSchema[K];
  };
} = {
  contacts: contactMapCodec,
  messages: messageMapCodec,
  me: meMapCodec,
};
