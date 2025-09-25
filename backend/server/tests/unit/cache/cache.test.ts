jest.mock('@/services/redis', () => ({
  addMessage: jest.fn(),
  getMessages: jest.fn(),
}));

import { addMessage, getMessages } from '@/services/redis';

describe("Cache Functions (Unit)", () => {
  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it("should add a message to the cache", async () => {
    (addMessage as jest.Mock).mockResolvedValue(undefined);
    await addMessage("user-id", { text: "hello" });
    expect(addMessage).toHaveBeenCalledWith("user-id", { text: "hello" });
  });

  it("should retrieve messages from the cache", async () => {
    (getMessages as jest.Mock).mockResolvedValue([{ text: "test" }]);
    const messages = await getMessages("user-id");
    expect(getMessages).toHaveBeenCalledWith("user-id");
    expect(messages).toContainEqual({ text: "test" });
  });

  it("should return empty array if no messages", async () => {
    (getMessages as jest.Mock).mockResolvedValue([]);
    const messages = await getMessages("unknown-user");
    expect(getMessages).toHaveBeenCalledWith("unknown-user");
    expect(messages).toEqual([]);
    });
});