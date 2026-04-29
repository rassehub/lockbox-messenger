import { CronJob } from 'cron';
import { DataSource } from 'typeorm';
import { PreKey } from './models/User';
import { User } from './models/User';
import logger from './utils/logger'; // your logger

export function StartCron(
    dataSource: DataSource,
    oldKeysTTL: number = 15,
    preKeysTTL: number = 45
): CronJob {
    return new CronJob(
        '0 2 * * *', // every day at 2 AM
        async () => {
            try {
                const now = new Date();

                // Cutoff for consumed pre-keys (e.g., 15 days ago)
                const consumedCutoff = new Date(now);
                consumedCutoff.setDate(consumedCutoff.getDate() - oldKeysTTL);

                // Cutoff for unconsumed pre-keys (e.g., 45 days ago)
                const unconsumedCutoff = new Date(now);
                unconsumedCutoff.setDate(unconsumedCutoff.getDate() - preKeysTTL);

                // Cutoff for signed pre-key metadata (same as consumedCutoff)
                const signedCutoff = consumedCutoff; // reuse

                // --- 1. Delete unconsumed pre-keys older than preKeysTTL ---
                // These keys were never used and are now considered stale.
                const unconsumedDeleteResult = await dataSource
                    .getRepository(PreKey)
                    .createQueryBuilder()
                    .delete()
                    .from(PreKey)
                    .where('consumed = :consumed', { consumed: false })
                    .andWhere('createdAt < :cutoff', { cutoff: unconsumedCutoff })
                    .execute();

                logger.info(`Deleted ${unconsumedDeleteResult.affected} stale unconsumed pre-keys`);

                // --- 2. Delete consumed pre-keys older than oldKeysTTL ---
                // These keys were given out but never used to form a session (or the session was never confirmed).
                const consumedDeleteResult = await dataSource
                    .getRepository(PreKey)
                    .createQueryBuilder()
                    .delete()
                    .from(PreKey)
                    .where('consumed = :consumed', { consumed: true })
                    .andWhere('consumedAt < :cutoff', { cutoff: consumedCutoff })
                    .execute();

                logger.info(`Deleted ${consumedDeleteResult.affected} consumed pre-keys`);

                // --- 3. Clean up signed pre-key metadata ---
                // Remove previous_signed_prekey_id and expired_signed_prekey_id
                // if their embedded createdAt timestamp is older than the cutoff.
                const updateResult = await dataSource
                    .getRepository(User)
                    .createQueryBuilder()
                    .update(User)
                    .set({
                        previous_signed_prekey_id: null,
                        expired_signed_prekey_id: null,
                    })
                    .where(
                        `(previous_signed_prekey_id->>'createdAt')::timestamp < :cutoff 
             OR (expired_signed_prekey_id->>'createdAt')::timestamp < :cutoff`,
                        { cutoff: signedCutoff }
                    )
                    .execute();

                logger.info(`Cleaned up signed pre-key metadata for ${updateResult.affected} users`);
            } catch (error) {
                logger.error('Cleanup job failed:', error);
            }
        },
        null, // onComplete
        true, // start immediately
        'UTC' // time zone
    );
}