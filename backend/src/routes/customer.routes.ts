import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, addFollowUp } from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// Everyone can view customers
router.get('/', getCustomers);
router.get('/:id', getCustomerById);

// Only ADMIN and SALES can create/edit/follow-up customers
router.post('/', authorize(['ADMIN', 'SALES']), createCustomer);
router.put('/:id', authorize(['ADMIN', 'SALES']), updateCustomer);
router.post('/:id/follow-ups', authorize(['ADMIN', 'SALES']), addFollowUp);

export default router;
