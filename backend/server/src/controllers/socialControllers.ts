import { getRepository } from "../db";
import { Request, Response } from 'express';

import { User } from "../models/User";

export const searchUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username } = req.body;
        const repo = getRepository(User);
        const user = await repo.findOne({ where: { username } });


        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return 
        }

        res.status(200).json({
            success: true,
            userId: user.id
        });
    } catch (error) {
        console.error('Error searching for user:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching for user'
        });

    }
};