import { PrismaClient, Role, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs'

import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/erp' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Database...')

  // 1. Create Users for each Role
  const passwordHash = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@erp.com',
      password: passwordHash,
      role: Role.ADMIN,
    },
  })

  const sales = await prisma.user.upsert({
    where: { email: 'sales@erp.com' },
    update: {},
    create: {
      name: 'Sales Rep',
      email: 'sales@erp.com',
      password: passwordHash,
      role: Role.SALES,
    },
  })

  const warehouse = await prisma.user.upsert({
    where: { email: 'warehouse@erp.com' },
    update: {},
    create: {
      name: 'Warehouse Manager',
      email: 'warehouse@erp.com',
      password: passwordHash,
      role: Role.WAREHOUSE,
    },
  })

  const accounts = await prisma.user.upsert({
    where: { email: 'accounts@erp.com' },
    update: {},
    create: {
      name: 'Accounts Dept',
      email: 'accounts@erp.com',
      password: passwordHash,
      role: Role.ACCOUNTS,
    },
  })

  console.log('Users created')

  // 2. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'John Doe',
      mobile: '9876543210',
      email: 'john@retail.com',
      businessName: 'Doe Retailers',
      type: CustomerType.RETAIL,
      status: CustomerStatus.ACTIVE,
      address: '123 Main St, City',
    }
  })

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Jane Smith',
      mobile: '9988776655',
      email: 'jane@wholesale.com',
      businessName: 'Smith Wholesale',
      gstNumber: '27AABCU9603R1ZJ',
      type: CustomerType.WHOLESALE,
      status: CustomerStatus.LEAD,
      address: '456 Market Road, City',
    }
  })

  console.log('Customers created')

  // 3. Create Products
  const product1 = await prisma.product.create({
    data: {
      name: 'Wireless Mouse',
      sku: 'WM-001',
      category: 'Electronics',
      unitPrice: 25.50,
      currentStock: 100,
      minStockAlert: 10,
      warehouseLocation: 'Aisle 1',
    }
  })

  const product2 = await prisma.product.create({
    data: {
      name: 'Mechanical Keyboard',
      sku: 'MK-002',
      category: 'Electronics',
      unitPrice: 85.00,
      currentStock: 50,
      minStockAlert: 5,
      warehouseLocation: 'Aisle 2',
    }
  })

  console.log('Products created')

  // 4. Create Initial Stock Logs
  await prisma.stockLog.create({
    data: {
      productId: product1.id,
      quantity: 100,
      type: MovementType.IN,
      reason: 'Initial Inventory Setup',
      userId: admin.id,
    }
  })

  await prisma.stockLog.create({
    data: {
      productId: product2.id,
      quantity: 50,
      type: MovementType.IN,
      reason: 'Initial Inventory Setup',
      userId: admin.id,
    }
  })

  console.log('Stock Logs created')

  console.log('Database Seeding Completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })
