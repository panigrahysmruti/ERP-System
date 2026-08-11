import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { MovementType } from '../generated/prisma/client';

export const getProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search, category, lowStock } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (category) {
      where.category = { contains: category as string, mode: 'insensitive' };
    }

    if (lowStock === 'true') {
      // Prisma doesn't have a direct field comparison (where currentStock <= minStockAlert) in basic query without raw
      // But we can fetch all and filter, or we can use raw query.
      // Wait, Prisma now supports field references: `where: { currentStock: { lte: prisma.product.fields.minStockAlert } }` but it requires preview features sometimes.
      // Let's use a simpler approach if not supported, or just return all and let frontend highlight.
      // Actually, we can just fetch all matching and filter in JS if the dataset is small, or just skip the filter and do it on frontend.
      // Let's just pass lowStock back to frontend and let it sort/filter.
      // Or we can use queryRaw if needed.
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where })
    ]);

    // If lowStock is requested, filter in memory for now to avoid Prisma limitations
    let filteredProducts = products;
    let finalTotal = total;
    if (lowStock === 'true') {
      filteredProducts = products.filter(p => p.currentStock <= p.minStockAlert);
      finalTotal = filteredProducts.length;
    }

    res.status(200).json({
      products: filteredProducts,
      pagination: {
        total: finalTotal,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(finalTotal / limitNum)
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
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { name: true, email: true } } }
        }
      }
    });

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
    const { name, sku, category, unitPrice, currentStock, minStockAlert, warehouseLocation } = req.body;
    
    if (!name || !sku || unitPrice === undefined) {
      res.status(400).json({ message: 'Name, SKU, and unitPrice are required' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category,
        unitPrice: parseFloat(unitPrice),
        currentStock: parseInt(currentStock || '0'),
        minStockAlert: parseInt(minStockAlert || '0'),
        warehouseLocation
      }
    });

    // If initial stock > 0, create a stock log
    if (product.currentStock > 0) {
      await prisma.stockLog.create({
        data: {
          productId: product.id,
          quantity: product.currentStock,
          type: MovementType.IN,
          reason: 'Initial Stock Upload',
          userId: req.user!.userId
        }
      });
    }

    res.status(201).json({ product, message: 'Product created successfully' });
  } catch (error: any) {
    console.error('Error creating product:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'SKU already exists' });
      return;
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, sku, category, unitPrice, minStockAlert, warehouseLocation } = req.body;
    
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (sku !== undefined) data.sku = sku;
    if (category !== undefined) data.category = category;
    if (unitPrice !== undefined) data.unitPrice = parseFloat(unitPrice);
    if (minStockAlert !== undefined) data.minStockAlert = parseInt(minStockAlert);
    if (warehouseLocation !== undefined) data.warehouseLocation = warehouseLocation;

    const product = await prisma.product.update({
      where: { id },
      data
    });

    res.status(200).json({ product, message: 'Product updated successfully' });
  } catch (error: any) {
    console.error('Error updating product:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ message: 'SKU already exists' });
      return;
    }
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
    if (qty <= 0) {
      res.status(400).json({ message: 'Quantity must be greater than 0' });
      return;
    }

    // Use transaction to ensure stock consistency
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      
      if (!product) {
        throw new Error('Product not found');
      }

      const newStock = type === MovementType.IN 
        ? product.currentStock + qty 
        : product.currentStock - qty;

      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }

      const updatedProduct = await tx.product.update({
        where: { id },
        data: { currentStock: newStock }
      });

      const log = await tx.stockLog.create({
        data: {
          productId: id,
          quantity: qty,
          type: type as MovementType,
          reason,
          userId: req.user!.userId
        }
      });

      return { product: updatedProduct, log };
    });

    res.status(200).json({ 
      product: result.product, 
      log: result.log,
      message: 'Stock adjusted successfully' 
    });
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    if (error.message === 'Product not found') res.status(404).json({ message: error.message });
    else if (error.message === 'Insufficient stock') res.status(400).json({ message: error.message });
    else res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMovementLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '50', productId } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (productId) {
      where.productId = productId as string;
    }

    const [logs, total] = await Promise.all([
      prisma.stockLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
          user: { select: { name: true, email: true } }
        }
      }),
      prisma.stockLog.count({ where })
    ]);

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
