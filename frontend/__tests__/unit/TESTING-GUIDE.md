# 🧪 Encryption Testing Guide

## Test Structure Overview

The encryption tests are organized using Jest's `describe` blocks with shared setup to avoid repetition while maintaining clarity.

## 🏗️ Test Organization

```
describe('SignalProtocolManager')
├── Shared Variables (alice, bob, keyBundles)
├── Helper Functions (createUser, setupSession)
├── afterEach (cleanup)
│
├── describe('Initialization')
│   ├── beforeEach (setup specific to this group)
│   ├── test 1
│   ├── test 2
│   └── test 3
│
├── describe('Key Bundle Generation')
│   ├── beforeEach (setup specific to this group)
│   ├── test 1
│   └── test 2
│
├── describe('Session Management')
│   ├── beforeEach (setup specific to this group)
│   └── tests...
│
└── describe('Message Encryption & Decryption')
    ├── beforeEach (setup specific to this group)
    └── tests...
```

## 🔧 Helper Functions

### `createUser(userId)`
Creates and initializes a new test user instance.

```typescript
async function createUser(userId: string): Promise<SignalProtocolManager> {
  const manager = SignalProtocolManagerClass.createTestInstance();
  await manager.initialize(userId);
  return manager;
}
```

**Why:** Avoids repeating these 2 lines in every test.

### `setupSession(sender, recipientId, recipientKeyBundle)`
Establishes an encrypted session between two users.

```typescript
async function setupSession(
  sender: SignalProtocolManager,
  recipientId: string,
  recipientKeyBundle: KeyBundle
): Promise<void> {
  await sender.establishSession(recipientId, recipientKeyBundle);
}
```

**Why:** Makes it clear when a session is being established vs just encrypting.

## 📦 Shared Variables

### When to use `beforeEach` vs `beforeAll`

#### ✅ Use `beforeEach` (Current Approach)
```typescript
describe('Message Encryption', () => {
  let alice: SignalProtocolManager;
  let bob: SignalProtocolManager;

  beforeEach(async () => {
    alice = await createUser('alice');
    bob = await createUser('bob');
  });

  test('test 1', async () => {
    // Fresh alice & bob instances
  });

  test('test 2', async () => {
    // Fresh alice & bob instances (isolated from test 1)
  });
});
```

**Pros:**
- ✅ Each test gets fresh, isolated instances
- ✅ Tests don't affect each other
- ✅ Easy to debug - failure is isolated to one test
- ✅ Can modify state in tests without worrying

**Cons:**
- ⚠️ Slightly slower (creates instances for each test)

#### ❌ Use `beforeAll` (Not Recommended for Stateful Tests)
```typescript
describe('Message Encryption', () => {
  let alice: SignalProtocolManager;
  let bob: SignalProtocolManager;

  beforeAll(async () => {
    alice = await createUser('alice');
    bob = await createUser('bob');
  });

  test('test 1', async () => {
    await alice.encrypt('bob', 'msg1');
    // alice now has session with bob
  });

  test('test 2', async () => {
    // alice STILL has session from test 1! ❌
    // Tests are NOT isolated
  });
});
```

**Pros:**
- ✅ Faster (creates instances once)

**Cons:**
- ❌ Tests share state (side effects carry over)
- ❌ Test order matters (fragile)
- ❌ Hard to debug (which test caused the state change?)
- ❌ Can't run tests in isolation

## 🎯 Best Practices for This Test Suite

### 1. **Scope Variables Appropriately**

```typescript
describe('SignalProtocolManager', () => {
  // ✅ Declare at top level for type hints
  let alice: SignalProtocolManager;
  let bob: SignalProtocolManager;
  
  describe('Specific Feature', () => {
    // ✅ Initialize in beforeEach for isolation
    beforeEach(async () => {
      alice = await createUser('alice');
      bob = await createUser('bob');
    });

    test('feature works', async () => {
      // Use alice and bob
    });
  });
});
```

### 2. **Use Nested Describes for Logical Grouping**

