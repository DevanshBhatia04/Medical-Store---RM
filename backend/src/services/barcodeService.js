const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function lookupBarcode(code) {
  if (!code) return null;

  const localProduct = await prisma.product.findUnique({
    where: { barcode: code },
    include: { vendor: true },
  });

  if (localProduct) {
    return { source: 'local', product: localProduct };
  }

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        return {
          source: 'openfoodfacts',
          product: {
            name: p.product_name || null,
            barcode: code,
            manufacturer: p.brands || null,
            category: p.categories ? p.categories.split(',')[0].trim().toUpperCase().replace(/\s+/g, '_') : null,
          },
        };
      }
    }
  } catch {
    return { source: 'not_found', product: null };
  }

  return { source: 'not_found', product: null };
}

module.exports = { lookupBarcode };
