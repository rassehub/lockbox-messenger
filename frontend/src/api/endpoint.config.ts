import { SignedPublicPreKeyType, PreKeyType } from "@privacyresearch/libsignal-protocol-typescript";
type PreKey = {
  keyId: number;
  publicKey: ArrayBuffer;
}

type KeyBundle = {
  registrationId: number;
  identityPubKey: ArrayBuffer;
  signedPreKey: SignedPublicPreKeyType;
  oneTimePreKeys: PreKeyType[];
}


export const endpointConfig = {
  // auth routes
  login: {
    url: "/auth/login",
    method: "POST",
    request: {} as {
      phoneNumber: string;
      password: string;
    },
    response: {} as {
      userId: string;
    },
  },

  logout: {
    url: "/auth/logout",
    method: "DELETE",
    request: undefined,
    response: undefined,
  },

  registerUser: {
    url: "/auth/register",
    method: "POST",
    request: {} as {
      username: string;
      phoneNumber: string;
      password: string;
    },
    response: {} as {
      userId: string;
    },
  },

  fetchCurrentUser: {
    url: "/auth/me",
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
    response: undefined,
  },

  rotateSignedPreKey: {
    url: "/keys/rotate-signed-prekey",
    method: "POST",
    request: {} as {
      signedPreKey: SignedPublicPreKeyType
    },
    response: undefined,
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
      threshold: number;
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
      lastUpdated: Date;
    },
  },

  fetchRecipientKeyBundle: {
    url: "/keys/get-recipient-keybundle",
    method: "POST",
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
