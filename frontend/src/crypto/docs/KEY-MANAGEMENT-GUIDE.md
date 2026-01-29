# Client-Side Encryption Key Management - Usage Guide

This guide shows you how to use the encryption key management system that integrates with your server.

## File Structure

```
src/services/encryption/
├── keyService.ts       # NEW - Server communication for keys
├── keyManager.ts       # NEW - High-level integration layer
├── SignalProtocolManager.ts  # Existing - Local Signal Protocol
├── types.ts           # Updated - Added SignalKeyBundle type
└── ...other encryption files
```

## Setup

### 1. On User Registration

After a user successfully registers, initialize their encryption keys and upload to server:

```typescript
import { AuthService } from './services/auth';
import { KeyManager } from './services/encryption/keyManager';

async function handleRegistration(username: string, phoneNumber: string, password: string) {
  const authService = new AuthService();
  
  // 1. Register with server
  const { userId, sessionCookie } = await authService.register(username, phoneNumber, password);
  
  // 2. Initialize encryption for new user
  const keyManager = new KeyManager(userId);
  await keyManager.initializeForNewUser(sessionCookie);
  
  console.log('User registered and encryption initialized!');
}
```

### 2. On User Login

When a user logs in, initialize their existing encryption identity:

```typescript
import { AuthService } from './services/auth';
import { KeyManager } from './services/encryption/keyManager';

async function handleLogin(phoneNumber: string, password: string) {
  const authService = new AuthService();
  
  // 1. Login to server
  const { userId, sessionCookie } = await authService.login(phoneNumber, password);
  
  // 2. Initialize encryption for existing user
  const keyManager = new KeyManager(userId);
  await keyManager.initializeForExistingUser(sessionCookie);
  
  console.log('User logged in and encryption ready!');
}
```

### 3. On App Startup (for already logged-in users)

```typescript
import { keyManager } from './services/encryption/keyManager';

async function initializeApp() {
  // Get current user ID from your auth context
  const currentUserId = await getCurrentUserId();
  const sessionCookie = await getSessionCookie();
  
  if (currentUserId && sessionCookie) {
    const keyManager = new KeyManager(currentUserId);
    await keyManager.initializeForExistingUser(sessionCookie);
    
    // Run background maintenance (check/replenish keys)
    await keyManager.maintainKeys();
  }
}
```

## Sending Encrypted Messages

### First Message to a New Contact

```typescript
import { KeyManager } from './services/encryption/keyManager';

async function sendFirstMessage(recipientUserId: string, message: string) {
  const keyManager = new KeyManager(currentUserId);
  
  try {
    // Encrypt message (automatically fetches recipient's keys if needed)
    const encrypted = await keyManager.encryptMessage(recipientUserId, message);
    
    // Send via WebSocket or HTTP
    await sendMessageToServer({
      recipientId: recipientUserId,
      encryptedMessage: encrypted
    });
  } catch (error) {
    console.error('Failed to send encrypted message:', error);
  }
}
```

### Subsequent Messages

```typescript
async function sendMessage(recipientUserId: string, message: string) {
  const keyManager = new KeyManager(currentUserId);
  
  // Session already exists, just encrypt and send
  const encrypted = await keyManager.encryptMessage(recipientUserId, message);
  
  await sendMessageToServer({
    recipientId: recipientUserId,
    encryptedMessage: encrypted
  });
}
```

## Receiving Encrypted Messages

```typescript
import { KeyManager } from './services/encryption/keyManager';

async function handleIncomingMessage(senderId: string, encryptedMessage: { type: number; body: string }) {
  const keyManager = new KeyManager(currentUserId);
  
  try {
    // Decrypt the message
    const decrypted = await keyManager.decryptMessage(senderId, encryptedMessage);
    
    // Display to user
    displayMessage(senderId, decrypted);
  } catch (error) {
    console.error('Failed to decrypt message:', error);
  }
}
```

## Background Maintenance

Run this periodically to keep keys healthy:

