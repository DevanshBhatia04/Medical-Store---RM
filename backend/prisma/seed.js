const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@store.com" },
    update: {},
    create: {
      name: "Store Owner",
      email: "admin@store.com",
      password: hashedPassword,
      role: "OWNER",
    },
  });
  console.log(`Admin user: admin@store.com / admin123`);

  const vendors = await Promise.all([
    prisma.vendor.create({
      data: {
        name: "PharmaDistributors Ltd",
        contact: "9876543210",
        address: "Mumbai, Maharashtra",
        email: "info@pharmadist.com",
      },
    }),
    prisma.vendor.create({
      data: {
        name: "MediSupply Co",
        contact: "9876543211",
        address: "Delhi, India",
        email: "orders@medisupply.co",
      },
    }),
    prisma.vendor.create({
      data: {
        name: "HealthCare Wholesale",
        contact: "9876543212",
        address: "Bangalore, Karnataka",
        email: "sales@healthcarewholesale.com",
      },
    }),
    prisma.vendor.create({
      data: {
        name: "City Chemist Distributors",
        contact: "9876543213",
        address: "Pune, Maharashtra",
      },
    }),
  ]);
  console.log(`Seeded ${vendors.length} vendors`);

  const products = [
    { name: "Paracetamol 500mg", category: "TABLET", manufacturer: "Cipla", batchNo: "CIP-2401", expiryDate: new Date("2026-12-31"), purchasePrice: 8, sellingPrice: 18, mrp: 20, gstPercent: 12, currentStock: 150, reorderLevel: 50, unit: "strip", vendorId: vendors[0].id },
    { name: "Amoxicillin 250mg", category: "CAPSULE", manufacturer: "Sun Pharma", batchNo: "SUN-2402", expiryDate: new Date("2026-06-30"), purchasePrice: 25, sellingPrice: 45, mrp: 50, gstPercent: 12, currentStock: 5, reorderLevel: 25, unit: "strip", vendorId: vendors[0].id },
    { name: "Crocin Advance 500mg", category: "TABLET", manufacturer: "GSK", batchNo: "GSK-2403", expiryDate: new Date("2027-03-31"), purchasePrice: 12, sellingPrice: 22, mrp: 25, gstPercent: 12, currentStock: 80, reorderLevel: 30, unit: "strip", vendorId: vendors[1].id },
    { name: "Cetirizine 10mg", category: "TABLET", manufacturer: "Dr Reddy's", batchNo: "DR-2404", expiryDate: new Date("2026-09-30"), purchasePrice: 5, sellingPrice: 12, mrp: 15, gstPercent: 12, currentStock: 200, reorderLevel: 60, unit: "strip", vendorId: vendors[2].id },
    { name: "Augmentin 625 Duo", category: "TABLET", manufacturer: "GSK", batchNo: "GSK-2405", expiryDate: new Date("2026-08-15"), purchasePrice: 45, sellingPrice: 85, mrp: 95, gstPercent: 12, currentStock: 3, reorderLevel: 20, unit: "strip", vendorId: vendors[1].id },
    { name: "Omeprazole 20mg", category: "CAPSULE", manufacturer: "Cipla", batchNo: "CIP-2406", expiryDate: new Date("2027-01-31"), purchasePrice: 10, sellingPrice: 20, mrp: 22, gstPercent: 12, currentStock: 60, reorderLevel: 30, unit: "strip", vendorId: vendors[0].id },
    { name: "Azithromycin 500mg", category: "TABLET", manufacturer: "Sun Pharma", batchNo: "SUN-2407", expiryDate: new Date("2026-07-31"), purchasePrice: 30, sellingPrice: 55, mrp: 62, gstPercent: 12, currentStock: 4, reorderLevel: 20, unit: "strip", vendorId: vendors[0].id },
    { name: "Dolo 650mg", category: "TABLET", manufacturer: "Micro Labs", batchNo: "ML-2408", expiryDate: new Date("2027-05-31"), purchasePrice: 15, sellingPrice: 28, mrp: 32, gstPercent: 12, currentStock: 120, reorderLevel: 40, unit: "strip", vendorId: vendors[2].id },
    { name: "Cough Syrup - Benadryl", category: "SYRUP", manufacturer: "J&J", batchNo: "JJ-2409", expiryDate: new Date("2025-12-31"), purchasePrice: 35, sellingPrice: 65, mrp: 72, gstPercent: 12, currentStock: 20, reorderLevel: 15, unit: "bottle", vendorId: vendors[3].id },
    { name: "Insulin Regular 40IU", category: "INJECTION", manufacturer: "Novo Nordisk", batchNo: "NN-2410", expiryDate: new Date("2025-08-31"), purchasePrice: 120, sellingPrice: 200, mrp: 220, gstPercent: 5, currentStock: 2, reorderLevel: 10, unit: "vial", vendorId: vendors[3].id },
    { name: "Band-Aid (Pack of 10)", category: "SURGICAL", manufacturer: "J&J", batchNo: "JJ-2411", expiryDate: new Date("2028-01-31"), purchasePrice: 15, sellingPrice: 30, mrp: 35, gstPercent: 12, currentStock: 0, reorderLevel: 20, unit: "box", vendorId: vendors[1].id },
    { name: "Moov Cream 50g", category: "OINTMENT", manufacturer: "Raptakos", batchNo: "RP-2412", expiryDate: new Date("2027-06-30"), purchasePrice: 25, sellingPrice: 48, mrp: 55, gstPercent: 12, currentStock: 35, reorderLevel: 15, unit: "tube", vendorId: vendors[3].id },
    { name: "Vitamin C 500mg", category: "TABLET", manufacturer: "Cipla", batchNo: "CIP-2413", expiryDate: new Date("2026-11-30"), purchasePrice: 18, sellingPrice: 35, mrp: 40, gstPercent: 12, currentStock: 90, reorderLevel: 30, unit: "strip", vendorId: vendors[0].id },
    { name: "Eye Drop - Moisten 10ml", category: "DROPS", manufacturer: "Alcon", batchNo: "AL-2414", expiryDate: new Date("2026-04-30"), purchasePrice: 40, sellingPrice: 75, mrp: 85, gstPercent: 12, currentStock: 8, reorderLevel: 15, unit: "bottle", vendorId: vendors[2].id },
    { name: "ORS Powder (Pack of 5)", category: "POWDER", manufacturer: "Mankind", batchNo: "MK-2415", expiryDate: new Date("2027-08-31"), purchasePrice: 10, sellingPrice: 20, mrp: 25, gstPercent: 5, currentStock: 45, reorderLevel: 20, unit: "box", vendorId: vendors[3].id },
    { name: "Betadine 100ml", category: "OTHER", manufacturer: "Winmedicare", batchNo: "WM-2416", expiryDate: new Date("2026-10-31"), purchasePrice: 30, sellingPrice: 55, mrp: 62, gstPercent: 12, currentStock: 25, reorderLevel: 10, unit: "bottle", vendorId: vendors[2].id },
    { name: "Nicip Plus", category: "TABLET", manufacturer: "Intas", batchNo: "IN-2417", expiryDate: new Date("2027-02-28"), purchasePrice: 20, sellingPrice: 38, mrp: 42, gstPercent: 12, currentStock: 10, reorderLevel: 15, unit: "strip", vendorId: vendors[1].id },
    { name: "Glucose D Powder 200g", category: "POWDER", manufacturer: "Glaxo", batchNo: "GL-2418", expiryDate: new Date("2027-12-31"), purchasePrice: 22, sellingPrice: 42, mrp: 48, gstPercent: 5, currentStock: 30, reorderLevel: 12, unit: "bottle", vendorId: vendors[0].id },
    { name: "Paracip 250 Suspension 60ml", category: "SYRUP", manufacturer: "Cipla", batchNo: "CIP-2419", expiryDate: new Date("2026-05-31"), purchasePrice: 20, sellingPrice: 38, mrp: 42, gstPercent: 12, currentStock: 18, reorderLevel: 10, unit: "bottle", vendorId: vendors[0].id },
    { name: "Surgical Spirit 100ml", category: "SURGICAL", manufacturer: "Winmedicare", batchNo: "WM-2420", expiryDate: new Date("2027-09-30"), purchasePrice: 18, sellingPrice: 35, mrp: 40, gstPercent: 12, currentStock: 22, reorderLevel: 10, unit: "bottle", vendorId: vendors[2].id },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }
  console.log(`Seeded ${products.length} products`);

  await prisma.settings.create({
    data: {
      storeName: "Raman Medicos",
      storeAddress: "123, Main Road, City Center, India",
      storeGst: "22AAAAA0000A1Z5",
      storePhone: "9876543210",
      ownerName: "Raman Sharma",
      expiryAlertDays: 90,
      defaultReorderLevel: 10,
    },
  });
  console.log("Default settings created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
