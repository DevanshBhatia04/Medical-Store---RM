const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function get(req, res, next) {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { storeName, storeAddress, storeGst, storePhone, ownerName, expiryAlertDays, defaultReorderLevel } = req.body;
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({ data: {} });
    }
    const data = {};
    if (storeName !== undefined) data.storeName = storeName;
    if (storeAddress !== undefined) data.storeAddress = storeAddress;
    if (storeGst !== undefined) data.storeGst = storeGst;
    if (storePhone !== undefined) data.storePhone = storePhone;
    if (ownerName !== undefined) data.ownerName = ownerName;
    if (expiryAlertDays !== undefined) data.expiryAlertDays = parseInt(expiryAlertDays);
    if (defaultReorderLevel !== undefined) data.defaultReorderLevel = parseInt(defaultReorderLevel);

    const updated = await prisma.settings.update({
      where: { id: settings.id },
      data,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { get, update };
