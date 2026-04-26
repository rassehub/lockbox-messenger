// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock WebSocket
global.WebSocket = jest.fn();

import { jest } from '@jest/globals';
import crypto from 'crypto';

// Global storage
const mockStore = new Map();

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(async (username, password, options = {}) => {
    // Store exactly as passed
    mockStore.set(options.service, {
      username,
      password, // Store raw string
      service: options.service
    });
    return true;
  }),
  
  getGenericPassword: jest.fn(async (options = {}) => {
    const stored = mockStore.get(options.service);
    
    if (!stored) {
      return false; // "Not found"
    }
    
    // Return exactly as stored
    return {
      username: stored.username,
      password: stored.password, // Raw string
    };
  }),
  
  resetGenericPassword: jest.fn(async (options = {}) => {
    mockStore.delete(options.service);
    return true;
  }),
  
  ACCESSIBLE: {},
  SECURITY_LEVEL: {},
  AUTHENTICATION_TYPE: {},
  
  // Optional test helpers
  __mockStore: mockStore
}));

jest.mock('react-native-aes-crypto', () => {
  const mockCrypto = require('crypto');
  return {
    __esModule: true,
    default: {
      randomKey: jest.fn(async (bytes) => mockCrypto.randomBytes(bytes).toString('hex')),
      encrypt: jest.fn(async (text, key, iv, _mode) => {
        const cipher = mockCrypto.createCipheriv(
          'aes-256-cbc',
          Buffer.from(key, 'hex'),
          Buffer.from(iv, 'hex')
        );
        return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
      }),
      decrypt: jest.fn(async (ciphertext, key, iv, _mode) => {
        const decipher = mockCrypto.createDecipheriv(
          'aes-256-cbc',
          Buffer.from(key, 'hex'),
          Buffer.from(iv, 'hex')
        );
        return decipher.update(ciphertext, 'hex', 'utf8') + decipher.final('utf8');
      }),
    },
  };
});

// Clear before each test
beforeAll(() => {
  mockStore.clear();
});