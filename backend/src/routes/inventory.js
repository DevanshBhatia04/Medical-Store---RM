const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const inventoryController = require('../controllers/inventoryController');

router.get('/', authMiddleware, inventoryController.getAll);
router.post('/', authMiddleware, inventoryController.create);
router.get('/barcode/:code', authMiddleware, inventoryController.getByBarcode);
router.post('/stock-adjust', authMiddleware, inventoryController.stockAdjust);
router.get('/:id', authMiddleware, inventoryController.getById);
router.put('/:id', authMiddleware, inventoryController.update);
router.delete('/:id', authMiddleware, inventoryController.remove);

module.exports = router;
