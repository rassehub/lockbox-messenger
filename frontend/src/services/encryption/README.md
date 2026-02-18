# Signal Protocol Encryption Service

This directory contains the implementation of end-to-end encryption for Lockbox Messenger using the Signal Protocol with the `libsignal-protocol-typescript` library.

## 📁 File Structure

```
encryption/
├── index.ts                    # Main export file - use this for imports
├── SignalProtocolManager.ts    # High-level API (recommended for most use cases)
├── storage.ts                  # Persistent storage implementation (AsyncStorage)
├── identity.ts                 # User identity and key bundle management
├── session.ts                  # Session establishment and management
├── crypto.ts                   # Message encryption/decryption functions
├── keys.ts                     # Key generation utilities
├── types.ts                    # TypeScript type definitions
└── README.md                   # This file
```

## 🔑 Core Concepts

### 1. Identity & Registration
- **Registration ID**: Unique identifier for your device
- **Identity Key Pair**: Long-term key pair that represents your identity
- **Pre-Keys**: One-time use keys for establishing initial sessions
- **Signed Pre-Key**: A pre-key signed with your identity key

### 2. Key Bundle
A collection of public keys that other users fetch to start a session with you:
- Registration ID
- Identity Public Key
- Signed Pre-Key
- One-Time Pre-Keys

### 3. Sessions
An established encrypted channel between two users. Once created, you can send/receive messages without exchanging keys again.

## 🚀 Quick Start Guide

### Step 1: Initialize on User Login/Registration

```typescript
import SignalProtocolManager from '@/services/encryption';

// After user successfully logs in or registers
const userId = 'user123'; // Get from your auth context
const identity = await SignalProtocolManager.initialize(userId);

console.log('Identity created:', identity);
// {
//   userId: 'user123',
//   registrationId: 12345,
//   identityKeyPair: { pubKey: ArrayBuffer, privKey: ArrayBuffer }
// }
```

### Step 2: Generate and Upload Key Bundle to Server

```typescript
// Get your key bundle
const keyBundle = await SignalProtocolManager.getKeyBundle();

// Upload to your backend server
await fetch('https://your-api.com/users/keys', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user123',
    keyBundle: {
      registrationId: keyBundle.registrationId,
      identityPubKey: arrayBufferToBase64(keyBundle.identityPubKey),
      signedPreKey: {
        keyId: keyBundle.signedPreKey.keyId,
        publicKey: arrayBufferToBase64(keyBundle.signedPreKey.publicKey),
        signature: arrayBufferToBase64(keyBundle.signedPreKey.signature),
      },
      oneTimePreKeys: keyBundle.oneTimePreKeys.map(key => ({
        keyId: key.keyId,
        publicKey: arrayBufferToBase64(key.publicKey),
      })),
    },
  }),
});
```

### Step 3: Encrypt and Send a Message

```typescript
// Check if session exists
const hasSession = await SignalProtocolManager.hasSessionWith('recipient123');

let encrypted;

if (!hasSession) {
  // First time messaging this user - fetch their key bundle from server
  const response = await fetch('https://your-api.com/users/recipient123/keys');
  const recipientKeyBundle = await response.json();
  
  // Convert base64 strings back to ArrayBuffers
  const keyBundle = {
    registrationId: recipientKeyBundle.registrationId,
    identityPubKey: base64ToArrayBuffer(recipientKeyBundle.identityPubKey),
    signedPreKey: {
      keyId: recipientKeyBundle.signedPreKey.keyId,
      publicKey: base64ToArrayBuffer(recipientKeyBundle.signedPreKey.publicKey),
      signature: base64ToArrayBuffer(recipientKeyBundle.signedPreKey.signature),
    },
    oneTimePreKeys: recipientKeyBundle.oneTimePreKeys.map(key => ({
      keyId: key.keyId,
      publicKey: base64ToArrayBuffer(key.publicKey),
    })),
  };
  
  // Encrypt will automatically establish session
  encrypted = await SignalProtocolManager.encrypt(
    'recipient123',
    'Hello, this is a secret message!',
    keyBundle
  );
} else {
  // Session already exists
  encrypted = await SignalProtocolManager.encrypt(
    'recipient123',
    'Hello, this is a secret message!'
  );
}

// Send encrypted message via WebSocket
websocket.send(JSON.stringify({
  type: 'message',
  recipientId: 'recipient123',
  encrypted: encrypted,
}));
```

### Step 4: Decrypt a Received Message

```typescript
// Receive encrypted message via WebSocket
websocket.on('message', async (data) => {
  const { senderId, encrypted } = JSON.parse(data);
  
  try {
    const decrypted = await SignalProtocolManager.decrypt(senderId, encrypted);
    console.log('Decrypted message:', decrypted);
    
    // Display message in your UI
    addMessageToChat(senderId, decrypted);
  } catch (error) {
    console.error('Failed to decrypt message:', error);
  }
});
```

