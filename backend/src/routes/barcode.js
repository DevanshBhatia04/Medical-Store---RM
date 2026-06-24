const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const barcodeService = require('../services/barcodeService');

router.get('/lookup/:code', authMiddleware, async (req, res, next) => {
  try {
    const result = await barcodeService.lookupBarcode(req.params.code);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