```typescript
describe('Message Encryption & Decryption', () => {
  beforeEach(async () => {
    // Common setup for ALL encryption tests
    alice = await createUser('alice');
    bob = await createUser('bob');
  });

  test('basic encryption', async () => {
    // Test basic case
  });

  test('bidirectional messaging', async () => {
    // Test two-way communication
  });
});
```

### 3. **Clean Up After Each Test**

```typescript
afterEach(() => {
  // Reset singleton to avoid test interference
  SignalProtocolManagerClass.resetInstance();
});
```

### 4. **Use Descriptive Test Names**

```typescript
// ✅ Good - describes what is being tested
test('should encrypt and decrypt a message between two users', async () => {
  // ...
});

// ❌ Bad - unclear what is being tested
test('encryption works', async () => {
  // ...
});
```

## 📊 When to Create Fresh Instances

### **Use `createTestInstance()` when:**
- ✅ Testing multiple users simultaneously
- ✅ Need isolated state per test
- ✅ Testing user-to-user interactions

```typescript
test('alice and bob chat', async () => {
  const alice = SignalProtocolManagerClass.createTestInstance();
  const bob = SignalProtocolManagerClass.createTestInstance();
  // Each has separate state
});
```

### **Use `getInstance()` when:**
- ⚠️ Testing singleton behavior
- ⚠️ Need to verify same instance is returned

```typescript
test('getInstance returns same instance', () => {
  const instance1 = SignalProtocolManagerClass.getInstance();
  const instance2 = SignalProtocolManagerClass.getInstance();
  expect(instance1).toBe(instance2);
});
```

## 🔍 Debugging Failed Tests

### **Strategy 1: Run Single Test**
```bash
npm test -- -t "should encrypt and decrypt a message"
```

### **Strategy 2: Add Console Logs**
```typescript
test('encryption', async () => {
  console.log('Creating alice...');
  const alice = await createUser('alice');
  
  console.log('Encrypting message...');
  const encrypted = await alice.encrypt('bob', 'test');
  
  console.log('Encrypted:', encrypted);
});
```

### **Strategy 3: Check Shared State**
```typescript
beforeEach(async () => {
  console.log('Setting up fresh instances');
  alice = await createUser('alice');
  console.log('Alice initialized:', alice.isInitialized());
});
```

## 📝 Test Coverage Checklist

Our test suite covers:

- ✅ **Initialization**
  - Creating identity
  - Re-initialization
  - Checking initialization state

- ✅ **Key Bundle Generation**
  - Generating valid bundles
  - Error on uninitialized manager

- ✅ **Session Management**
  - Establishing sessions
  - Checking session existence
  - Removing sessions

- ✅ **Encryption/Decryption**
  - Basic message encryption
  - Auto-session creation
  - Sequential messages
  - Bidirectional messaging
  - Empty messages
  - Special characters
  - Long messages

- ✅ **Multi-User**
  - Multiple conversations
  - Separate session states

- ✅ **Reset**
  - Clearing data
  - Resetting singleton

- ✅ **Error Handling**
  - Uninitialized manager
  - Invalid encrypted data

## 🎉 Summary

**Current Approach (Recommended):**
```typescript
describe('Feature', () => {
  let alice, bob; // Declare for typing
  
  beforeEach(async () => {
    // Fresh instances per test
    alice = await createUser('alice');
    bob = await createUser('bob');
  });
  
  test('test 1', async () => {
    // Use alice & bob - isolated state
  });
  
  test('test 2', async () => {
    // Fresh alice & bob - no interference from test 1
  });
});
```

**Why This Works:**
1. ✅ Variables declared at describe level (good for typing)
2. ✅ Instances created in beforeEach (fresh per test)
3. ✅ Tests are isolated (no shared state)
4. ✅ Easy to debug (each test is independent)
5. ✅ Helper functions reduce repetition
6. ✅ Clear test organization with nested describes

**Result:** Clean, maintainable, debuggable tests! 🚀
