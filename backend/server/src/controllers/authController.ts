import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getRepository } from "../db";
import { User } from "../models/User";


export const login = async (req: Request, res: Response) => {
    // Check if session already exists
    // Simulate a login process
    const { username, password } = req.body;
    const userRepo = getRepository(User);
    const user = await userRepo.findOne({ where: { username } });
    if (!user) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }
    if (user.password_hash !== password) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
    }
    // Create a new session
    req.session.userId = user.id;
    res.status(200).json({ message: 'Login successful'});
    return;
}

export const logout = async (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.status(200).json({ message: 'Logout successful' });
    }
    );
    return;
}