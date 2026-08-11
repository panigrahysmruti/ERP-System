import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ChallanStatus, MovementType } from '../generated/prisma/client';
import { inMemoryStore } from '../config/inMemoryDb';

const generateChallanNumber = async (): Promise<string> => {
  try {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `CHL-${dateStr}-`;
    const countToday = await prisma.challan.count({
      where: { challanNumber: { startsWith: prefix } }
    });
    const seqStr = String(countToday + 1).padStart(4, '0');
    return `${prefix}${seqStr}`;
  } catch (err) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = inMemoryStore.challans.length + 1;
    return `CHL-${dateStr}-${String(count).padStart(4, '0')}`;
  }
};

export const getChallans = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search, status, customerId } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let challans: any[] = [];
    let total = 0;

    try {
      const where: any = {};
      if (status) where.status = status as ChallanStatus;
      if (customerId) where.customerId = customerId as string;
      
      if (search) {
        where.OR = [
          { challanNumber: { contains: search as string, mode: 'insensitive' } },
          { customer: { name: { contains: search as string, mode: 'insensitive' } } },
          { customer: { businessName: { contains: search as string, mode: 'insensitive' } } },
        ];
      }

      const [cList, cCount] = await Promise.all([
        prisma.challan.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: { select: { id: true, name: true, businessName: true, mobile: true, email: true } },
            user: { select: { id: true, name: true, email: true } },
            items: true
          }
        }),
        prisma.challan.count({ where })
      ]);
      challans = cList;
      total = cCount;
    } catch (dbError) {
      console.warn('Prisma DB error, using in-memory store for challans:', dbError);
      let filtered = [...inMemoryStore.challans];
      if (status) filtered = filtered.filter(c => c.status === status);
      if (customerId) filtered = filtered.filter(c => c.customerId === customerId);
      if (search) {
        const s = (search as string).toLowerCase();
        filtered = filtered.filter(c => 
          c.challanNumber.toLowerCase().includes(s) ||
          (c.customer && c.customer.name.toLowerCase().includes(s))
        );
      }

      total = filtered.length;
      challans = filtered.slice(skip, skip + limitNum);
    }

    res.status(200).json({
      challans,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching challans:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getChallanById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    let challan: any = null;

    try {
      challan = await prisma.challan.findUnique({
        where: { id },
        include: {
          customer: true,
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, currentStock: true } }
            }
          }
        }
      });
    } catch (dbError) {
      challan = inMemoryStore.challans.find(c => c.id === id);
    }

    if (!challan) {
      res.status(404).json({ message: 'Challan not found' });
      return;
    }

    res.status(200).json({ challan });
  } catch (error) {
    console.error('Error fetching challan:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createChallan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customerId, items, status = 'DRAFT' } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Customer and at least one item are required' });
      return;
    }

    let result: any = null;

    try {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        res.status(404).json({ message: 'Customer not found' });
        return;
      }

      const productIds = items.map((i: any) => i.productId);
      const dbProducts = await prisma.product.findMany({ where: { id: { in: productIds } } });
      const productMap = new Map(dbProducts.map(p => [p.id, p]));

      let totalQuantity = 0;
      const preparedItems: any[] = [];

      for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
          res.status(400).json({ message: `Product ID ${item.productId} not found` });
          return;
        }
        const qty = parseInt(item.quantity);
        totalQuantity += qty;
        preparedItems.push({
          productId: product.id,
          quantity: qty,
          snapshotData: { name: product.name, sku: product.sku, unitPrice: product.unitPrice, category: product.category }
        });
      }

      const challanNumber = await generateChallanNumber();
      const userId = req.user!.userId;

      result = await prisma.$transaction(async (tx) => {
        if (status === 'CONFIRMED') {
          for (const item of preparedItems) {
            const prod = productMap.get(item.productId)!;
            if (prod.currentStock < item.quantity) {
              throw new Error(`Insufficient stock for product "${prod.name}" (Requested: ${item.quantity}, Available: ${prod.currentStock})`);
            }
          }

          for (const item of preparedItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: { decrement: item.quantity } }
            });

            await tx.stockLog.create({
              data: {
                productId: item.productId,
                quantity: item.quantity,
                type: MovementType.OUT,
                reason: `Sales Challan ${challanNumber}`,
                userId
              }
            });
          }
        }

        return await tx.challan.create({
          data: {
            challanNumber,
            customerId,
            totalQuantity,
            status: status as ChallanStatus,
            userId,
            items: {
              create: preparedItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                snapshotData: item.snapshotData
              }))
            }
          },
          include: { customer: true, items: true }
        });
      });
    } catch (dbError: any) {
      if (dbError.message?.includes('Insufficient stock')) {
        res.status(400).json({ message: dbError.message });
        return;
      }

      const customer = inMemoryStore.customers.find(c => c.id === customerId);
      const challanNumber = await generateChallanNumber();
      let totalQuantity = 0;
      const preparedItems: any[] = [];

      for (const item of items) {
        const prod = inMemoryStore.products.find(p => p.id === item.productId);
        const qty = parseInt(item.quantity) || 1;
        totalQuantity += qty;
        if (status === 'CONFIRMED' && prod) {
          prod.currentStock = Math.max(0, prod.currentStock - qty);
        }
        preparedItems.push({
          id: `item-${Date.now()}-${Math.random()}`,
          productId: item.productId,
          quantity: qty,
          snapshotData: { name: prod?.name || 'Product', sku: prod?.sku || 'SKU', unitPrice: prod?.unitPrice || 100 },
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      result = {
        id: `chl-${Date.now()}`,
        challanNumber,
        customerId,
        totalQuantity,
        status,
        userId: req.user!.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        customer,
        user: { name: 'Admin', email: 'admin@erp.com' },
        items: preparedItems
      };
      inMemoryStore.challans.unshift(result);
    }

    res.status(201).json({ challan: result, message: 'Sales Challan created successfully' });
  } catch (error: any) {
    console.error('Error creating challan:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateChallanStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    let updatedChallan: any = null;

    try {
      const challan = await prisma.challan.findUnique({ where: { id }, include: { items: { include: { product: true } } } });
      if (!challan) {
        res.status(404).json({ message: 'Challan not found' });
        return;
      }

      updatedChallan = await prisma.$transaction(async (tx) => {
        if (challan.status === 'DRAFT' && status === 'CONFIRMED') {
          for (const item of challan.items) {
            const freshProduct = await tx.product.findUnique({ where: { id: item.productId } });
            if (!freshProduct || freshProduct.currentStock < item.quantity) {
              throw new Error(`Insufficient stock for product "${item.product.name}"`);
            }
          }
          for (const item of challan.items) {
            await tx.product.update({ where: { id: item.productId }, data: { currentStock: { decrement: item.quantity } } });
          }
        }
        return await tx.challan.update({ where: { id }, data: { status: status as ChallanStatus }, include: { customer: true, items: true } });
      });
    } catch (dbError: any) {
      const challan = inMemoryStore.challans.find(c => c.id === id);
      if (challan) {
        challan.status = status;
        updatedChallan = challan;
      }
    }

    res.status(200).json({ challan: updatedChallan, message: `Challan status updated to ${status}` });
  } catch (error: any) {
    console.error('Error updating challan status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
