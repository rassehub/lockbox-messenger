import { SignedPublicPreKeyType, PreKeyType } from "@privacyresearch/libsignal-protocol-typescript";
type PreKey = {
  keyId: string;
  publicKey: ArrayBuffer;
}

type KeyBundle = {
  registrationId: string;
  identityPubKey: ArrayBuffer;
  signedPreKey: SignedPublicPreKeyType
  oneTimePreKeys: PreKeyType[]
}


export const endpointConfig = {
  // auth routes
  login: {
    url: "/api/login",
    method: "POST",
    request: {} as {
      phoneNumber: string;
      password: string;
    },
    response: {} as {
      success: boolean;
    },
  },

  logout: {
    url: "/api/logout",
    method: "DELETE",
    request: undefined,
    response: {} as {
      success: boolean;
    },
  },

  registerUser: {
    url: "/api/register",
    method: "POST",
    request: {} as {
      username: string;
      phoneNumber: string;
      password: string;
    },
    response: {} as {
      success: boolean;
    },
  },

  fetchCurrentUser: {
    url: "/api/me",
    method: "GET",
    request: undefined,
    response: {} as {
      userId: string;
    },
  },

  // key routes
  uploadKeyBundle: {
    url: "/keys/upload",
    method: "POST",
    request: {} as {
      keyBundle: KeyBundle;
    },
    response: {} as {
      success: boolean;
    },
  },

  rotateSignedPreKey: {
    url: "/keys/rotate-signed-prekey",
    method: "POST",
    request: {} as {
      newSignedPreKey: SignedPublicPreKeyType
    },
    response: {} as {
      success: boolean;
    },
  },

  addPreKeys: {
    url: "/keys/add-prekeys",
    method: "POST",
    request: {} as {
      preKeys: PreKey[];
    },
    response: {} as {
      availableCount: number;
    },
  },

  checkPreKeyAvailability: {
    url: "/keys/check-prekeys",
    method: "POST",
    request: undefined,
    response: {} as {
      needsMorePreKeys: boolean;
      availableCount: number;
      threshold: string;
    },
  },

  fetchMyKeyStatistics: {
    url: "/keys/stats/me",
    method: "GET",
    request: undefined,
    response: {} as {
      totalPreKeys: number;
      availablePreKeys: number;
      consumedPreKeys: number;
      lastUpdated: Date | null;
    },
  },

  fetchRecipientKeyBundle: {
    url: "/keys/get-recipient-keybundle",
    method: "GET",
    request: {} as {
      recipientId: string;
    },
    response: {} as {
      keyBundle: KeyBundle;
    },
  },
} as const;

export type EndpointSchema = {
  [K in keyof typeof endpointConfig]: {
    url: typeof endpointConfig[K]["url"];
    method: typeof endpointConfig[K]["method"];
    request: typeof endpointConfig[K]["request"];
    response: typeof endpointConfig[K]["response"];
  };
};
