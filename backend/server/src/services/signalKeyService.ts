/**
 * Signal Protocol Key Management Service
 * Handles secure storage and retrieval of Signal Protocol keys
 */

import { Repository, DataSource } from "typeorm";
import { User, SignalKeyBundle } from "../models/User";
import { PreKey } from "../models/User";
import { In } from "typeorm";

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
    user.signed_prekey_updated_at = new Date();

    // Store one-time pre-keys in separate table with collision prevention
    await this.storeOneTimePreKeys(userId, keyBundle.oneTimePreKeys);

    await this.userRepo.save(user);
  }

  /**
   * Store one-time pre-keys with automatic keyId collision handling
   * overwrite keys only if marked as consumed. Client ensures key has been processed
   */
  private async storeOneTimePreKeys(
    userId: string,
    preKeys: Array<{ keyId: number; publicKey: string }>
  ): Promise<void> {
    const keyIds = preKeys.map(pk => pk.keyId);

    const existingKeys = await this.preKeyRepo.find({
      where: {
        userId,
        keyId: In(keyIds)
      }
    });

    const consumedConflicts = existingKeys.filter(key => key.consumed === true);
    const activeConflicts = existingKeys.filter(key => key.consumed === false);

    if (activeConflicts.length > 0) {
      const collidingIds = activeConflicts.map(k => k.keyId);
      throw new Error(
        `Active pre-key collision detected for userId=${userId}, keyIds=${collidingIds.join(', ')}. ` +
        `Client should have prevented this.`
      );
    }

    if (consumedConflicts.length > 0) {
      const consumedIds = consumedConflicts.map(k => k.keyId);
      await this.preKeyRepo.delete({
        userId,
        keyId: In(consumedIds)
      });

      console.log(`Replaced ${consumedConflicts.length} consumed pre-keys for user ${userId}`);
    }

    const newPreKeys = preKeys.map(preKey => this.preKeyRepo.create({
      userId,
      keyId: preKey.keyId,
      publicKey: preKey.publicKey,
      consumed: false,
    }));

    await this.preKeyRepo.save(newPreKeys);
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
    user.previous_signed_prekey_id = user.signal_key_bundle.signedPreKey.keyId;
    user.signal_key_bundle.signedPreKey = newSignedPreKey;
    user.signed_prekey_updated_at = new Date();

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
  /*
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
*/
  async getKeyStatistics(userId: string): Promise<{
    validPreKeyIds: number[];
    availablePreKeys: number;
    signedPreKey: {
      keyId: number;
      ageDays: number;
      needsRotation: boolean;
    };
    previousSignedPreKeyId: number | null;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.signal_key_bundle) {
      throw new Error('User or key bundle not found');
    }

    const preKeys = await this.preKeyRepo.find({
      where: { userId },
      select: ['keyId', 'consumed', 'consumedAt'],
    });

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Determine which key IDs are still valid:
    // - not consumed, OR
    // - consumed within the last 14 days (still within grace period)
    const validPreKeyIds: number[] = [];
    let availableCount = 0;

    for (const pk of preKeys) {
      if (!pk.consumed) {
        validPreKeyIds.push(pk.keyId);
        availableCount++;
      } else if (pk.consumedAt && pk.consumedAt >= fourteenDaysAgo) {
        validPreKeyIds.push(pk.keyId);
        // consumed keys are not counted as available
      }
    }

    // Signed pre‑key data
    const signedPreKey = user.signal_key_bundle.signedPreKey;

    const signedPreKeyAgeDays = Math.floor(
      (now.getTime() - user.signed_prekey_updated_at.getTime()) / (24 * 60 * 60 * 1000)
    );
    const needsRotation = signedPreKeyAgeDays >= 7; // adjust threshold as needed

    const previousSignedPreKeyId = user.previous_signed_prekey_id;

    return {
      validPreKeyIds,
      availablePreKeys: availableCount,
      signedPreKey: {
        keyId: signedPreKey.keyId,
        ageDays: signedPreKeyAgeDays,
        needsRotation,
      },
      previousSignedPreKeyId,
    };
  }
}

