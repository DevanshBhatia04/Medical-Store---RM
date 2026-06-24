const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getExpiring(req, res, next) {
  try {
    const daysThreshold = parseInt(req.query.daysThreshold) || 90;
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

    const products = await prisma.product.findMany({
      where: {
        expiryDate: {
          lte: thresholdDate,
        },
      },
      include: { vendor: true },
      orderBy: { expiryDate: 'asc' },
    });

    res.json(products);
  } catch (err) {
    next(err);
  }
}

module.exports = { getExpiring };
