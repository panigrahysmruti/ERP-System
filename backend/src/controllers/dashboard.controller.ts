import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { inMemoryStore } from '../config/inMemoryDb';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let totalCustomers = 0;
    let activeCustomers = 0;
    let leadCustomers = 0;
    let totalProducts = 0;
    let lowStockProducts: any[] = [];
    let recentCustomers: any[] = [];

    try {
      const [
        tc,
        ac,
        lc,
        tp,
        prods,
        rcs
      ] = await Promise.all([
        prisma.customer.count(),
        prisma.customer.count({ where: { status: 'ACTIVE' } }),
        prisma.customer.count({ where: { status: 'LEAD' } }),
        prisma.product.count(),
        prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.customer.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
      ]);

      totalCustomers = tc;
      activeCustomers = ac;
      leadCustomers = lc;
      totalProducts = tp;
      lowStockProducts = prods.filter(p => p.currentStock <= p.minStockAlert);
      recentCustomers = rcs;
    } catch (dbErr) {
      console.warn('Prisma DB error, using in-memory store for dashboard stats');
      totalCustomers = inMemoryStore.customers.length;
      activeCustomers = inMemoryStore.customers.filter(c => c.status === 'ACTIVE').length;
      leadCustomers = inMemoryStore.customers.filter(c => c.status === 'LEAD').length;
      totalProducts = inMemoryStore.products.length;
      lowStockProducts = inMemoryStore.products.filter(p => p.currentStock <= p.minStockAlert);
      recentCustomers = inMemoryStore.customers.slice(0, 5);
    }

    res.status(200).json({
      stats: {
        totalCustomers,
        activeCustomers,
        leadCustomers,
        totalProducts,
        lowStockCount: lowStockProducts.length,
      },
      lowStockProducts: lowStockProducts.slice(0, 5),
      recentCustomers
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
