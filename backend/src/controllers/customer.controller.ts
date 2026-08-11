import { Request, Response } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { CustomerType, CustomerStatus } from '../generated/prisma/client';

export const getCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search, status, type } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { businessName: { contains: search as string, mode: 'insensitive' } },
        { mobile: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (status) where.status = status as CustomerStatus;
    if (type) where.type = type as CustomerType;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where })
    ]);

    res.status(200).json({
      customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCustomerById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        challans: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    res.status(200).json({ customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;
    
    if (!name || !mobile) {
      res.status(400).json({ message: 'Name and mobile are required' });
      return;
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email,
        businessName,
        gstNumber,
        type: customerType || CustomerType.RETAIL,
        address,
        status: status || CustomerStatus.LEAD,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes
      }
    });

    res.status(201).json({ customer, message: 'Customer created successfully' });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, mobile, email, businessName, gstNumber, customerType, address, status, followUpDate, notes } = req.body;
    
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (mobile !== undefined) data.mobile = mobile;
    if (email !== undefined) data.email = email;
    if (businessName !== undefined) data.businessName = businessName;
    if (gstNumber !== undefined) data.gstNumber = gstNumber;
    if (customerType !== undefined) data.type = customerType;
    if (address !== undefined) data.address = address;
    if (status !== undefined) data.status = status;
    if (followUpDate !== undefined) data.followUpDate = followUpDate ? new Date(followUpDate) : null;
    if (notes !== undefined) data.notes = notes;

    const customer = await prisma.customer.update({
      where: { id },
      data
    });

    res.status(200).json({ customer, message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const addFollowUp = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { note, followUpDate } = req.body;
    
    if (!note) {
      res.status(400).json({ message: 'Note is required' });
      return;
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const data: any = {};
    data.notes = customer.notes ? `${customer.notes}\n${note}` : note;
    if (followUpDate) {
      data.followUpDate = new Date(followUpDate);
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data
    });

    res.status(201).json({ followUp: { note, followUpDate }, message: 'Follow-up note added successfully' });
  } catch (error) {
    console.error('Error adding follow-up:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
