import Keychain from 'react-native-keychain';
import { SecureStorage } from '../../src/storage/secureStorage';

describe('SecureStorage', () => {
  beforeEach(() => {
    // Clear mock storage
    Keychain.__mockStore?.clear();
  });
  
  it('should store and retrieve exact data', async () => {
    const testData = { some: 'data', encoded: 'base64string' };
    const arraybuff = new ArrayBuffer(30)
    // Call your storage
    await SecureStorage.setItem('registrationId', 200);
    
    // Check what was actually stored in the mock
    const serviceKey = 'preKeys_service'; // Whatever your service() function returns
    const stored = Keychain.__mockStore?.get(serviceKey);
    
    // The password should be the JSON string from your encode() function
    expect(stored.password).toBe(JSON.stringify(testData));
    
    // Now retrieve it
    const retrieved = await SecureStorage.getItem('preKeys');
    expect(retrieved).toEqual(testData);
  });
  
  it('should handle records correctly', async () => {
    const keyId = '123';
    const keyPair = {
      pubKey: 'YWJj', // base64 'abc'
      privKey: 'ZGVm' // base64 'def'
    };
    
    // Add to record
    await SecureStorage.upsertRecordItem('preKeys', keyId, keyPair);
    
    // Retrieve it
    const retrieved = await SecureStorage.getRecordItem('preKeys', keyId);
    expect(retrieved).toEqual(keyPair);
  });
});