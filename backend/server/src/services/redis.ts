import Redis from "ioredis";

const redis = new Redis();

// Add message to recipient's queue
export async function addMessage(recipientId: string, message: any) {
  await redis.lpush(`user:${recipientId}:messages`, JSON.stringify(message));
  await redis.expire(`user:${recipientId}:messages`, 86400); // Expire in 1 day
}

// Get all pending messages for a user
export async function getMessages(recipientId: string) {
  const messages = await redis.lrange(`user:${recipientId}:messages`, 0, -1);
  await redis.del(`user:${recipientId}:messages`); // Clear after retrieval
  return messages.map((msg) => JSON.parse(msg));
}

// Track online status
export async function setUserOnline(userId: string) {
  await redis.set(`user:${userId}:status`, "online", "EX", 30); // Expires in 30s
}