# 🔐 Signal Protocol Backend Implementation Guide

## Problem: KeyId Uniqueness

**Issue:** Frontend generates random 24-bit keyIds (0 to 16,777,215). With 100 pre-keys per user, collisions are possible!

**Probability:** With 100 random keys, there's a ~0.03% chance of collision per user. Across thousands of users, this becomes likely.

## ✅ Solution: Separate PreKey Table + Unique Constraints

### **1. Database Schema**

#### **users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  
  -- Signal Protocol data (WITHOUT one-time pre-keys)
  signal_key_bundle JSONB,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  keys_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

#### **prekeys Table** (NEW - ensures uniqueness)
```sql
CREATE TABLE prekeys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_id INTEGER NOT NULL,
  public_key TEXT NOT NULL,
  consumed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  consumed_at TIMESTAMPTZ,
  
  -- UNIQUE CONSTRAINT: Prevents duplicate keyIds per user
  UNIQUE(user_id, key_id)
);

CREATE INDEX idx_prekeys_user_id ON prekeys(user_id);
CREATE INDEX idx_prekeys_consumed ON prekeys(consumed);
CREATE INDEX idx_prekeys_user_consumed ON prekeys(user_id, consumed);
```

### **2. Why This Works**

✅ **Prevents Collisions:**
```sql
UNIQUE(user_id, key_id)
```
- Database enforces that each `(userId, keyId)` pair is unique
- If collision detected, backend generates new keyId

✅ **Atomic Pre-Key Consumption:**
```typescript
// Transaction prevents race conditions
SELECT * FROM prekeys 
WHERE user_id = 'alice' AND consumed = FALSE 
ORDER BY created_at ASC 
LIMIT 1 
FOR UPDATE; -- Locks the row

UPDATE prekeys SET consumed = TRUE WHERE id = ...;
```

✅ **Scalable:**
- Separate table = better indexing
- Can query available pre-keys efficiently
- Easy to cleanup old consumed keys

## 🔄 How It Works

### **Upload Keys (Registration)**

```
Client                Backend                  Database
  │                      │                         │
  │─────Upload 100─────→│                         │
  │   pre-keys          │                         │
  │                      │                         │
  │                      │──For each pre-key────→│
  │                      │  INSERT with keyId      │
  │                      │                         │
  │                      │←────Success/Fail──────│
  │                      │                         │
  │                      │──If collision─────────→│
  │                      │  Generate new keyId     │
  │                      │  INSERT again           │
  │                      │                         │
  │←────Success─────────│                         │
```

### **Fetch Key Bundle (Establish Session)**

```
Alice                  Backend                  Database
  │                      │                         │
  │─Get Bob's keys────→│                         │
  │                      │                         │
  │                      │──START TRANSACTION────→│
  │                      │                         │
  │                      │──SELECT + LOCK────────→│
  │                      │  One unconsumed prekey  │
  │                      │                         │
  │                      │←────PreKey #42────────│
  │                      │                         │
  │                      │──Mark as consumed────→│
  │                      │  UPDATE consumed=TRUE   │
  │                      │                         │
  │                      │──COMMIT───────────────→│
  │                      │                         │
  │←───Bob's KeyBundle──│                         │
  │  (includes PreKey 42)                         │
```

## 📊 Key Benefits

| Benefit | How | Why |
|---------|-----|-----|
| **Uniqueness** | UNIQUE constraint | Database enforces it |
| **No Race Conditions** | Transaction + row lock | Atomic operations |
| **Automatic Collision Handling** | Catch constraint violation | Generate new keyId on collision |
| **Efficient Queries** | Indexed consumed column | Fast lookup of available keys |
| **Easy Monitoring** | Count unconsumed keys | Know when user needs more |
| **Cleanup** | Delete old consumed keys | Prevent table bloat |

## 🎯 Best Practices

### **1. Pre-Key Thresholds**
```typescript
// Warn user when low on pre-keys
if (availablePreKeys < 10) {
  notifyUser('Please upload more pre-keys');
}
```

### **2. Periodic Rotation**
```typescript
// Every 30 days, rotate signed pre-key
await keyService.rotateSignedPreKey(userId, newSignedPreKey);
```

### **3. Cleanup Old Keys**
```typescript
// Monthly cleanup: delete consumed keys older than 30 days
await keyService.cleanupOldPreKeys(30);
```

### **4. Monitor Key Usage**
```typescript
const stats = await keyService.getKeyStats(userId);
// {
//   totalPreKeys: 100,
//   availablePreKeys: 73,
//   consumedPreKeys: 27,
//   lastUpdated: Date
// }
```

## 🚀 API Endpoints

### **POST /api/keys/upload**
Upload key bundle after registration
```json
{
  "keyBundle": {
    "registrationId": 12345,
    "identityPubKey": "base64...",
    "signedPreKey": {
      "keyId": 1,
      "publicKey": "base64...",
      "signature": "base64..."
    },
    "oneTimePreKeys": [
      { "keyId": 100, "publicKey": "base64..." },
      { "keyId": 101, "publicKey": "base64..." }
      // ... 98 more
    ]
  }
}
```

### **GET /api/keys/:userId**
Get user's key bundle (consumes one pre-key)
```json
{
  "success": true,
  "keyBundle": {
    "registrationId": 12345,
    "identityPubKey": "base64...",
    "signedPreKey": { ... },
    "oneTimePreKeys": [
      { "keyId": 100, "publicKey": "base64..." }
    ]
  }
}
```

### **GET /api/keys/check-prekeys**
Check if user needs more pre-keys
```json
{
  "success": true,
  "needsMorePreKeys": true,
  "availableCount": 8,
  "threshold": 10
}
```

### **POST /api/keys/add-prekeys**
Add more pre-keys when running low
```json
{
  "preKeys": [
    { "keyId": 200, "publicKey": "base64..." },
    { "keyId": 201, "publicKey": "base64..." }
    // ... more
  ]
}
```

## ⚡ Performance Considerations

### **Indexes**
```sql
-- For fast lookup
CREATE INDEX idx_prekeys_user_consumed 
ON prekeys(user_id, consumed);

-- Query will use this index:
SELECT * FROM prekeys 
WHERE user_id = 'alice' AND consumed = FALSE;
```

### **Transaction Isolation**
```typescript
// Use pessimistic locking to prevent double-consumption
.setLock('pessimistic_write')
```

### **Batch Operations**
```typescript
// Insert pre-keys in batches, not one-by-one
await preKeyRepo.save(preKeysArray);
```

## 🔒 Security Notes

1. **Never store private keys** - only public keys on server
2. **Use HTTPS** - protect keys in transit
3. **Rate limit** key bundle requests - prevent DoS
4. **Validate formats** - ensure all keys are valid base64
5. **Monitor usage** - detect suspicious activity

## 📝 Summary

**Problem:** Random keyIds can collide  
**Solution:** Separate table with UNIQUE(userId, keyId) constraint  
**Benefits:** Database-enforced uniqueness + atomic operations  
**Result:** Zero collision issues, scalable, maintainable! ✅