## 📚 API Reference

### SignalProtocolManager (High-Level API)

#### `initialize(userId: string): Promise<UserIdentity>`
Initialize the encryption system for a user. Call this after login.

#### `getKeyBundle(): Promise<KeyBundle>`
Generate a key bundle to upload to the server.

#### `hasSessionWith(recipientId: string): Promise<boolean>`
Check if a session exists with a recipient.

#### `establishSession(recipientId: string, keyBundle: KeyBundle): Promise<void>`
Manually establish a session with a recipient.

#### `encrypt(recipientId: string, message: string, recipientKeyBundle?: KeyBundle): Promise<EncryptedMessage>`
Encrypt a message. Automatically establishes session if keyBundle provided.

#### `decrypt(senderId: string, encryptedMessage: EncryptedMessage): Promise<string>`
Decrypt a received message.

#### `removeSession(recipientId: string): Promise<void>`
Delete a session with a recipient.

#### `reset(): Promise<void>`
Clear all encryption data. Use with extreme caution!

### Low-Level Functions (Advanced Usage)

#### Identity Functions (`identity.ts`)
- `createUserIdentity(userId, store)` - Create new identity
- `generateKeyBundle(store)` - Generate key bundle
- `hasUserIdentity(store)` - Check if identity exists
- `regeneratePreKeys(store, startId, count)` - Regenerate pre-keys

#### Session Functions (`session.ts`)
- `createSession(recipientId, keyBundle, store)` - Establish session
- `hasSession(recipientId, store)` - Check session
- `deleteSession(recipientId, store)` - Delete session
- `getSessionCipher(recipientId, store)` - Get cipher for encryption

#### Crypto Functions (`crypto.ts`)
- `encryptMessage(recipientId, message, store, keyBundle?)` - Encrypt
- `decryptMessage(senderId, encrypted, store)` - Decrypt
- `encryptMessages(messages, store)` - Batch encrypt
- `decryptMessages(messages, store)` - Batch decrypt

## 🔒 Security Best Practices

1. **Never expose private keys**: Never send identity key pairs or pre-key private keys over the network
2. **Verify identity keys**: In production, implement fingerprint verification for identity keys
3. **Rotate pre-keys**: Regenerate pre-keys periodically to maintain forward secrecy
4. **Secure storage**: AsyncStorage is used but consider additional encryption for sensitive data
5. **Session management**: Delete sessions when a user logs out or changes devices

## 🧪 Testing Example

```typescript
// Example test
describe('Encryption', () => {
  it('should encrypt and decrypt messages', async () => {
    // Initialize Alice
    await SignalProtocolManager.initialize('alice');
    const aliceKeyBundle = await SignalProtocolManager.getKeyBundle();
    
    // Initialize Bob (in another instance/device)
    const bobManager = SignalProtocolManager.getInstance();
    await bobManager.initialize('bob');
    const bobKeyBundle = await bobManager.getKeyBundle();
    
    // Alice sends message to Bob
    const encrypted = await SignalProtocolManager.encrypt(
      'bob',
      'Hello Bob!',
      bobKeyBundle
    );
    
    // Bob decrypts message from Alice
    const decrypted = await bobManager.decrypt('alice', encrypted);
    
    expect(decrypted).toBe('Hello Bob!');
  });
});
```

## 🔄 Integration with Backend

Your backend needs to:

1. **Store key bundles**: When users register/login, store their public key bundles
2. **Serve key bundles**: Provide an endpoint for users to fetch other users' key bundles
3. **Track pre-key usage**: When a pre-key is used, mark it as consumed
4. **Notify on low pre-keys**: Alert clients when they need to upload more pre-keys

Example backend endpoints:
```
POST   /api/users/:userId/keys          - Upload key bundle
GET    /api/users/:userId/keys          - Fetch user's key bundle
DELETE /api/users/:userId/keys/prekeys  - Mark pre-key as used
```

## 📦 Type Definitions

See `types.ts` for all TypeScript interfaces:
- `KeyBundle` - Public keys for establishing sessions
- `UserIdentity` - User's identity information
- `EncryptedMessage` - Encrypted message structure
- `MessagePayload` - Decrypted message structure

## 🐛 Troubleshooting

**Error: "SignalProtocolManager not initialized"**
- Solution: Call `SignalProtocolManager.initialize(userId)` after user login

**Error: "No session exists"**
- Solution: Provide the recipient's key bundle when encrypting for the first time

**Error: "Failed to decrypt message"**
- Check message type (should be 1 or 3)
- Ensure session was properly established
- Verify message wasn't corrupted during transmission

## 📖 Further Reading

- [Signal Protocol Documentation](https://signal.org/docs/)
- [libsignal-protocol-typescript on GitHub](https://github.com/privacyresearch/libsignal-protocol-typescript)
- [Understanding the Signal Protocol](https://signal.org/docs/specifications/doubleratchet/)
