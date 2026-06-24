const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const prisma = new PrismaClient();

async function getCurrent(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      include: { vendor: true },
      orderBy: { currentStock: 'asc' },
    });
    const result = products.filter(p => p.currentStock <= p.reorderLevel);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const from = req.query.from;
    const to = req.query.to;
    const where = {};
    if (from || to) {
      where.flaggedAt = {};
      if (from) where.flaggedAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.flaggedAt.lte = end;
      }
    }
    const logs = await prisma.oOSLog.findMany({
      where,
      include: { product: { include: { vendor: true } } },
      orderBy: { flaggedAt: 'desc' },
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

async function resolve(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const log = await prisma.oOSLog.findUnique({ where: { id } });
    if (!log) {
      return res.status(404).json({ error: 'OOS log not found' });
    }
    const updated = await prisma.oOSLog.update({
      where: { id },
      data: { resolved: true, resolvedAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function exportExcel(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: {
        currentStock: { lte: prisma.product.fields.reorderLevel ? undefined : 0 },
      },
      include: { vendor: true },
      orderBy: { currentStock: 'asc' },
    });
    const lowStock = products.filter(p => p.currentStock <= p.reorderLevel);

    const lastPurchasePrices = {};
    for (const p of lowStock) {
      const lastLog = await prisma.stockLog.findFirst({
        where: { productId: p.id, type: 'PURCHASE' },
        orderBy: { createdAt: 'desc' },
      });
      lastPurchasePrices[p.id] = lastLog ? p.purchasePrice : p.purchasePrice;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Low Stock Report');

    sheet.columns = [
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Manufacturer', key: 'manufacturer', width: 20 },
      { header: 'Vendor', key: 'vendor', width: 25 },
      { header: 'Current Stock', key: 'currentStock', width: 15 },
      { header: 'Reorder Level', key: 'reorderLevel', width: 15 },
      { header: 'Suggested Qty', key: 'suggestedQty', width: 15 },
      { header: 'Last Purchase Price', key: 'lastPrice', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };

    for (const p of lowStock) {
      const suggested = Math.max(p.reorderLevel * 2 - p.currentStock, p.reorderLevel);
      sheet.addRow({
        name: p.name,
        category: p.category,
        manufacturer: p.manufacturer || '-',
        vendor: p.vendor?.name || '-',
        currentStock: p.currentStock,
        reorderLevel: p.reorderLevel,
        suggestedQty: suggested,
        lastPrice: lastPurchasePrices[p.id] || 0,
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=oos-report-${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { getCurrent, getHistory, resolve, exportExcel };
