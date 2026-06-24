require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const invoiceRoutes = require('./routes/invoices');
const oosRoutes = require('./routes/oos');
const expiryRoutes = require('./routes/expiry');
const vendorRoutes = require('./routes/vendors');
const reportRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const barcodeRoutes = require('./routes/barcode');
const errorHandler = require('./middleware/errorHandler');
const { startOosJob } = require('./jobs/oosJob');

const prisma = new PrismaClient();
const app = express();

const PORT = parseInt(process.env.PORT) || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/oos', oosRoutes);
app.use('/api/expiry', expiryRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/barcode', barcodeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

startOosJob();

app.listen(PORT, () => {
  console.log(`MedStore API server running on port ${PORT}`);
  console.log(`Frontend origin: ${FRONTEND_URL}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
