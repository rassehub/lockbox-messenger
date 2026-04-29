/**
 * Message encryption and decryption using Signal Protocol
 */

import { SignalProtocolStore } from './storage';
import { createSession, hasSession, getSessionCipher } from './session';
import type { EncryptedMessage, KeyBundle } from './types';

/**
 * Encrypt a message for a recipient
 * Automatically creates a session if one doesn't exist
 */
export const encryptMessage = async (
  recipientId: string,
  message: string,
  store: SignalProtocolStore,
  recipientKeyBundle?: KeyBundle,
  deviceId: number = 1
): Promise<EncryptedMessage> => {
  // Check if we have an existing session
  const sessionExists = await hasSession(recipientId, store, deviceId);

  // If no session exists, create one using the recipient's key bundle
  if (!sessionExists) {
    if (!recipientKeyBundle) {
      throw new Error(
        `No session exists with ${recipientId}. Please provide recipientKeyBundle to establish a session.`
      );
    }
    await createSession(recipientId, recipientKeyBundle, store, deviceId);
  }

  // Get the session cipher
  const cipher = getSessionCipher(recipientId, store, deviceId);

  // Encrypt the message
  const messageBuffer = stringToArrayBuffer(message);
  const ciphertext = await cipher.encrypt(messageBuffer);

  const registrationId = await store.getLocalRegistrationId();

  return {
    type: ciphertext.type,
    body: ciphertext.body || '', // body is already a string in the library
    registrationId: registrationId || 0,
  };
};

/**
 * Decrypt a message from a sender
 */
export const decryptMessage = async (
  senderId: string,
  encryptedMessage: EncryptedMessage,
  store: SignalProtocolStore,
  deviceId: number = 1
): Promise<string> => {
  const cipher = getSessionCipher(senderId, store, deviceId);

  let plaintext: ArrayBuffer;

  // Type 3 is a PreKeyWhisperMessage (used for initial messages)
  // Type 1 is a WhisperMessage (used for subsequent messages)
  if (encryptedMessage.type === 3) {
    plaintext = await cipher.decryptPreKeyWhisperMessage(encryptedMessage.body);
  } else if (encryptedMessage.type === 1) {
    plaintext = await cipher.decryptWhisperMessage(encryptedMessage.body);
  } else {
    throw new Error(`Unknown message type: ${encryptedMessage.type}`);
  }

  return arrayBufferToString(plaintext);
};

/**
 * Encrypt multiple messages in batch
 */
export const encryptMessages = async (
  messages: Array<{ recipientId: string; message: string; keyBundle?: KeyBundle }>,
  store: SignalProtocolStore
): Promise<Array<{ recipientId: string; encrypted: EncryptedMessage }>> => {
  const results = [];

  for (const { recipientId, message, keyBundle } of messages) {
    const encrypted = await encryptMessage(recipientId, message, store, keyBundle);
    results.push({ recipientId, encrypted });
  }

  return results;
};

/**
 * Decrypt multiple messages in batch
 */
export const decryptMessages = async (
  messages: Array<{ senderId: string; encrypted: EncryptedMessage }>,
  store: SignalProtocolStore
): Promise<Array<{ senderId: string; message: string }>> => {
  const results = [];

  for (const { senderId, encrypted } of messages) {
    const message = await decryptMessage(senderId, encrypted, store);
    results.push({ senderId, message });
  }

  return results;
};

// ==================== Helper Functions ====================

/**
 * Convert string to ArrayBuffer
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

/**
 * Convert ArrayBuffer to string
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
