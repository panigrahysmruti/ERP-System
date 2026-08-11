import { Router } from 'express';
import { getMovementLogs } from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

// Only ADMIN, WAREHOUSE, and ACCOUNTS can view the stock ledger
router.get('/movement-logs', authorize(['ADMIN', 'WAREHOUSE', 'ACCOUNTS']), getMovementLogs);

export default router;
