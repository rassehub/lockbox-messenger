import { Request, Response } from 'express';
import { SignalKeyService } from "../services/signalKeyService";
import { getDataSource } from "../db";

const keyService = new SignalKeyService(getDataSource());

export const uploadKeyBundle = async (req: Request, res: Response): Promise<void> => {
    try {
    const userId = req.user?.id; // From auth middleware
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

    await keyService.uploadKeyBundle(userId, keyBundle);

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
    const { userId } = req.params;

    const keyBundle = await keyService.getKeyBundle(userId);

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
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const stats = await keyService.getKeyStats(userId);

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
      try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const needsMore = await keyService.needsMorePreKeys(userId, 10);
    const count = await keyService.getAvailablePreKeyCount(userId);

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
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { preKeys } = req.body;

    if (!Array.isArray(preKeys) || preKeys.length === 0) {
      res.status(400).json({ error: "Invalid pre-keys format" });
      return;
    }

    await keyService.addOneTimePreKeys(userId, preKeys);

    const newCount = await keyService.getAvailablePreKeyCount(userId);

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
    const userId = req.user?.id;
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

    await keyService.rotateSignedPreKey(userId, signedPreKey);

    res.json({
      success: true,
      message: "Signed pre-key rotated successfully",
    });
  } catch (error) {
    console.error("Error rotating signed pre-key:", error);
    res.status(500).json({ error: "Failed to rotate signed pre-key" });
  }
};
