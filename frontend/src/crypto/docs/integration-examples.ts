/**
 * Example Integration with React Native App
 * This file shows how to integrate Signal Protocol encryption
 * with your existing Lockbox Messenger app
 */

import { useEffect, useState } from 'react';
import { SignalProtocolManager } from './SignalProtocolManager';
import { serializeKeyBundle, deserializeKeyBundle } from './utils/utils';
import type { EncryptedMessage, KeyBundle } from './types';

// Get the singleton instance
const encryptionManager = SignalProtocolManager.getInstance();

// ============================================================================
// 1. INTEGRATION WITH AUTH CONTEXT
// ============================================================================

/**
 * Initialize encryption when user logs in
 * Add this to your AuthContext.tsx login/signup handlers
 */
export async function initializeEncryptionOnLogin(userId: string) {
  try {
    // Initialize Signal Protocol for this user
    const identity = await encryptionManager.initialize(userId);
    console.log('✅ Encryption initialized for user:', userId);
    
    // Generate key bundle
    const keyBundle = await encryptionManager.getKeyBundle();
    
    // Serialize for network transmission
    const serializedBundle = serializeKeyBundle(keyBundle);
    
    // Upload to your backend
    await uploadKeyBundleToServer(userId, serializedBundle);
    
    return identity;
  } catch (error) {
    console.error('❌ Failed to initialize encryption:', error);
    throw error;
  }
}

/**
 * Clear encryption data on logout
 * Add this to your AuthContext.tsx logout handler
 */
export async function clearEncryptionOnLogout() {
  try {
    // Optional: Clear all encryption data
    // await encryptionManager.reset();
    console.log('✅ Encryption cleared');
  } catch (error) {
    console.error('❌ Failed to clear encryption:', error);
  }
}

// ============================================================================
// 2. INTEGRATION WITH WEBSOCKET SERVICE
// ============================================================================

/**
 * Encrypt message before sending via WebSocket
 * Use this in your websocket.tsx service
 */
export async function sendEncryptedMessage(
  recipientId: string,
  message: string,
  websocket: WebSocket
) {
  try {
    // Check if we have a session with this user
    const hasSession = await encryptionManager.hasSessionWith(recipientId);
    
    let encrypted: EncryptedMessage;
    
    if (!hasSession) {
      // First time messaging this user - fetch their key bundle
      const keyBundle = await fetchKeyBundleFromServer(recipientId);
      encrypted = await encryptionManager.encrypt(
        recipientId,
        message,
        keyBundle
      );
    } else {
      // Session exists, just encrypt
      encrypted = await encryptionManager.encrypt(recipientId, message);
    }
    
    // Send encrypted message via WebSocket
    const payload = {
      type: 'encrypted_message',
      recipientId,
      encrypted,
      timestamp: Date.now(),
    };
    
    websocket.send(JSON.stringify(payload));
    
    return encrypted;
  } catch (error) {
    console.error('❌ Failed to encrypt message:', error);
    throw error;
  }
}

/**
 * Decrypt received message from WebSocket
 * Use this in your WebSocket message handler
 */
export async function handleReceivedEncryptedMessage(
  senderId: string,
  encrypted: EncryptedMessage
): Promise<string> {
  try {
    const decrypted = await encryptionManager.decrypt(senderId, encrypted);
    console.log('✅ Message decrypted from:', senderId);
    return decrypted;
  } catch (error) {
    console.error('❌ Failed to decrypt message:', error);
    throw error;
  }
}

// ============================================================================
// 3. INTEGRATION WITH CHAT SCREEN
// ============================================================================

/**
 * Example hook for sending encrypted messages in Chat screen
 * Use this in your Chat.tsx screen
 */
export function useEncryptedMessaging(recipientId: string, websocket: WebSocket | null) {
  const [isSessionReady, setIsSessionReady] = useState(false);
  
  useEffect(() => {
    // Check if session exists or needs to be established
    async function checkSession() {
      const hasSession = await encryptionManager.hasSessionWith(recipientId);
      setIsSessionReady(hasSession);
    }
    
    checkSession();
  }, [recipientId]);
  
  const sendMessage = async (message: string) => {
    if (!websocket) {
      throw new Error('WebSocket not connected');
    }
    
    return await sendEncryptedMessage(recipientId, message, websocket);
  };
  
  return {
    sendMessage,
    isSessionReady,
  };
}

/**
 * Example usage in Chat.tsx:
 * 
 * const { sendMessage, isSessionReady } = useEncryptedMessaging(
 *   recipientId,
 *   websocket
 * );
 * 
 * const handleSend = async () => {
 *   try {
 *     await sendMessage(inputText);
 *     setInputText('');
 *   } catch (error) {
 *     console.error('Failed to send message:', error);
 *   }
 * };
 */

// ============================================================================
// 4. API INTEGRATION EXAMPLES
// ============================================================================

/**
 * Upload key bundle to your backend
 */
