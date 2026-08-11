import { Router } from 'express';
import { getChallans, getChallanById, createChallan, updateChallanStatus } from '../controllers/challan.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All challan routes require authentication
router.use(authenticate);

// Everyone can view challans
router.get('/', getChallans);
router.get('/:id', getChallanById);

// Admin, Sales, and Warehouse can create/modify challans
router.post('/', authorize(['ADMIN', 'SALES', 'WAREHOUSE']), createChallan);
router.patch('/:id/status', authorize(['ADMIN', 'SALES', 'WAREHOUSE']), updateChallanStatus);

export default router;
