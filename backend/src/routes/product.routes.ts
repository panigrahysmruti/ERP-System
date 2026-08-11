import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, adjustStock } from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All product routes require authentication
router.use(authenticate);

// Everyone can view products
router.get('/', getProducts);
router.get('/:id', getProductById);

// Only ADMIN and WAREHOUSE can create/edit products and adjust stock
router.post('/', authorize(['ADMIN', 'WAREHOUSE']), createProduct);
router.put('/:id', authorize(['ADMIN', 'WAREHOUSE']), updateProduct);
router.post('/:id/adjust-stock', authorize(['ADMIN', 'WAREHOUSE']), adjustStock);

export default router;
