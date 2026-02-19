/**
 * Signal Protocol Key Management Service
 * Handles secure storage and retrieval of Signal Protocol keys
 */

import { Repository, DataSource } from "typeorm";
import { User, SignalKeyBundle } from "../models/User";
import { PreKey } from "../models/User";

export class SignalKeyService {
  private userRepo: Repository<User>;
  private preKeyRepo: Repository<PreKey>;

  constructor(dataSource: DataSource) {
    this.userRepo = dataSource.getRepository(User);
    this.preKeyRepo = dataSource.getRepository(PreKey);
  }

  /**
   * Upload a user's key bundle (on registration or key rotation)
   */
  async uploadKeyBundle(
    userId: string,
    keyBundle: SignalKeyBundle
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    // Store registration ID, identity key, and signed pre-key in User table
    user.signal_key_bundle = {
      registrationId: keyBundle.registrationId,
      identityPubKey: keyBundle.identityPubKey,
      signedPreKey: keyBundle.signedPreKey,
    };
    user.keys_updated_at = new Date();

    // Store one-time pre-keys in separate table with collision prevention
    await this.storeOneTimePreKeys(userId, keyBundle.oneTimePreKeys);

    await this.userRepo.save(user);
  }

  /**
   * Store one-time pre-keys with automatic keyId collision handling
   */
  private async storeOneTimePreKeys(
    userId: string,
    preKeys: Array<{ keyId: number; publicKey: string }>
  ): Promise<void> {
    for (const preKey of preKeys) {
      try {
        // Try to insert the pre-key
        const newPreKey = this.preKeyRepo.create({
          userId,
          keyId: preKey.keyId,
          publicKey: preKey.publicKey,
          consumed: false,
        });

        await this.preKeyRepo.save(newPreKey);
      } catch (error: any) {
        // Check if it's a unique constraint violation
        if (error.code === "23505") {
          // PostgreSQL unique violation
          console.warn(
            `PreKey collision detected for userId=${userId}, keyId=${preKey.keyId}. Generating new ID...`
          );

          // Generate a new keyId that's guaranteed to be unique for this user
          const newKeyId = await this.generateUniqueKeyId(userId);

          const newPreKey = this.preKeyRepo.create({
            userId,
            keyId: newKeyId,
            publicKey: preKey.publicKey,
            consumed: false,
          });

          await this.preKeyRepo.save(newPreKey);
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Generate a unique keyId for a specific user
   */
  private async generateUniqueKeyId(userId: string): Promise<number> {
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      // Generate random 24-bit number (0 to 16,777,215)
      const keyId = Math.floor(Math.random() * 16777215);

      // Check if this keyId exists for this user
      const exists = await this.preKeyRepo.findOne({
        where: { userId, keyId },
      });

      if (!exists) {
        return keyId;
      }

      attempts++;
    }

    throw new Error("Failed to generate unique keyId after 100 attempts");
  }

  /**
   * Get a user's key bundle for session establishment
   * Atomically consumes one pre-key to prevent reuse
   */
  async getKeyBundle(userId: string): Promise<SignalKeyBundle> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.signal_key_bundle) {
      throw new Error("User or key bundle not found");
    }

    // Get one unconsumed pre-key atomically
    const preKey = await this.consumeOneTimePreKey(userId);

    if (!preKey) {
      throw new Error(
        "No available pre-keys. User needs to upload more pre-keys."
      );
    }

    return {
      registrationId: user.signal_key_bundle.registrationId,
      identityPubKey: user.signal_key_bundle.identityPubKey,
      signedPreKey: user.signal_key_bundle.signedPreKey,
      oneTimePreKeys: [
        {
          keyId: preKey.keyId,
          publicKey: preKey.publicKey,
        },
      ],
    };
  }

  /**
   * Atomically consume a one-time pre-key
   * Uses database transaction to prevent race conditions
   */
  private async consumeOneTimePreKey(
    userId: string
  ): Promise<PreKey | null> {
    return await this.preKeyRepo.manager.transaction(async (manager) => {
      // Lock the row for update to prevent race conditions
      const preKey = await manager
        .getRepository(PreKey)
        .createQueryBuilder("prekey")
        .where("prekey.userId = :userId", { userId })
        .andWhere("prekey.consumed = :consumed", { consumed: false })
        .orderBy("prekey.createdAt", "ASC") // Use oldest first
        .setLock("pessimistic_write") // Lock the row
        .getOne();

      if (!preKey) {
        return null;
      }

      // Mark as consumed
      preKey.consumed = true;
      preKey.consumedAt = new Date();
      await manager.save(preKey);

      return preKey;
    });
  }

  /**
   * Get the count of available (unconsumed) pre-keys for a user
   */
  async getAvailablePreKeyCount(userId: string): Promise<number> {
    return await this.preKeyRepo.count({
      where: {
        userId,
        consumed: false,
      },
    });
  }

  /**
   * Check if user needs to upload more pre-keys
   * Returns true if they have fewer than the threshold
   */
  async needsMorePreKeys(
    userId: string,
    threshold: number = 10
  ): Promise<boolean> {
    const count = await this.getAvailablePreKeyCount(userId);
    return count < threshold;
  }

  /**
   * Delete old consumed pre-keys (cleanup operation)
   */
  async cleanupOldPreKeys(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.preKeyRepo
      .createQueryBuilder()
      .delete()
      .where("consumed = :consumed", { consumed: true })
      .andWhere("consumedAt < :cutoffDate", { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  /**
   * Rotate signed pre-key (should be done periodically)
   */
  async rotateSignedPreKey(
    userId: string,
    newSignedPreKey: {
      keyId: number;
      publicKey: string;
      signature: string;
    }
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.signal_key_bundle) {
      throw new Error("User or key bundle not found");
    }

    user.signal_key_bundle.signedPreKey = newSignedPreKey;
    user.keys_updated_at = new Date();

    await this.userRepo.save(user);
  }

  /**
   * Add more one-time pre-keys when running low
   */
  async addOneTimePreKeys(
    userId: string,
    preKeys: Array<{ keyId: number; publicKey: string }>
  ): Promise<void> {
    await this.storeOneTimePreKeys(userId, preKeys);
  }

  /**
   * Get statistics about a user's keys
   */
  async getKeyStats(userId: string): Promise<{
    totalPreKeys: number;
    availablePreKeys: number;
    consumedPreKeys: number;
    lastUpdated: Date;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.signal_key_bundle) {
      throw new Error("User or key bundle not found");
    }
    const total = await this.preKeyRepo.count({ where: { userId } });
    const available = await this.preKeyRepo.count({
      where: { userId, consumed: false },
    });
    const consumed = await this.preKeyRepo.count({
      where: { userId, consumed: true },
    });

    return {
      totalPreKeys: total,
      availablePreKeys: available,
      consumedPreKeys: consumed,
      lastUpdated: user.keys_updated_at,
    };
  }
}
