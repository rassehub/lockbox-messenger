import { Request, Response } from "express";
import { addMessage, getMessages } from "@/services/redis";
import { getRepository} from "@/db";
import { User } from "@/models/User";

export async function sendMessage(req: Request, res: Response) {
  const { recipientUsername, ciphertext } = req.body;

  // 1. Fetch recipient's ID from PostgreSQL
  const userRepo = getRepository(User);
  const recipient = await userRepo.findOne({ where: { username: recipientUsername } });
  if (!recipient) return res.status(404).send("User not found");

  // 2. Store encrypted message in Redis
  if (!req.user || !req.user.id) {
    return res.status(401).send("Unauthorized: user not found in request");
  }
  await addMessage(recipient.id, {
    sender: req.user.id, // From auth middleware
    ciphertext,
    timestamp: new Date(),
  });

  res.status(200).send("Message queued");
}

export async function fetchMessages(req: Request, res: Response) {
  if (!req.user || !req.user.id) {
    return res.status(401).send("Unauthorized: user not found in request");
  }
  const messages = await getMessages(req.user.id); // From Redis
  res.json(messages);
}