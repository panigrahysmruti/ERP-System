import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { ChallanStatus, MovementType } from '../generated/prisma/client';

// Utility to generate unique sequential serial numbers: CHL-YYYYMMDD-0001
const generateChallanNumber = async (): Promise<string> => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `CHL-${dateStr}-`;
  
  const countToday = await prisma.challan.count({
    where: { challanNumber: { startsWith: prefix } }
  });
  
  const seqStr = String(countToday + 1).padStart(4, '0');
  return `${prefix}${seqStr}`;
};

export const getChallans = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search, status, customerId } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

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

    const [challans, total] = await Promise.all([
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

    const challan = await prisma.challan.findUnique({
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
    const { customerId, items, status = ChallanStatus.DRAFT } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Customer and at least one item are required' });
      return;
    }

    // Verify Customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    // Fetch and validate all requested products
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

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
      if (!qty || qty <= 0) {
        res.status(400).json({ message: `Invalid quantity for product ${product.name}` });
        return;
      }

      totalQuantity += qty;
      preparedItems.push({
        productId: product.id,
        quantity: qty,
        snapshotData: {
          name: product.name,
          sku: product.sku,
          unitPrice: product.unitPrice,
          category: product.category
        }
      });
    }

    const challanNumber = await generateChallanNumber();
    const userId = req.user!.userId;

    // Execute in transaction if confirming directly
    const result = await prisma.$transaction(async (tx) => {
      if (status === ChallanStatus.CONFIRMED) {
        // Validate stock sufficiency for all items
        for (const item of preparedItems) {
          const prod = productMap.get(item.productId)!;
          if (prod.currentStock < item.quantity) {
            throw new Error(`Insufficient stock for product "${prod.name}" (Requested: ${item.quantity}, Available: ${prod.currentStock})`);
          }
        }

        // Deduct stock and log stock movements
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

      // Create Challan & Items
      const createdChallan = await tx.challan.create({
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
        include: {
          customer: true,
          items: true
        }
      });

      return createdChallan;
    });

    res.status(201).json({ challan: result, message: 'Sales Challan created successfully' });
  } catch (error: any) {
    console.error('Error creating challan:', error);
    if (error.message?.includes('Insufficient stock')) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateChallanStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status || !Object.values(ChallanStatus).includes(status)) {
      res.status(400).json({ message: 'Valid status is required' });
      return;
    }

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { items: { include: { product: true } } }
    });

    if (!challan) {
      res.status(404).json({ message: 'Challan not found' });
      return;
    }

    if (challan.status === status) {
      res.status(400).json({ message: `Challan is already in status ${status}` });
      return;
    }

    if (challan.status === ChallanStatus.CANCELLED) {
      res.status(400).json({ message: 'Cannot modify a cancelled challan' });
      return;
    }

    const userId = req.user!.userId;

    const updatedChallan = await prisma.$transaction(async (tx) => {
      // DRAFT -> CONFIRMED
      if (challan.status === ChallanStatus.DRAFT && status === ChallanStatus.CONFIRMED) {
        // Validate stock sufficiency for all items
        for (const item of challan.items) {
          const freshProduct = await tx.product.findUnique({ where: { id: item.productId } });
          if (!freshProduct || freshProduct.currentStock < item.quantity) {
            throw new Error(`Insufficient stock for product "${item.product.name}" (Requested: ${item.quantity}, Available: ${freshProduct?.currentStock || 0})`);
          }
        }

        // Deduct stock and write stock log
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } }
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: MovementType.OUT,
              reason: `Sales Challan ${challan.challanNumber}`,
              userId
            }
          });
        }
      }

      // CONFIRMED -> CANCELLED
      if (challan.status === ChallanStatus.CONFIRMED && status === ChallanStatus.CANCELLED) {
        // Restore stock and write stock log
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } }
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantity: item.quantity,
              type: MovementType.IN,
              reason: `Challan ${challan.challanNumber} Cancelled`,
              userId
            }
          });
        }
      }

      // Update status
      return await tx.challan.update({
        where: { id },
        data: { status: status as ChallanStatus },
        include: {
          customer: true,
          items: true
        }
      });
    });

    res.status(200).json({ challan: updatedChallan, message: `Challan status updated to ${status}` });
  } catch (error: any) {
    console.error('Error updating challan status:', error);
    if (error.message?.includes('Insufficient stock')) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};
