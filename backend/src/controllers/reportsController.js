const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');

const prisma = new PrismaClient();

async function dashboardSummary(req, res, next) {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);

    const [todayInvoices, inventoryAgg, oosProducts, expiringProducts, recentInvoices, topSellingRaw] = await Promise.all([
      prisma.invoice.findMany({
        where: { date: { gte: startOfDay, lte: endOfDay } },
        select: { total: true },
      }),
      prisma.product.aggregate({
        _sum: { currentStock: true },
        _count: { id: true },
      }),
      prisma.product.findMany({
        select: { id: true, currentStock: true, reorderLevel: true },
      }),
      prisma.product.findMany({
        where: {
          expiryDate: {
            lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          },
        },
        select: { id: true },
      }),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { items: true } }, user: { select: { name: true } } },
      }),
      prisma.invoiceItem.groupBy({
        by: ['productId'],
        _sum: { qty: true },
        orderBy: { _sum: { qty: 'desc' } },
        take: 5,
      }),
    ]);

    const oosCount = oosProducts.filter(p => p.currentStock <= p.reorderLevel).length;
    const expiryCount = expiringProducts.length;

    const productPrices = await prisma.product.findMany({
      select: { currentStock: true, purchasePrice: true },
    });
    const inventoryValue = productPrices.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
    const totalProducts = inventoryAgg._count.id;

    const todaySales = todayInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const topProductIds = topSellingRaw.map(t => t.productId);
    const topProducts = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true },
    });
    const topSelling = topSellingRaw.map(t => {
      const prod = topProducts.find(p => p.id === t.productId);
      return { productId: t.productId, name: prod?.name || 'Unknown', totalQty: t._sum.qty };
    });

    const allOOS = await prisma.product.findMany({
      include: { vendor: true },
      orderBy: { currentStock: 'asc' },
    });
    const oosPreview = allOOS.filter(p => p.currentStock <= p.reorderLevel).slice(0, 5);

    const allExpiring = await prisma.product.findMany({
      where: { expiryDate: { lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) } },
      orderBy: { expiryDate: 'asc' },
      take: 5,
    });
    const expiryPreview = allExpiring;

    res.json({
      todaySales: Math.round(todaySales * 100) / 100,
      billsToday: todayInvoices.length,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      totalProducts,
      oosCount,
      expiryCount,
      recentInvoices,
      topSelling,
      oosPreview,
      expiryPreview,
    });
  } catch (err) {
    next(err);
  }
}

async function salesReport(req, res, next) {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const to = req.query.to ? new Date(req.query.to) : new Date();
    to.setHours(23, 59, 59, 999);

    const invoices = await prisma.invoice.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });

    const dailyMap = {};
    for (const inv of invoices) {
      const key = inv.date.toISOString().split('T')[0];
      if (!dailyMap[key]) {
        dailyMap[key] = { date: key, count: 0, total: 0, cash: 0, upi: 0, card: 0, credit: 0 };
      }
      dailyMap[key].count++;
      dailyMap[key].total += inv.total;
      if (inv.paymentMode === 'CASH') dailyMap[key].cash += inv.total;
      else if (inv.paymentMode === 'UPI') dailyMap[key].upi += inv.total;
      else if (inv.paymentMode === 'CARD') dailyMap[key].card += inv.total;
      else if (inv.paymentMode === 'CREDIT') dailyMap[key].credit += inv.total;
    }

    const daily = Object.values(dailyMap).map(d => ({
      ...d,
      total: Math.round(d.total * 100) / 100,
      cash: Math.round(d.cash * 100) / 100,
      upi: Math.round(d.upi * 100) / 100,
      card: Math.round(d.card * 100) / 100,
      credit: Math.round(d.credit * 100) / 100,
    }));

    const grandTotal = invoices.reduce((s, i) => s + i.total, 0);

    res.json({
      from: from.toISOString(),
      to: to.toISOString(),
      totalInvoices: invoices.length,
      grandTotal: Math.round(grandTotal * 100) / 100,
      daily,
    });
  } catch (err) {
    next(err);
  }
}

