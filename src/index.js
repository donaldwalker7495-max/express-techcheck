import express from 'express';
import productRoutes from './routes/products.js';
import authRoutes from './routes/auth.js';
const app = express();
app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  g(`Server running on port ${PORT}`);
});