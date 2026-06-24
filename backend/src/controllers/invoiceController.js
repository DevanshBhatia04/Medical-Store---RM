const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAll(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const skip = (page - 1) * limit;
    const from = req.query.from;
    const to = req.query.to;
    const search = req.query.search || '';
    const paymentMode = req.query.paymentMode || '';

    const where = {};
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        where.date.lte = endDate;
      }
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { invoiceNo: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (paymentMode) {
      where.paymentMode = paymentMode;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      invoices,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { id: true, name: true, barcode: true } } },
        },
      },
    });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { customerName, customerPhone, items, discountAmount, paymentMode } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const lastInvoice = await tx.invoice.findFirst({
        orderBy: { id: 'desc' },
        select: { invoiceNo: true },
      });
      let nextNum = 1;
      if (lastInvoice && lastInvoice.invoiceNo) {
        const parts = lastInvoice.invoiceNo.split('-');
        if (parts.length === 2) {
          nextNum = parseInt(parts[1]) + 1;
        }
      }
      const invoiceNo = `INV-${String(nextNum).padStart(4, '0')}`;

      let subtotal = 0;
      let gstTotal = 0;
      const invoiceItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw Object.assign(new Error(`Product id ${item.productId} not found`), { statusCode: 404 });
        }
        const qty = parseInt(item.qty) || 1;
        if (product.currentStock < qty) {
          throw Object.assign(new Error(`Insufficient stock for ${product.name}: available ${product.currentStock}, required ${qty}`), { statusCode: 400 });
        }
        const price = parseFloat(item.price) || product.sellingPrice;
        const gstPct = parseFloat(item.gstPercent) !== undefined ? parseFloat(item.gstPercent) : product.gstPercent;
        const lineTotal = qty * price;
        const gstAmount = lineTotal - (lineTotal / (1 + gstPct / 100));

        subtotal += lineTotal;
        gstTotal += gstAmount;

        invoiceItemsData.push({
          productId: product.id,
          productName: product.name,
          qty,
          price,
          gstPercent: gstPct,
          lineTotal,
        });

        await tx.product.update({
          where: { id: product.id },
          data: { currentStock: { decrement: qty } },
        });

        await tx.stockLog.create({
          data: {
            productId: product.id,
            type: 'SALE',
            quantity: qty,
            note: `Invoice ${invoiceNo}`,
          },
        });
      }

      const disc = parseFloat(discountAmount) || 0;
      const total = subtotal - disc;

      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          customerName: customerName || 'Walk-in',
          customerPhone: customerPhone || null,
          subtotal: Math.round(subtotal * 100) / 100,
          gstTotal: Math.round(gstTotal * 100) / 100,
          discountAmount: Math.round(disc * 100) / 100,
          total: Math.round(total * 100) / 100,
          paymentMode: paymentMode || 'CASH',
          userId: req.user.id,
          items: {
            create: invoiceItemsData,
          },
        },
        include: { items: true },
      });

      return invoice;
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create };
