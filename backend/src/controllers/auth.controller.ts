import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/db';
import { generateToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { inMemoryStore } from '../config/inMemoryDb';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { email }
      });
    } catch (dbError) {
      console.warn('Prisma DB error, using in-memory store:', dbError);
      user = inMemoryStore.users.find(u => u.email === email);
    }

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = generateToken(user.id, user.role);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      });
    } catch (dbError) {
      user = inMemoryStore.users.find(u => u.id === req.user?.userId);
    }

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
