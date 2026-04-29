# 🚀 Quick Start Guide - Signal Protocol Encryption

## Complete Step-by-Step Implementation

### Step 1: Initialize Encryption on User Login

**When**: After successful login or registration  
**Where**: `AuthContext.tsx` or your login handler

```typescript
import encryption from '@/services/encryption';
import { serializeKeyBundle } from '@/services/encryption/utils';

// After user successfully logs in
async function handleUserLogin(userId: string, authToken: string) {
  try {
    // 1. Initialize encryption for this user
    const identity = await encryption.initialize(userId);
    console.log('✅ Encryption initialized:', identity);
    
    // 2. Generate public key bundle
    const keyBundle = await encryption.getKeyBundle();
    
    // 3. Serialize for network transmission
    const serializedBundle = serializeKeyBundle(keyBundle);
    
    // 4. Upload to your backend server
    const response = await fetch('https://your-api.com/api/users/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        userId,
        keyBundle: serializedBundle,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload key bundle');
    }
    
    console.log('✅ Key bundle uploaded to server');
    
  } catch (error) {
    console.error('❌ Failed to initialize encryption:', error);
    throw error;
  }
}
```

---

### Step 2: Sending Your First Message (Establishing Session)

**When**: First time you message a user  
**Where**: Chat screen or message handler

```typescript
import encryption from '@/services/encryption';
import { deserializeKeyBundle } from '@/services/encryption/utils';

async function sendMessage(
  recipientId: string,
  message: string,
  websocket: WebSocket,
  authToken: string
) {
  try {
    // 1. Check if we already have a session with this recipient
    const hasSession = await encryption.hasSessionWith(recipientId);
    
    let encrypted;
    
    if (!hasSession) {
      console.log('⚙️ No session exists, establishing new session...');
      
      // 2. Fetch recipient's public key bundle from server
      const response = await fetch(
        `https://your-api.com/api/users/${recipientId}/keys`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipient key bundle');
      }
      
      const serializedBundle = await response.json();
      
      // 3. Deserialize the key bundle
      const recipientKeyBundle = deserializeKeyBundle(serializedBundle);
      
      // 4. Encrypt message (this automatically creates the session)
      encrypted = await encryption.encrypt(
        recipientId,
        message,
        recipientKeyBundle
      );
      
      console.log('✅ Session established and message encrypted');
      
    } else {
      console.log('✅ Session exists, encrypting message...');
      
      // 5. Session exists, just encrypt the message
      encrypted = await encryption.encrypt(recipientId, message);
    }
    
    // 6. Send encrypted message via WebSocket
    const payload = {
      type: 'encrypted_message',
      recipientId,
      encrypted,
      timestamp: Date.now(),
    };
    
    websocket.send(JSON.stringify(payload));
    
    console.log('✅ Encrypted message sent');
    
    return encrypted;
    
  } catch (error) {
    console.error('❌ Failed to send encrypted message:', error);
    throw error;
  }
}
```

---

### Step 3: Sending Subsequent Messages (Session Already Exists)

**When**: Sending messages after the first one  
**Where**: Same message handler

```typescript
import encryption from '@/services/encryption';

async function sendSubsequentMessage(
  recipientId: string,
  message: string,
  websocket: WebSocket
) {
  try {
    // Since session exists, no need to fetch key bundle
    const encrypted = await encryption.encrypt(recipientId, message);
    
    // Send via WebSocket
    const payload = {
      type: 'encrypted_message',
      recipientId,
      encrypted,
      timestamp: Date.now(),
    };
    
    websocket.send(JSON.stringify(payload));
    
    console.log('✅ Message encrypted and sent');
    
  } catch (error) {
    console.error('❌ Failed to send message:', error);
    throw error;
  }
}
```

---

### Step 4: Receiving and Decrypting Messages

**When**: Message arrives via WebSocket  
**Where**: WebSocket message handler

```typescript
import encryption from '@/services/encryption';

async function handleIncomingMessage(data: string) {
  try {
    const parsed = JSON.parse(data);
    
    if (parsed.type === 'encrypted_message') {
      const { senderId, encrypted } = parsed;
      
      // 1. Decrypt the message
      const decryptedMessage = await encryption.decrypt(senderId, encrypted);
      
      console.log('✅ Message decrypted:', decryptedMessage);
      
      // 2. Display in your chat UI
      addMessageToChat({
        senderId,
        message: decryptedMessage,
        timestamp: parsed.timestamp,
      });
      
      return decryptedMessage;
    }
    
  } catch (error) {
    console.error('❌ Failed to decrypt message:', error);
    // Handle error - maybe show "Unable to decrypt message"
  }
}
```

---

## 🎯 Complete Integration Example

Here's how it all fits together in your React Native app:

### 1. AuthContext.tsx

```typescript
import React, { createContext, useState, useContext, useEffect } from 'react';
import encryption from '@/services/encryption';
import { serializeKeyBundle } from '@/services/encryption/utils';

