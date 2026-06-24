const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const reportsController = require('../controllers/reportsController');

router.get('/dashboard-summary', authMiddleware, reportsController.dashboardSummary);
router.get('/sales', authMiddleware, reportsController.salesReport);
router.get('/top-products', authMiddleware, reportsController.topProducts);
router.get('/category-wise', authMiddleware, reportsController.categoryWise);
router.get('/stock-movement', authMiddleware, reportsController.stockMovement);
router.get('/gst', authMiddleware, reportsController.gstReport);
router.get('/gst/export', authMiddleware, reportsController.gstExport);

module.exports = router;
