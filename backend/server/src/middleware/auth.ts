import { Request, Response, NextFunction } from 'express';
import { getRepository } from "../db";
import { User } from "../models/User";


export async function isAuthenticated(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.session) {
    res.sendStatus(401);
    return;
  }
  
  try {
    if (!req.session.userId) {
      res.sendStatus(401);
      return;
    }
    
    const repo = getRepository(User);
    const user = await repo.findOne({ where: { id: req.session.userId } });

    if (!user) {
      res.sendStatus(403);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    // Fix: Use status().json() instead of sendStatus()
    res.status(500).json({
      success: false,
      message: 'Auth middleware error'
    });
  }
}