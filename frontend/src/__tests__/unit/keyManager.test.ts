/**
 * Unit tests for KeyManager - Basic Functionality
 * Tests instantiation and basic properties
 */

import { KeyManager } from '../../services/encryption/keyManager';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../../services/encryption/utils';

describe('KeyManager - Basic Functionality', () => {
  let keyManager: KeyManager;
  const userId = 'test-user-123';

  beforeEach(() => {
    keyManager = new KeyManager(userId);
  });

  describe('Instantiation', () => {
    it('should create a KeyManager instance with userId', () => {
      expect(keyManager).toBeDefined();
      expect((keyManager as any).userId).toBe(userId);
    });

    it('should have SignalProtocolManager instance', () => {
      expect((keyManager as any).signalManager).toBeDefined();
    });

    it('should provide encryption methods', () => {
      expect(typeof keyManager.initializeForNewUser).toBe('function');
      expect(typeof keyManager.initializeForExistingUser).toBe('function');
      expect(typeof keyManager.encryptMessage).toBe('function');
      expect(typeof keyManager.decryptMessage).toBe('function');
      expect(typeof keyManager.maintainKeys).toBe('function');
      expect(typeof keyManager.getKeyStatistics).toBe('function');
    });
  });

  describe('Utils - Format Conversion Helpers', () => {
    it('should convert ArrayBuffer to base64', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
      const base64 = arrayBufferToBase64(buffer);
      
      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);
      expect(base64).toBe('SGVsbG8=');
    });

    it('should convert base64 to ArrayBuffer', () => {
      const base64 = 'SGVsbG8='; // "Hello" in base64
      const buffer = base64ToArrayBuffer(base64);
      
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBe(5);
      
      const array = new Uint8Array(buffer);
      expect(Array.from(array)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should round-trip ArrayBuffer through base64', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 255, 254, 253]).buffer;
      const base64 = arrayBufferToBase64(original);
      const restored = base64ToArrayBuffer(base64);
      
      const originalArray = new Uint8Array(original);
      const restoredArray = new Uint8Array(restored);
      
      expect(restoredArray.length).toBe(originalArray.length);
      for (let i = 0; i < originalArray.length; i++) {
        expect(restoredArray[i]).toBe(originalArray[i]);
      }
    });

    it('should handle empty ArrayBuffer', () => {
      const buffer = new ArrayBuffer(0);
      const base64 = arrayBufferToBase64(buffer);
      expect(base64).toBe('');
    });

    it('should handle binary data with all byte values', () => {
      // Test with all possible byte values 0-255
      const testData = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        testData[i] = i;
      }
      
      const base64 = arrayBufferToBase64(testData.buffer);
      const restored = base64ToArrayBuffer(base64);
      const restoredArray = new Uint8Array(restored);
      
      expect(restoredArray.length).toBe(256);
      for (let i = 0; i < 256; i++) {
        expect(restoredArray[i]).toBe(i);
      }
    });

    it('should handle large buffers', () => {
      // Test with 10KB of random data
      const largeData = new Uint8Array(10240);
      for (let i = 0; i < largeData.length; i++) {
        largeData[i] = Math.floor(Math.random() * 256);
      }
      
      const base64 = arrayBufferToBase64(largeData.buffer);
      const restored = base64ToArrayBuffer(base64);
      
      expect(restored.byteLength).toBe(largeData.buffer.byteLength);
      
      const restoredArray = new Uint8Array(restored);
      for (let i = 0; i < largeData.length; i++) {
        expect(restoredArray[i]).toBe(largeData[i]);
      }
    });
  });
});
