import { jest } from '@jest/globals';
// Simple mock that returns success for everything
const mockKeychain = {
  setGenericPassword: jest.fn().mockResolvedValue(true as never),
  getGenericPassword: jest.fn().mockResolvedValue(false as never), // Returns false = not found
  resetGenericPassword: jest.fn().mockResolvedValue(true as never),
  
  // Add any other methods your app uses
  getInternetCredentials: jest.fn().mockResolvedValue(null as never),
  setInternetCredentials: jest.fn().mockResolvedValue(true as never),
  resetInternetCredentials: jest.fn().mockResolvedValue(true as never),
  
  // ACCESSIBLE constants (common ones)
  ACCESSIBLE: {
    WHEN_UNLOCKED: 'AccessibleWhenUnlocked',
    AFTER_FIRST_UNLOCK: 'AccessibleAfterFirstUnlock',
    ALWAYS: 'AccessibleAlways',
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'AccessibleWhenPasscodeSetThisDeviceOnly',
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly',
    ALWAYS_THIS_DEVICE_ONLY: 'AccessibleAlwaysThisDeviceOnly'
  },
  
  // Other constants
  SECURITY_LEVEL: {
    SECURE_SOFTWARE: 'SECURE_SOFTWARE',
    SECURE_HARDWARE: 'SECURE_HARDWARE',
    ANY: 'ANY'
  },
  
  // Authentication types
  AUTHENTICATION_TYPE: {
    DEVICE_PASSCODE_OR_BIOMETRICS: 'AuthenticationWithBiometricsDevicePasscode',
    BIOMETRICS: 'AuthenticationWithBiometrics'
  }
};

export default mockKeychain;