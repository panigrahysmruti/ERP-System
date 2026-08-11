import { Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { MovementType } from '../generated/prisma/client';
import { inMemoryStore } from '../config/inMemoryDb';

export const getProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search, category, lowStockOnly } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let products: any[] = [];
    let total = 0;

    try {
      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { sku: { contains: search as string, mode: 'insensitive' } },
        ];
      }
      if (category) where.category = category as string;

      const [pList, pCount] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.product.count({ where })
      ]);
      products = pList;
      total = pCount;
    } catch (dbError) {
      console.warn('Prisma DB error, using in-memory store for products:', dbError);
      let filtered = [...inMemoryStore.products];
      if (search) {
        const s = (search as string).toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
      }
      if (category) filtered = filtered.filter(p => p.category === category);
      if (lowStockOnly === 'true') filtered = filtered.filter(p => p.currentStock <= p.minStockAlert);

      total = filtered.length;
      products = filtered.slice(skip, skip + limitNum);
    }

    res.status(200).json({
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getProductById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    let product: any = null;

    try {
      product = await prisma.product.findUnique({
        where: { id },
        include: {
          stockLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { user: { select: { name: true, email: true } } }
          }
        }
      });
    } catch (dbError) {
      product = inMemoryStore.products.find(p => p.id === id);
    }

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, sku, category, unitPrice, currentStock = 0, minStockAlert = 5, warehouseLocation } = req.body;

    if (!name || !sku || unitPrice === undefined) {
      res.status(400).json({ message: 'Name, SKU, and unitPrice are required' });
      return;
    }

    let product: any = null;
    try {
      product = await prisma.product.create({
        data: {
          name,
          sku,
          category,
          unitPrice: parseFloat(unitPrice),
          currentStock: parseInt(currentStock),
          minStockAlert: parseInt(minStockAlert),
          warehouseLocation
        }
      });
    } catch (dbError) {
      product = {
        id: `prod-${Date.now()}`,
        name,
        sku,
        category,
        unitPrice: parseFloat(unitPrice),
        currentStock: parseInt(currentStock),
        minStockAlert: parseInt(minStockAlert),
        warehouseLocation,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryStore.products.unshift(product);
    }

    res.status(201).json({ product, message: 'Product created successfully' });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, sku, category, unitPrice, minStockAlert, warehouseLocation } = req.body;

    let product: any = null;
    try {
      const data: any = {};
      if (name !== undefined) data.name = name;
      if (sku !== undefined) data.sku = sku;
      if (category !== undefined) data.category = category;
      if (unitPrice !== undefined) data.unitPrice = parseFloat(unitPrice);
      if (minStockAlert !== undefined) data.minStockAlert = parseInt(minStockAlert);
      if (warehouseLocation !== undefined) data.warehouseLocation = warehouseLocation;

      product = await prisma.product.update({
        where: { id },
        data
      });
    } catch (dbError) {
      const index = inMemoryStore.products.findIndex(p => p.id === id);
      if (index !== -1) {
        product = {
          ...inMemoryStore.products[index],
          ...(name && { name }),
          ...(sku && { sku }),
          ...(category && { category }),
          ...(unitPrice !== undefined && { unitPrice: parseFloat(unitPrice) }),
          ...(minStockAlert !== undefined && { minStockAlert: parseInt(minStockAlert) }),
          ...(warehouseLocation && { warehouseLocation }),
          updatedAt: new Date()
        };
        inMemoryStore.products[index] = product;
      }
    }

    res.status(200).json({ product, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const adjustStock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { quantity, type, reason } = req.body;

    if (!quantity || !type || !reason) {
      res.status(400).json({ message: 'Quantity, type, and reason are required' });
      return;
    }

    const qty = parseInt(quantity);
    const userId = req.user!.userId;

    let updatedProduct: any = null;
    try {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }

      if (type === 'OUT' && product.currentStock < qty) {
        res.status(400).json({ message: 'Cannot reduce stock below zero' });
        return;
      }

      updatedProduct = await prisma.$transaction(async (tx) => {
        const p = await tx.product.update({
          where: { id },
          data: {
            currentStock: type === 'IN' ? { increment: qty } : { decrement: qty }
          }
        });

        await tx.stockLog.create({
          data: {
            productId: id,
            quantity: qty,
            type: type as MovementType,
            reason,
            userId
          }
        });

        return p;
      });
    } catch (dbError) {
      const prod = inMemoryStore.products.find(p => p.id === id);
      if (prod) {
        if (type === 'IN') prod.currentStock += qty;
        else prod.currentStock = Math.max(0, prod.currentStock - qty);
        updatedProduct = prod;

        inMemoryStore.stockLogs.unshift({
          id: `log-${Date.now()}`,
          productId: id,
          quantity: qty,
          type,
          reason,
          userId,
          createdAt: new Date(),
          product: { name: prod.name, sku: prod.sku },
          user: { name: 'Operator', email: 'op@erp.com' }
        });
      }
    }

    res.status(200).json({ product: updatedProduct, message: 'Stock adjusted successfully' });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMovementLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let logs: any[] = [];
    let total = 0;

    try {
      const [lList, lCount] = await Promise.all([
        prisma.stockLog.findMany({
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
          include: {
            product: { select: { name: true, sku: true } },
            user: { select: { name: true, email: true } }
          }
        }),
        prisma.stockLog.count()
      ]);
      logs = lList;
      total = lCount;
    } catch (dbError) {
      console.warn('Prisma DB error, using in-memory store for stock logs:', dbError);
      total = inMemoryStore.stockLogs.length;
      logs = inMemoryStore.stockLogs.slice(skip, skip + limitNum);
    }

    res.status(200).json({
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching movement logs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
