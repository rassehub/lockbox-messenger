/// <reference path="../types/express.d.ts" />

import { Request, Response } from 'express';
import { SignalKeyService } from "../services/signalKeyService";
import { getDataSource } from "../db";
import logger from '@/utils/logger';

// Lazy initialization - create service only when first accessed
let keyService: SignalKeyService | null = null;

function getKeyService(): SignalKeyService {
  if (!keyService) {
    keyService = new SignalKeyService(getDataSource());
  }
  return keyService;
}

export const uploadKeyBundle = async (req: Request, res: Response): Promise<void> => {
    logger.info("HEADERS:", req.headers);
    try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { keyBundle } = req.body;

    // Validate key bundle structure
    if (
      !keyBundle ||
      !keyBundle.registrationId ||
      !keyBundle.identityPubKey ||
      !keyBundle.signedPreKey ||
      !Array.isArray(keyBundle.oneTimePreKeys)
    ) {
      res.status(400).json({ error: "Invalid key bundle format" });
      return;
    }

    await getKeyService().uploadKeyBundle(userId, keyBundle);

    res.json({
      success: true,
      message: "Key bundle uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading key bundle:", error);
    res.status(500).json({ error: "Failed to upload key bundle" });
  }
};

export const getKeyBundle = async (req: Request, res: Response): Promise<void> => {
      try {
    const { userId } = req.body;

    const keyBundle = await getKeyService().getKeyBundle(userId);

    res.json({
      success: true,
      keyBundle,
    });
  } catch (error: any) {
    console.error("Error fetching key bundle:", error);

    if (error.message.includes("No available pre-keys")) {
      res.status(503).json({
        error: "User has no available pre-keys",
        message: "The user needs to upload more pre-keys",
      });
      return;
    }

    res.status(500).json({ error: "Failed to fetch key bundle" });
  }
};

export const getKeyStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.session?.userId;
      
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    const stats = await getKeyService().getKeyStats(userId);
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching key stats:", error);
    res.status(500).json({ error: "Failed to fetch key stats" });
  }
}; 

export const checkPreKeys = async (req: Request, res: Response): Promise<void> => {
    logger.info('request user id:', req.session?.userId)
      try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    logger.info('getKeyStats called with userId:', userId);

    const needsMore = await getKeyService().needsMorePreKeys(userId, 10);
    const count = await getKeyService().getAvailablePreKeyCount(userId);
    logger.info('needs more:', needsMore);
    logger.info('count: ', count)

    res.json({
      success: true,
      needsMorePreKeys: needsMore,
      availableCount: count,
      threshold: 10,
    });
  } catch (error) {
    console.error("Error checking pre-keys:", error);
    res.status(500).json({ error: "Failed to check pre-keys" });
  }
};

export const addPreKeys = async (req: Request, res: Response): Promise<void> => {
    try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { preKeys } = req.body;

    if (!Array.isArray(preKeys) || preKeys.length === 0) {
      res.status(400).json({ error: "Invalid pre-keys format" });
      return;
    }

    await getKeyService().addOneTimePreKeys(userId, preKeys);

    const newCount = await getKeyService().getAvailablePreKeyCount(userId);

    res.json({
      success: true,
      message: `Added ${preKeys.length} pre-keys`,
      availableCount: newCount,
    });
  } catch (error) {
    console.error("Error adding pre-keys:", error);
    res.status(500).json({ error: "Failed to add pre-keys" });
  }
};

export const rotateSignedPreKey = async (req: Request, res: Response): Promise<void> => {
      try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { signedPreKey } = req.body;

    if (
      !signedPreKey ||
      !signedPreKey.keyId ||
      !signedPreKey.publicKey ||
      !signedPreKey.signature
    ) {
      res.status(400).json({ error: "Invalid signed pre-key format" });
      return;
    }

    await getKeyService().rotateSignedPreKey(userId, signedPreKey);

    res.json({
      success: true,
      message: "Signed pre-key rotated successfully",
    });
  } catch (error) {
    console.error("Error rotating signed pre-key:", error);
    res.status(500).json({ error: "Failed to rotate signed pre-key" });
  }
};
