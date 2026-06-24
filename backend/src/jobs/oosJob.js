const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function startOosJob() {
  cron.schedule('0 0 * * *', async () => {
    console.log('[OOS Job] Running midnight OOS check...');
    try {
      const products = await prisma.product.findMany({
        where: {
          currentStock: { lte: prisma.product.fields.reorderLevel ? undefined : 0 },
        },
      });

      const lowStock = products.filter(p => p.currentStock <= p.reorderLevel);
      let created = 0;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      for (const product of lowStock) {
        const existing = await prisma.oOSLog.findFirst({
          where: {
            productId: product.id,
            flaggedAt: { gte: todayStart, lte: todayEnd },
          },
        });
        if (!existing) {
          await prisma.oOSLog.create({
            data: {
              productId: product.id,
              stockAtTime: product.currentStock,
            },
          });
          created++;
        }
      }

      console.log(`[OOS Job] Found ${lowStock.length} low-stock products, created ${created} new OOS log entries`);
    } catch (err) {
      console.error('[OOS Job] Error:', err);
    }
  });

  console.log('[OOS Job] Scheduled for 0 0 * * * (midnight)');
}

module.exports = { startOosJob };
