const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const oosController = require('../controllers/oosController');

router.get('/current', authMiddleware, oosController.getCurrent);
router.get('/history', authMiddleware, oosController.getHistory);
router.get('/export', authMiddleware, oosController.exportExcel);
router.post('/resolve/:id', authMiddleware, oosController.resolve);

module.exports = router;