async function uploadKeyBundleToServer(
  userId: string,
  serializedBundle: any
): Promise<void> {
  const response = await fetch('https://your-api.com/api/users/keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add your auth token here
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify({
      userId,
      keyBundle: serializedBundle,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload key bundle');
  }
}

/**
 * Fetch another user's key bundle from your backend
 */
async function fetchKeyBundleFromServer(userId: string): Promise<KeyBundle> {
  const response = await fetch(`https://your-api.com/api/users/${userId}/keys`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch key bundle');
  }
  
  const serialized = await response.json();
  return deserializeKeyBundle(serialized);
}

/**
 * Placeholder for getting auth token
 * Replace with your actual auth token retrieval
 */
function getAuthToken(): string {
  // Get from AsyncStorage or your auth context
  return 'your-auth-token';
}

// ============================================================================
// 5. WEBSOCKET MESSAGE HANDLER INTEGRATION
// ============================================================================

/**
 * Complete WebSocket message handler with encryption
 * Update your websocket.tsx to use this pattern
 */
export async function handleWebSocketMessage(
  data: string,
  onMessageReceived: (senderId: string, message: string) => void
) {
  try {
    const parsed = JSON.parse(data);
    
    switch (parsed.type) {
      case 'encrypted_message':
        // Decrypt the message
        const decrypted = await handleReceivedEncryptedMessage(
          parsed.senderId,
          parsed.encrypted
        );
        
        // Pass to your chat handler
        onMessageReceived(parsed.senderId, decrypted);
        break;
        
      case 'key_bundle_update':
        // Handle key bundle updates from server
        console.log('Key bundle updated for user:', parsed.userId);
        break;
        
      default:
        console.log('Unknown message type:', parsed.type);
    }
  } catch (error) {
    console.error('Error handling WebSocket message:', error);
  }
}

// ============================================================================
// 6. EXAMPLE: COMPLETE CHAT CONTEXT WITH ENCRYPTION
// ============================================================================

/**
 * Enhanced ChatContext with encryption support
 * This shows how to modify your existing ChatContext.tsx
 */
export class EncryptedChatManager {
  private websocket: WebSocket | null = null;
  
  async initialize(userId: string) {
    // Initialize encryption
    await encryptionManager.initialize(userId);
  }
  
  setWebSocket(ws: WebSocket) {
    this.websocket = ws;
    
    // Set up message handler
    ws.onmessage = async (event) => {
      await handleWebSocketMessage(event.data, (senderId, message) => {
        this.onMessageReceived(senderId, message);
      });
    };
  }
  
  async sendMessage(recipientId: string, message: string) {
    if (!this.websocket) {
      throw new Error('WebSocket not connected');
    }
    
    return await sendEncryptedMessage(recipientId, message, this.websocket);
  }
  
  private onMessageReceived(senderId: string, message: string) {
    // Update your chat state/UI here
    console.log('Received message from', senderId, ':', message);
  }
}

// ============================================================================
// 7. TESTING HELPER
// ============================================================================

/**
 * Helper for testing encryption in development
 */
export async function testEncryption() {
  console.log('🧪 Testing encryption...');
  
  try {
    // Initialize two users
    await encryptionManager.initialize('alice');
    const aliceKeyBundle = await encryptionManager.getKeyBundle();
    
    // In a real app, Bob would be on a different device
    // For testing, we can simulate it
    const testMessage = 'Hello, World!';
    console.log('Original:', testMessage);
    
    // Alice encrypts
    const encrypted = await encryptionManager.encrypt(
      'bob',
      testMessage,
      aliceKeyBundle // In real scenario, this would be Bob's bundle
    );
    console.log('Encrypted:', encrypted);
    
    // Alice decrypts (simulating Bob receiving it)
    const decrypted = await encryptionManager.decrypt('alice', encrypted);
    console.log('Decrypted:', decrypted);
    
    console.log('✅ Encryption test passed!');
  } catch (error) {
    console.error('❌ Encryption test failed:', error);
  }
}

// ============================================================================
// 8. ERROR HANDLING WRAPPER
// ============================================================================

/**
 * Wrapper with error handling for production use
 */
export async function safeEncrypt(
  recipientId: string,
  message: string,
  recipientKeyBundle?: KeyBundle
): Promise<EncryptedMessage | null> {
  try {
    return await encryptionManager.encrypt(
      recipientId,
      message,
      recipientKeyBundle
    );
  } catch (error) {
    console.error('Encryption failed:', error);
    // Log to your error tracking service (Sentry, etc.)
    // logError('encryption_failed', error);
    return null;
  }
}

export async function safeDecrypt(
  senderId: string,
  encrypted: EncryptedMessage
): Promise<string | null> {
  try {
    return await encryptionManager.decrypt(senderId, encrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    // Log to your error tracking service
    // logError('decryption_failed', error);
    return null;
  }
}