```typescript
import { KeyManager } from './services/encryption/keyManager';

// Run on app startup
async function startup() {
  const keyManager = new KeyManager(currentUserId);
  await keyManager.maintainKeys();
}

// Or set up a periodic check (e.g., every hour)
setInterval(async () => {
  const keyManager = new KeyManager(currentUserId);
  await keyManager.checkAndReplenishKeys();
}, 60 * 60 * 1000); // Every hour
```

## React Context Integration Example

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { KeyManager } from './services/encryption/keyManager';

interface EncryptionContextType {
  keyManager: KeyManager | null;
  initializeEncryption: (userId: string, sessionCookie: string, isNewUser: boolean) => Promise<void>;
  encryptMessage: (recipientId: string, message: string) => Promise<{ type: number; body: string }>;
  decryptMessage: (senderId: string, encrypted: { type: number; body: string }) => Promise<string>;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

export const EncryptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [keyManager, setKeyManager] = useState<KeyManager | null>(null);

  const initializeEncryption = async (userId: string, sessionCookie: string, isNewUser: boolean) => {
    const manager = new KeyManager(userId);
    
    if (isNewUser) {
      await manager.initializeForNewUser(sessionCookie);
    } else {
      await manager.initializeForExistingUser(sessionCookie);
    }
    
    setKeyManager(manager);
  };

  const encryptMessage = async (recipientId: string, message: string) => {
    if (!keyManager) throw new Error('Encryption not initialized');
    return await keyManager.encryptMessage(recipientId, message);
  };

  const decryptMessage = async (senderId: string, encrypted: { type: number; body: string }) => {
    if (!keyManager) throw new Error('Encryption not initialized');
    return await keyManager.decryptMessage(senderId, encrypted);
  };

  return (
    <EncryptionContext.Provider value={{ keyManager, initializeEncryption, encryptMessage, decryptMessage }}>
      {children}
    </EncryptionContext.Provider>
  );
};

export const useEncryption = () => {
  const context = useContext(EncryptionContext);
  if (!context) throw new Error('useEncryption must be used within EncryptionProvider');
  return context;
};
```

## Usage in Components

```tsx
import { useEncryption } from './EncryptionContext';
import { useAuth } from './AuthContext';

function ChatScreen() {
  const { encryptMessage, decryptMessage } = useEncryption();
  const { currentUserId } = useAuth();

  const handleSendMessage = async (recipientId: string, text: string) => {
    try {
      const encrypted = await encryptMessage(recipientId, text);
      
      // Send via WebSocket
      websocket.send(JSON.stringify({
        type: 'message',
        recipientId,
        encrypted
      }));
    } catch (error) {
      console.error('Encryption failed:', error);
    }
  };

  return (
    // Your chat UI
  );
}
```

## API Reference

### KeyManager Methods

- `initializeForNewUser(sessionCookie)` - Set up encryption for newly registered user
- `initializeForExistingUser(sessionCookie)` - Load encryption for returning user
- `encryptMessage(recipientId, message)` - Encrypt a message to send
- `decryptMessage(senderId, encryptedMessage)` - Decrypt a received message
- `getUserKeysForSession(recipientId)` - Manually fetch recipient's keys (usually automatic)
- `checkAndReplenishKeys()` - Check and upload more pre-keys if needed
- `maintainKeys()` - Run full key maintenance (replenish + rotate)
- `getKeyStatistics()` - Get stats about your keys from server
- `removeSession(userId)` - Delete encryption session with a user

### KeyService Methods (Low-level, used by KeyManager)

- `uploadKeyBundle(keyBundle)` - Upload initial keys to server
- `getKeyBundle(userId)` - Fetch another user's keys
- `checkPreKeys()` - Check pre-key status
- `addPreKeys(preKeys)` - Upload additional pre-keys
- `rotateSignedPreKey(signedPreKey)` - Update signed pre-key
- `getKeyStatistics()` - Get key stats

## Complete Integration Example

See `/frontend/src/services/encryption/keyManager.ts` for the implementation and `/frontend/src/services/encryption/keyService.ts` for server communication.

The system automatically:
- ✅ Generates encryption keys locally
- ✅ Uploads public keys to server
- ✅ Fetches recipient keys when needed
- ✅ Creates encrypted sessions
- ✅ Monitors and replenishes pre-keys
- ✅ Rotates signed pre-keys every 30 days
