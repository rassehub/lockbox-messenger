/**
 * Example API endpoints for Signal Protocol key management
 * Add these to your routes/auth.ts or create a new routes/keys.ts
 */

import { Router } from "express";

import { uploadKeyBundle, getKeyBundle, getKeyStatistics, addPreKeys, rotateSignedPreKey } from "../controllers/keyControllers";
const router = Router();

import { isAuthenticated } from "@/middleware/auth";

router.use(isAuthenticated);
/**
 * POST /api/keys/upload
 * Upload user's key bundle (called after registration or key rotation)
 */
router.post("/upload", uploadKeyBundle);

/**
 * GET /api/keys/:userId
 * Get a user's key bundle to establish session
 * Atomically consumes one pre-key
 */
router.get("/:userId", getKeyBundle);

router.post("/get-recipient-keybundle", getKeyBundle);

router.get("/stats/me", getKeyStatistics);


/**
 * POST /api/keys/add-prekeys
 * Add more one-time pre-keys when running low
 */
router.post("/add-prekeys", addPreKeys);

/**
 * POST /api/keys/rotate-signed-prekey
 * Rotate the signed pre-key (should be done periodically)
 */
router.post("/rotate-signed-prekey", rotateSignedPreKey);

export default router;
