import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const [
      totalCustomers,
      activeCustomers,
      leadCustomers,
      totalProducts,
      products,
      recentCustomers
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.customer.count({ where: { status: 'LEAD' } }),
      prisma.product.count(),
      prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.customer.findMany({ take: 5, orderBy: { createdAt: 'desc' } })
    ]);

    // Calculate low stock products in JS
    const lowStockProducts = products.filter(p => p.currentStock <= p.minStockAlert);
    const lowStockCount = lowStockProducts.length;

    res.status(200).json({
      stats: {
        totalCustomers,
        activeCustomers,
        leadCustomers,
        totalProducts,
        lowStockCount,
      },
      lowStockProducts: lowStockProducts.slice(0, 5),
      recentCustomers
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
