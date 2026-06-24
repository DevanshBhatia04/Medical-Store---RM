const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAll(req, res, next) {
  try {
    const vendors = await prisma.vendor.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(vendors);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, contact, address, email } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Vendor name is required' });
    }
    const vendor = await prisma.vendor.create({
      data: { name, contact: contact || null, address: address || null, email: email || null },
    });
    res.status(201).json(vendor);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    const { name, contact, address, email } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (contact !== undefined) data.contact = contact;
    if (address !== undefined) data.address = address;
    if (email !== undefined) data.email = email;

    const vendor = await prisma.vendor.update({ where: { id }, data });
    res.json(vendor);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    const productCount = await prisma.product.count({ where: { vendorId: id } });
    if (productCount > 0) {
      return res.status(409).json({ error: `Cannot delete vendor with ${productCount} associated products` });
    }
    await prisma.vendor.delete({ where: { id } });
    res.json({ message: 'Vendor deleted' });
  } catch (err) {
    next(err);
  }
}

async function getProducts(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    const products = await prisma.product.findMany({
      where: { vendorId: id },
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
}

async function getOosProducts(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    const products = await prisma.product.findMany({
      where: {
        vendorId: id,
        currentStock: { lte: prisma.product.fields.reorderLevel ? undefined : 0 },
      },
      orderBy: { currentStock: 'asc' },
    });
    const result = products.filter(p => p.currentStock <= p.reorderLevel);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove, getProducts, getOosProducts };
