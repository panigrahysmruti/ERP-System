export type MovementType = 'IN' | 'OUT';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  warehouseLocation: string | null;
  createdAt: string;
  updatedAt: string;
  stockLogs?: StockLog[];
}

export interface StockLog {
  id: string;
  productId: string;
  quantity: number;
  type: MovementType;
  reason: string | null;
  userId: string;
  createdAt: string;
  product?: { name: string; sku: string };
  user?: { name: string; email: string };
}
