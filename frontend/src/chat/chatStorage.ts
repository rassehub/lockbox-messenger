import { SecureStorage } from '../storage/secureStorage';
import { chatCodecs } from './chatStorageCodecs';
import type { ChatStorageSchema } from './chatStorageSchema';
import type { Contact } from '../types/Contact';
import type { Message } from '../types/Message';

export class ChatStorage {
  private storage;

  constructor(userId: string) {
    this.storage = new SecureStorage<ChatStorageSchema, typeof chatCodecs>(
      `${userId}.chat`,
      chatCodecs
    );
  }

  // ==================== Contacts ====================

  async saveContact(contact: Contact): Promise<void> {
    await this.storage.upsertRecordItem('contacts', contact.userId, contact);
  }

  async getContact(userId: string): Promise<Contact | undefined> {
    return this.storage.getRecordItem('contacts', userId);
  }

  async getAllContacts(): Promise<Contact[]> {
    const record = await this.storage.getFullRecord('contacts');
    return record ? Object.values(record) : [];
  }

  async removeContact(userId: string): Promise<void> {
    await this.storage.removeRecordItem('contacts', userId);
  }

  // ==================== Messages ====================

  async appendMessage(chatId: string, message: Message): Promise<void> {
    const existing = await this.storage.getRecordItem('messages', chatId) ?? [];
    existing.push(message);
    await this.storage.upsertRecordItem('messages', chatId, existing);
  }

  async getMessages(chatId: string): Promise<Message[]> {
    return (await this.storage.getRecordItem('messages', chatId)) ?? [];
  }

  async getLatestMessage(chatId: string): Promise<Message | undefined> {
    const msgs = await this.getMessages(chatId);
    return msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
  }

  async markRead(chatId: string, messageId: string, timeRead: string): Promise<void> {
    const msgs = await this.getMessages(chatId);
    const target = msgs.find(m => m.messageID === messageId);
    if (target) {
      target.timeRead = timeRead;
      await this.storage.upsertRecordItem('messages', chatId, msgs);
    }
  }

  async clearChat(chatId: string): Promise<void> {
    await this.storage.removeRecordItem('messages', chatId);
  }

  async clearAll(): Promise<void> {
    await this.storage.removeItem('contacts');
    await this.storage.removeItem('messages');
  }
}
