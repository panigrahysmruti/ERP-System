import bcrypt from 'bcryptjs';

const passwordHash = bcrypt.hashSync('password123', 10);

export const inMemoryStore = {
  users: [
    { id: 'usr-admin', name: 'System Admin', email: 'admin@erp.com', password: passwordHash, role: 'ADMIN', createdAt: new Date() },
    { id: 'usr-sales', name: 'Sales Rep', email: 'sales@erp.com', password: passwordHash, role: 'SALES', createdAt: new Date() },
    { id: 'usr-warehouse', name: 'Warehouse Manager', email: 'warehouse@erp.com', password: passwordHash, role: 'WAREHOUSE', createdAt: new Date() },
    { id: 'usr-accounts', name: 'Accounts Dept', email: 'accounts@erp.com', password: passwordHash, role: 'ACCOUNTS', createdAt: new Date() },
  ],
  customers: [
    {
      id: 'cust-1',
      name: 'John Doe',
      mobile: '9876543210',
      email: 'john@retail.com',
      businessName: 'Doe Retailers',
      gstNumber: '27AABCU9603R1ZJ',
      type: 'RETAIL',
      status: 'ACTIVE',
      address: '123 Main St, Mumbai',
      notes: 'Key retail buyer',
      followUpDate: null as Date | null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'cust-2',
      name: 'Jane Smith',
      mobile: '9988776655',
      email: 'jane@wholesale.com',
      businessName: 'Smith Wholesale Ltd',
      gstNumber: '27XYZU9603R1Z9',
      type: 'WHOLESALE',
      status: 'LEAD',
      address: '456 Market Road, Delhi',
      notes: 'High volume lead',
      followUpDate: null as Date | null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  products: [
    {
      id: 'prod-1',
      name: 'Wireless Ergonomic Mouse',
      sku: 'WM-001',
      category: 'Electronics',
      unitPrice: 1250.00,
      currentStock: 85,
      minStockAlert: 10,
      warehouseLocation: 'Shelf A-12',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'prod-2',
      name: 'Mechanical Gaming Keyboard',
      sku: 'MK-002',
      category: 'Electronics',
      unitPrice: 4500.00,
      currentStock: 4,
      minStockAlert: 10,
      warehouseLocation: 'Shelf B-04',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  stockLogs: [
    {
      id: 'log-1',
      productId: 'prod-1',
      quantity: 100,
      type: 'IN',
      reason: 'Initial Inventory Stocking',
      userId: 'usr-admin',
      createdAt: new Date(),
      product: { name: 'Wireless Ergonomic Mouse', sku: 'WM-001' },
      user: { name: 'System Admin', email: 'admin@erp.com' }
    }
  ],
  challans: [
    {
      id: 'chl-1',
      challanNumber: 'CHL-20260811-0001',
      customerId: 'cust-1',
      totalQuantity: 15,
      status: 'CONFIRMED',
      userId: 'usr-admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: 'cust-1', name: 'John Doe', businessName: 'Doe Retailers', mobile: '9876543210', email: 'john@retail.com', address: '123 Main St, Mumbai' },
      user: { id: 'usr-admin', name: 'System Admin', email: 'admin@erp.com' },
      items: [
        {
          id: 'item-1',
          challanId: 'chl-1',
          productId: 'prod-1',
          quantity: 15,
          snapshotData: { name: 'Wireless Ergonomic Mouse', sku: 'WM-001', unitPrice: 1250.00 },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    }
  ]
};
