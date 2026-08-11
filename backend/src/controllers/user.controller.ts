import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { inMemoryStore } from '../config/inMemoryDb';

export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let users: any[] = [];

    try {
      users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'asc' }
      });
    } catch (dbError) {
      console.warn('Prisma DB error, using in-memory store for users:', dbError);
      users = inMemoryStore.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.createdAt
      }));
    }

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
