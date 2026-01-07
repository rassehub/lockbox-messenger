import { addMessage, getMessages } from '@/services/redis';


describe ("Cache Connection", () => {
  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

    // Add message to cache and verify it's stored
    it("should add a message to the cache", async () => {
      await addMessage("user-id", { text: "hello" });
      const messages = await getMessages("user-id");
      expect(messages).toContainEqual({ text: "hello" });
    });
    
    // Retrieve messages for a user
    it("should retrieve messages from the cache", async () => {
      await addMessage("user-id", { text: "test" });
      const messages = await getMessages("user-id");
      expect(messages.length).toBeGreaterThan(0);
    });
    
    // Handle cache miss
    it("should return empty array if no messages", async () => {
      const messages = await getMessages("unknown-user");
      expect(messages).toEqual([]);
    });
});
