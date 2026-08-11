import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import inventoryRoutes from './routes/inventory.routes';
import dashboardRoutes from './routes/dashboard.routes';
import challanRoutes from './routes/challan.routes';
import userRoutes from './routes/user.routes';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('ERP Backend is running!');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
