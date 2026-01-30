import { jest } from '@jest/globals';
import { SetOptions } from 'react-native-keychain';

// Global mock storage - stores exactly what's passed in
const mockKeychainStore = new Map();

const mockKeychain = {
  __mockStore: mockKeychainStore,
  
  // Store exactly what's passed, no modification
  setGenericPassword: jest.fn(async (username, password, options: SetOptions = {}) => {
    const service = options.service; // This is the key
    mockKeychainStore.set(service, {
      username,
      password, // Raw password string as passed
      service
    });
    return true;
  }),
  
  // Return exactly what was stored
  getGenericPassword: jest.fn(async (options: SetOptions = {}) => {
    const service = options.service;
    const stored = mockKeychainStore.get(service);
    
    if (!stored) {
      return false; // Your code expects false for "not found"
    }
    
    // Return exactly what was stored
    return {
      username: stored.username,
      password: stored.password, // Raw string, not parsed
      service: stored.service,
      storage: 'keychain'
    };
  }),
  
  // Delete exactly by service name
  resetGenericPassword: jest.fn(async (options: SetOptions = {}) => {
    const service = options.service;
    mockKeychainStore.delete(service);
    return true;
  }),
  
  // Helper to clear storage between tests
  __clearMockStore: () => {
    mockKeychainStore.clear();
  },
  
  // Helper to inspect what's stored
  __getStoredData: (service: SetOptions) => {
    return mockKeychainStore.get(service);
  },
  
  // Helper to get all stored services
  __getAllServices: () => {
    return Array.from(mockKeychainStore.keys());
  },
  
  // Constants (empty is fine for your tests)
  ACCESSIBLE: {},
  SECURITY_LEVEL: {},
  AUTHENTICATION_TYPE: {}
};

// Global mock
jest.mock('react-native-keychain', () => mockKeychain);

export default mockKeychain;