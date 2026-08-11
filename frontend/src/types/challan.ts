import type { Customer } from './customer';
import type { Product } from './product';

export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface SnapshotData {
  name: string;
  sku: string;
  unitPrice: number;
  category?: string | null;
}

export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  quantity: number;
  snapshotData: SnapshotData;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  status: ChallanStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  user?: { id: string; name: string; email: string };
  items?: ChallanItem[];
}