async function topProducts(req, res, next) {
  try {
    const from = req.query.from ? new Date(req.query.from) : undefined;
    const to = req.query.to ? new Date(req.query.to) : undefined;
    const sortBy = req.query.sortBy || 'qty';
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const invoiceWhere = {};
    if (from || to) {
      invoiceWhere.date = {};
      if (from) invoiceWhere.date.gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        invoiceWhere.date.lte = end;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      select: { id: true },
    });
    const invoiceIds = invoices.map(i => i.id);

    const items = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      where: { invoiceId: { in: invoiceIds } },
      _sum: { qty: true, lineTotal: true },
      orderBy: sortBy === 'revenue' ? { _sum: { lineTotal: 'desc' } } : { _sum: { qty: 'desc' } },
      take: limit,
    });

    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, category: true, manufacturer: true, sellingPrice: true },
    });

    const result = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        name: product?.name || 'Unknown',
        category: product?.category || '',
        manufacturer: product?.manufacturer || '',
        totalQty: item._sum.qty || 0,
        totalRevenue: Math.round((item._sum.lineTotal || 0) * 100) / 100,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function categoryWise(req, res, next) {
  try {
    const from = req.query.from ? new Date(req.query.from) : undefined;
    const to = req.query.to ? new Date(req.query.to) : undefined;

    const invoiceWhere = {};
    if (from || to) {
      invoiceWhere.date = {};
      if (from) invoiceWhere.date.gte = from;
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        invoiceWhere.date.lte = end;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      select: { id: true },
    });
    const invoiceIds = invoices.map(i => i.id);

    const items = await prisma.invoiceItem.findMany({
      where: { invoiceId: { in: invoiceIds } },
      include: { product: { select: { category: true } } },
    });

    const catMap = {};
    for (const item of items) {
      const cat = item.product.category;
      if (!catMap[cat]) {
        catMap[cat] = { category: cat, qty: 0, revenue: 0 };
      }
      catMap[cat].qty += item.qty;
      catMap[cat].revenue += item.lineTotal;
    }

    const result = Object.values(catMap).map(c => ({
      ...c,
      revenue: Math.round(c.revenue * 100) / 100,
    })).sort((a, b) => b.revenue - a.revenue);

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function stockMovement(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const skip = (page - 1) * limit;
    const from = req.query.from;
    const to = req.query.to;
    const type = req.query.type || '';
    const productId = req.query.productId ? parseInt(req.query.productId) : undefined;

    const where = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }
    if (type) where.type = type;
    if (productId) where.productId = productId;

    const [logs, total] = await Promise.all([
      prisma.stockLog.findMany({
        where,
        include: { product: { select: { id: true, name: true, category: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

async function gstReport(req, res, next) {
  try {
    const month = req.query.month;
    let from, to;
    if (month) {
      from = new Date(month + '-01');
      to = new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const invoices = await prisma.invoice.findMany({
      where: { date: { gte: from, lte: to } },
      select: { id: true, total: true, gstTotal: true, subtotal: true },
    });

    const invoiceIds = invoices.map(i => i.id);
    const items = await prisma.invoiceItem.findMany({
      where: { invoiceId: { in: invoiceIds } },
    });

    const gstMap = {};
    for (const item of items) {
      const gstPct = item.gstPercent;
      if (!gstMap[gstPct]) {
        gstMap[gstPct] = { gstPercent: gstPct, taxableValue: 0, gstAmount: 0, count: 0 };
      }
      const taxable = item.lineTotal / (1 + gstPct / 100);
      const gst = item.lineTotal - taxable;
      gstMap[gstPct].taxableValue += taxable;
      gstMap[gstPct].gstAmount += gst;
      gstMap[gstPct].count++;
    }

    const result = Object.values(gstMap).map(g => ({
      ...g,
      taxableValue: Math.round(g.taxableValue * 100) / 100,
      gstAmount: Math.round(g.gstAmount * 100) / 100,
    })).sort((a, b) => a.gstPercent - b.gstPercent);

    const totalTaxable = result.reduce((s, g) => s + g.taxableValue, 0);
    const totalGst = result.reduce((s, g) => s + g.gstAmount, 0);

    res.json({
      month: from.toISOString().slice(0, 7),
      totalInvoices: invoices.length,
      totalTaxable: Math.round(totalTaxable * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      breakdown: result,
    });
  } catch (err) {
    next(err);
  }
}

async function gstExport(req, res, next) {
  try {
    const month = req.query.month;
    let from, to;
    if (month) {
      from = new Date(month + '-01');
      to = new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const invoices = await prisma.invoice.findMany({
      where: { date: { gte: from, lte: to } },
      include: { items: true, user: { select: { name: true } } },
      orderBy: { date: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('GST Report');

    sheet.columns = [
      { header: 'Invoice No', key: 'invoiceNo', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'Product', key: 'product', width: 25 },
      { header: 'HSN/SAC', key: 'hsn', width: 12 },
      { header: 'Qty', key: 'qty', width: 8 },
      { header: 'Rate', key: 'rate', width: 10 },
      { header: 'Taxable Value', key: 'taxable', width: 14 },
      { header: 'GST %', key: 'gstPct', width: 8 },
      { header: 'CGST', key: 'cgst', width: 10 },
      { header: 'SGST', key: 'sgst', width: 10 },
      { header: 'Total', key: 'total', width: 12 },
    ];

    sheet.getRow(1).font = { bold: true };

    for (const inv of invoices) {
      for (const item of inv.items) {
        const taxable = Math.round((item.lineTotal / (1 + item.gstPercent / 100)) * 100) / 100;
        const gst = Math.round((item.lineTotal - taxable) * 100) / 100;
        const cgst = Math.round((gst / 2) * 100) / 100;
        const sgst = Math.round((gst / 2) * 100) / 100;
        sheet.addRow({
          invoiceNo: inv.invoiceNo,
          date: inv.date.toISOString().split('T')[0],
          customer: inv.customerName,
          product: item.productName,
          hsn: '',
          qty: item.qty,
          rate: item.price,
          taxable,
          gstPct: item.gstPercent,
          cgst,
          sgst,
          total: item.lineTotal,
        });
      }
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=gst-report-${from.toISOString().slice(0, 7)}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboardSummary, salesReport, topProducts, categoryWise, stockMovement, gstReport, gstExport };
