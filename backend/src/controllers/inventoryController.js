const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAll(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 200);
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const stockStatus = req.query.stockStatus || '';

    let products, total;

    if (stockStatus === 'low') {
      const raw = await prisma.$queryRaw`
        SELECT id, name, barcode, category, manufacturer, "batchNo", "expiryDate",
               "purchasePrice", "sellingPrice", mrp, "gstPercent", "currentStock",
               "reorderLevel", unit, "vendorId", "createdAt", "updatedAt"
        FROM "Product"
        WHERE "currentStock" <= "reorderLevel" AND "currentStock" > 0
        ${search ? Prisma.sql`AND (name ILIKE ${'%' + search + '%'} OR barcode ILIKE ${'%' + search + '%'} OR manufacturer ILIKE ${'%' + search + '%'})` : Prisma.empty}
        ${category ? Prisma.sql`AND category = ${category}` : Prisma.empty}
        ORDER BY name ASC
        LIMIT ${limit} OFFSET ${skip}
      `;
      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count FROM "Product"
        WHERE "currentStock" <= "reorderLevel" AND "currentStock" > 0
        ${search ? Prisma.sql`AND (name ILIKE ${'%' + search + '%'} OR barcode ILIKE ${'%' + search + '%'} OR manufacturer ILIKE ${'%' + search + '%'})` : Prisma.empty}
        ${category ? Prisma.sql`AND category = ${category}` : Prisma.empty}
      `;
      products = raw;
      total = countResult[0]?.count || 0;
    } else {
      const where = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { barcode: { contains: search, mode: 'insensitive' } },
          { manufacturer: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (category) where.category = category;
      if (stockStatus === 'out') where.currentStock = 0;

      const [fetchedProducts, fetchedTotal] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { vendor: true },
          orderBy: { name: 'asc' },
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ]);
      products = fetchedProducts;
      total = fetchedTotal;
    }

    res.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { vendor: true },
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, barcode, category, manufacturer, batchNo, expiryDate, purchasePrice, sellingPrice, mrp, gstPercent, currentStock, reorderLevel, unit, vendorId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    const data = {
      name,
      barcode: barcode || null,
      category: category || 'TABLET',
      manufacturer: manufacturer || null,
      batchNo: batchNo || null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      purchasePrice: parseFloat(purchasePrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      mrp: parseFloat(mrp) || 0,
      gstPercent: parseFloat(gstPercent) || 12,
      currentStock: parseInt(currentStock) || 0,
      reorderLevel: parseInt(reorderLevel) || 10,
      unit: unit || 'strip',
      vendorId: vendorId ? parseInt(vendorId) : null,
    };
    const product = await prisma.product.create({ data, include: { vendor: true } });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const { name, barcode, category, manufacturer, batchNo, expiryDate, purchasePrice, sellingPrice, mrp, gstPercent, currentStock, reorderLevel, unit, vendorId } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (barcode !== undefined) data.barcode = barcode;
    if (category !== undefined) data.category = category;
    if (manufacturer !== undefined) data.manufacturer = manufacturer;
    if (batchNo !== undefined) data.batchNo = batchNo;
    if (expiryDate !== undefined) data.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (purchasePrice !== undefined) data.purchasePrice = parseFloat(purchasePrice);
    if (sellingPrice !== undefined) data.sellingPrice = parseFloat(sellingPrice);
    if (mrp !== undefined) data.mrp = parseFloat(mrp);
    if (gstPercent !== undefined) data.gstPercent = parseFloat(gstPercent);
    if (currentStock !== undefined) data.currentStock = parseInt(currentStock);
    if (reorderLevel !== undefined) data.reorderLevel = parseInt(reorderLevel);
    if (unit !== undefined) data.unit = unit;
    if (vendorId !== undefined) data.vendorId = vendorId ? parseInt(vendorId) : null;

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { vendor: true },
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const refCount = await prisma.invoiceItem.count({ where: { productId: id } });
    if (refCount > 0) {
      return res.status(409).json({ error: 'Cannot delete product referenced in invoices' });
    }
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
}

async function getByBarcode(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where: { barcode: req.params.code },
      include: { vendor: true },
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function stockAdjust(req, res, next) {
  try {
    const { productId, type, quantity, note } = req.body;
    if (!productId || !type || !quantity) {
      return res.status(400).json({ error: 'productId, type, and quantity are required' });
    }
    const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const qty = parseInt(quantity);
    const [stockLog] = await prisma.$transaction([
      prisma.stockLog.create({
        data: {
          productId: parseInt(productId),
          type,
          quantity: qty,
          note: note || null,
        },
      }),
      prisma.product.update({
        where: { id: parseInt(productId) },
        data: { currentStock: { increment: type === 'PURCHASE' || type === 'RETURN' ? qty : -qty } },
      }),
    ]);
    const updated = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: { vendor: true },
    });
    res.json({ stockLog, product: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove, getByBarcode, stockAdjust };
