# Signal Protocol Encryption - File Structure & Flow

## 📂 File Organization Overview

```
encryption/
│
├── 🎯 index.ts                     (Main entry point - exports everything)
│   └── Exports: SignalProtocolManager, all functions, types, utils
│
├── 🎮 SignalProtocolManager.ts     (High-level API - USE THIS!)
│   ├── initialize()                → Create/load user identity
│   ├── getKeyBundle()              → Generate keys for server upload
│   ├── encrypt()                   → Encrypt messages
│   ├── decrypt()                   → Decrypt messages
│   └── Session management helpers
│
├── 💾 storage.ts                   (Persistent storage layer)
│   ├── SignalProtocolStore class   → Implements StorageType interface
│   ├── Store/load identity keys
│   ├── Store/load pre-keys
│   ├── Store/load signed pre-keys
│   └── Store/load sessions
│       └── Uses: AsyncStorage (React Native)
│
├── 🆔 identity.ts                  (User identity & key bundles)
│   ├── createUserIdentity()        → Generate all keys on first use
│   ├── generateKeyBundle()         → Create public key bundle
│   ├── hasUserIdentity()           → Check if initialized
│   └── regeneratePreKeys()         → Rotate pre-keys
│
├── 🔗 session.ts                   (Session management)
│   ├── createSession()             → Establish encrypted channel
│   ├── hasSession()                → Check if session exists
│   ├── deleteSession()             → Remove session
│   └── getSessionCipher()          → Get cipher for encrypt/decrypt
│
├── 🔐 crypto.ts                    (Encryption/Decryption)
│   ├── encryptMessage()            → Encrypt single message
│   ├── decryptMessage()            → Decrypt single message
│   ├── encryptMessages()           → Batch encrypt
│   └── decryptMessages()           → Batch decrypt
│
├── 🔑 keys.ts                      (Key generation utilities)
│   ├── generateKeyId()             → Create unique key ID
│   ├── generateRegistrationId()    → Create registration ID
│   ├── generateIdentityKeyPair()   → Generate identity keys
│   ├── generatePreKey()            → Generate single pre-key
│   ├── generateSignedPreKey()      → Generate signed pre-key
│   └── generatePreKeys()           → Generate multiple pre-keys
│
├── 🛠️  utils.ts                     (Helper utilities)
│   ├── arrayBufferToBase64()       → For network transmission
│   ├── base64ToArrayBuffer()       → From network reception
│   ├── stringToArrayBuffer()       → For encrypting text
│   ├── arrayBufferToString()       → For decrypting text
│   ├── serializeKeyBundle()        → Prepare for API
│   ├── deserializeKeyBundle()      → Parse from API
│   └── generateFingerprint()       → Identity verification
│
└── 📝 types.ts                     (TypeScript definitions)
    ├── KeyBundle                   → Public key collection
    ├── UserIdentity                → User's identity info
    ├── EncryptedMessage            → Encrypted message structure
    └── MessagePayload              → Decrypted message data
```

## 🔄 Data Flow Diagrams

### 1️⃣ Initial Setup (First Time User)

```
User Registers/Logs In
         │
         ├─→ SignalProtocolManager.initialize(userId)
         │            │
         │            └─→ identity.createUserIdentity()
         │                        │
         │                        ├─→ keys.generateRegistrationId()
         │                        ├─→ keys.generateIdentityKeyPair()
         │                        ├─→ keys.generatePreKeys(100)
         │                        └─→ keys.generateSignedPreKey()
         │                                    │
         │                                    └─→ storage.store*() methods
         │                                            │
         │                                            └─→ AsyncStorage
         │
         ├─→ SignalProtocolManager.getKeyBundle()
         │            │
         │            └─→ identity.generateKeyBundle()
         │                        │
         │                        └─→ Returns public keys only
         │
         └─→ Upload to Server
                  │
                  └─→ POST /api/users/:userId/keys
```

### 2️⃣ Sending First Message to Someone New

