require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const clientRoutes = require('./routes/client.routes');
const quoteRoutes = require('./routes/quote.routes');
const productRoutes = require('./routes/product.routes');
const companyRoutes = require('./routes/company.routes');
const categoryRoutes = require('./routes/category.routes');
const catalogRoutes = require('./routes/catalog.routes');
const stockRoutes = require('./routes/stock.routes');
const saleRoutes = require('./routes/sale.routes');
const reportRoutes = require('./routes/report.routes');
const expenseRoutes = require('./routes/expense.routes');
const teamRoutes = require('./routes/team.routes');
const storefrontRoutes = require('./routes/storefront.routes');
const shipmentRoutes = require('./routes/shipment.routes');
const planRoutes = require('./routes/plan.routes');
const cashRoutes = require('./routes/cash.routes');

const app = express();

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

if (process.env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Muitas requisições deste IP, por favor tente novamente mais tarde.'
  });
  app.use('/api/', limiter);
}

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/products', productRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/storefront', storefrontRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/cash', cashRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Aligned API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

module.exports = app;
