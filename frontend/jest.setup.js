// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock WebSocket
global.WebSocket = jest.fn();

import { jest } from '@jest/globals';

// Global storage
const mockStore = new Map();

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(async (username, password, options = {}) => {
    // Store exactly as passed
    mockStore.set(options.service, {
      username,
      password, // Store raw string
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

// Clear before each test
beforeEach(() => {
  mockStore.clear();
});