```
User wants to message Bob
         │
         ├─→ Check: SignalProtocolManager.hasSessionWith('bob')
         │            └─→ false (no session exists)
         │
         ├─→ Fetch Bob's key bundle from server
         │            └─→ GET /api/users/bob/keys
         │                        │
         │                        └─→ utils.deserializeKeyBundle()
         │
         └─→ SignalProtocolManager.encrypt('bob', 'Hello!', bobKeyBundle)
                      │
                      ├─→ session.createSession()
                      │            │
                      │            └─→ SessionBuilder.processPreKey()
                      │                        │
                      │                        └─→ storage.storeSession()
                      │
                      └─→ crypto.encryptMessage()
                                   │
                                   ├─→ session.getSessionCipher()
                                   └─→ SessionCipher.encrypt()
                                               │
                                               └─→ Returns EncryptedMessage
                                                          │
                                                          └─→ Send via WebSocket
```

### 3️⃣ Sending Subsequent Messages

```
User sends another message to Bob
         │
         ├─→ Check: SignalProtocolManager.hasSessionWith('bob')
         │            └─→ true (session exists)
         │
         └─→ SignalProtocolManager.encrypt('bob', 'Hi again!')
                      │
                      └─→ crypto.encryptMessage()
                                   │
                                   ├─→ session.getSessionCipher()
                                   │            │
                                   │            └─→ storage.loadSession()
                                   │
                                   └─→ SessionCipher.encrypt()
                                               │
                                               └─→ Returns EncryptedMessage
                                                          │
                                                          └─→ Send via WebSocket
```

### 4️⃣ Receiving and Decrypting a Message

```
Receive message via WebSocket
         │
         └─→ SignalProtocolManager.decrypt(senderId, encryptedMsg)
                      │
                      └─→ crypto.decryptMessage()
                                   │
                                   ├─→ session.getSessionCipher()
                                   │            │
                                   │            └─→ storage.loadSession()
                                   │
                                   ├─→ Check message type
                                   │       ├─→ Type 3: PreKeyWhisperMessage (first msg)
                                   │       │            └─→ Creates new session
                                   │       └─→ Type 1: WhisperMessage (subsequent)
                                   │
                                   └─→ SessionCipher.decrypt*()
                                               │
                                               └─→ Returns plaintext
                                                          │
                                                          └─→ Display in chat UI
```

## 🎯 Which File Contains What?

| Function/Responsibility | File | When to Use |
|------------------------|------|-------------|
| **Initialize encryption** | `SignalProtocolManager.ts` | On user login |
| **Generate keys** | `keys.ts` | Called by identity.ts |
| **Store keys** | `storage.ts` | Auto-managed |
| **Create user identity** | `identity.ts` | On first setup |
| **Get public key bundle** | `identity.ts` | To upload to server |
| **Establish session** | `session.ts` | First message to user |
| **Encrypt message** | `crypto.ts` | Every outgoing message |
| **Decrypt message** | `crypto.ts` | Every incoming message |
| **Data conversion** | `utils.ts` | Network I/O |
| **Type definitions** | `types.ts` | TypeScript support |

## 💡 Quick Reference

### For App Developers (Use These):
- **`SignalProtocolManager.ts`** - Your main interface
- **`utils.ts`** - Helper for network data

### For Library Developers (Low-level):
- **`identity.ts`** - Identity management
- **`session.ts`** - Session management  
- **`crypto.ts`** - Encryption primitives
- **`keys.ts`** - Key generation
- **`storage.ts`** - Persistence layer

### Framework Code (Don't modify):
- **`types.ts`** - Type definitions
- **`index.ts`** - Export configuration

## 🔐 Security Responsibilities by File

| File | Security Role |
|------|--------------|
| `storage.ts` | Secure persistence of private keys |
| `identity.ts` | Key generation & protection |
| `session.ts` | Session establishment & validation |
| `crypto.ts` | Actual encryption/decryption |
| `keys.ts` | Cryptographically secure key generation |
| `utils.ts` | Safe data serialization |
| `SignalProtocolManager.ts` | Orchestration & error handling |