interface AuthContextType {
  userId: string | null;
  login: (userId: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const login = async (userId: string, token: string) => {
    try {
      // Save auth info
      setUserId(userId);
      setAuthToken(token);
      
      // Initialize encryption
      const identity = await encryption.initialize(userId);
      const keyBundle = await encryption.getKeyBundle();
      const serialized = serializeKeyBundle(keyBundle);
      
      // Upload to server
      await fetch('https://your-api.com/api/users/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, keyBundle: serialized }),
      });
      
      console.log('✅ Logged in and encryption initialized');
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    setUserId(null);
    setAuthToken(null);
    // Optionally clear encryption data
    // await encryption.reset();
  };

  return (
    <AuthContext.Provider value={{ userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### 2. WebSocket Service (websocket.tsx)

```typescript
import encryption from '@/services/encryption';
import { deserializeKeyBundle } from '@/services/encryption/utils';

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: ((senderId: string, message: string) => void)[] = [];

  connect(url: string, token: string) {
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      // Authenticate
      this.ws?.send(JSON.stringify({ type: 'auth', token }));
    };
    
    this.ws.onmessage = async (event) => {
      await this.handleMessage(event.data);
    };
    
    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  }

  async handleMessage(data: string) {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.type === 'encrypted_message') {
        // Decrypt the message
        const decrypted = await encryption.decrypt(
          parsed.senderId,
          parsed.encrypted
        );
        
        // Notify all listeners
        this.messageHandlers.forEach(handler => {
          handler(parsed.senderId, decrypted);
        });
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
    }
  }

  async sendEncryptedMessage(
    recipientId: string,
    message: string,
    authToken: string
  ) {
    if (!this.ws) throw new Error('WebSocket not connected');
    
    // Check for existing session
    const hasSession = await encryption.hasSessionWith(recipientId);
    
    let encrypted;
    
    if (!hasSession) {
      // Fetch recipient's key bundle
      const response = await fetch(
        `https://your-api.com/api/users/${recipientId}/keys`,
        { headers: { 'Authorization': `Bearer ${authToken}` } }
      );
      
      const serialized = await response.json();
      const keyBundle = deserializeKeyBundle(serialized);
      
      // Encrypt with key bundle (establishes session)
      encrypted = await encryption.encrypt(recipientId, message, keyBundle);
    } else {
      // Session exists, just encrypt
      encrypted = await encryption.encrypt(recipientId, message);
    }
    
    // Send via WebSocket
    this.ws.send(JSON.stringify({
      type: 'encrypted_message',
      recipientId,
      encrypted,
      timestamp: Date.now(),
    }));
  }

  onMessage(handler: (senderId: string, message: string) => void) {
    this.messageHandlers.push(handler);
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export default new WebSocketService();
```

### 3. Chat Screen (Chat.tsx)

```typescript
import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text } from 'react-native';
import { useAuth } from '@/AuthContext';
import websocket from '@/services/websocket';

export function ChatScreen({ recipientId }: { recipientId: string }) {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    // Listen for incoming messages
    const handler = (senderId: string, message: string) => {
      if (senderId === recipientId) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          senderId,
          message,
          timestamp: Date.now(),
        }]);
      }
    };
    
    websocket.onMessage(handler);
  }, [recipientId]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    try {
      // Send encrypted message
      await websocket.sendEncryptedMessage(
        recipientId,
        inputText,
        'your-auth-token' // Get from auth context
      );
      
      // Add to local messages
      setMessages(prev => [...prev, {
        id: Date.now(),
        senderId: userId,
        message: inputText,
        timestamp: Date.now(),
      }]);
      
      setInputText('');
      
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>{item.senderId === userId ? 'You' : 'Them'}</Text>
            <Text>{item.message}</Text>
          </View>
        )}
      />
      
      <View style={{ flexDirection: 'row' }}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          style={{ flex: 1 }}
        />
        <Button title="Send" onPress={handleSend} />
      </View>
    </View>
  );
}
```

---

## 📊 Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     USER LOGS IN                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  encryption.initialize(userId)                              │
│  ├─ Generate registration ID                                │
│  ├─ Generate identity key pair                              │
│  ├─ Generate 100 pre-keys                                   │
│  └─ Generate signed pre-key                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  encryption.getKeyBundle()                                  │
│  └─ Returns PUBLIC keys only                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Upload to Server: POST /api/users/keys                     │
│  └─ Server stores public key bundle in database             │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│         USER SENDS FIRST MESSAGE TO RECIPIENT               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  encryption.hasSessionWith(recipientId)                     │
│  └─ Returns: false (no session exists)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Fetch from Server: GET /api/users/:recipientId/keys        │
│  └─ Returns recipient's public key bundle                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  encryption.encrypt(recipientId, message, keyBundle)        │
│  ├─ Creates session automatically                           │
│  └─ Encrypts the message                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Send via WebSocket                                         │
│  └─ { type: 'encrypted_message', encrypted: {...} }         │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│         USER SENDS SUBSEQUENT MESSAGES                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  encryption.hasSessionWith(recipientId)                     │
│  └─ Returns: true (session exists)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  encryption.encrypt(recipientId, message)                   │
│  └─ Uses existing session (no key bundle needed)            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Send via WebSocket                                         │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│         RECEIVING ENCRYPTED MESSAGE                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  WebSocket receives message                                 │
│  └─ { type: 'encrypted_message', senderId, encrypted }      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  encryption.decrypt(senderId, encrypted)                    │
│  ├─ If first message: creates session automatically         │
│  └─ Returns decrypted plaintext                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Display message in chat UI                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist

- [ ] Import encryption: `import encryption from '@/services/encryption';`
- [ ] Initialize on login: `await encryption.initialize(userId)`
- [ ] Upload key bundle to server
- [ ] Check session before encrypting: `await encryption.hasSessionWith(recipientId)`
- [ ] Fetch recipient's key bundle if no session exists
- [ ] Encrypt messages: `await encryption.encrypt(recipientId, message, keyBundle?)`
- [ ] Send encrypted via WebSocket
- [ ] Decrypt received messages: `await encryption.decrypt(senderId, encrypted)`
- [ ] Display decrypted messages in UI

---

## 🎯 Key Points

1. **Initialize once** on user login
2. **First message** requires fetching recipient's key bundle
3. **Subsequent messages** use existing session (no key bundle needed)
4. **Decryption** happens automatically when messages arrive
5. **Sessions** are created and managed automatically
6. **Private keys** never leave the device

That's it! 🎉
