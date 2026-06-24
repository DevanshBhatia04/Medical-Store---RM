const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const vendorController = require('../controllers/vendorController');

router.get('/', authMiddleware, vendorController.getAll);
router.post('/', authMiddleware, vendorController.create);
router.get('/:id', authMiddleware, vendorController.getById);
router.put('/:id', authMiddleware, vendorController.update);
router.delete('/:id', authMiddleware, vendorController.remove);
router.get('/:id/products', authMiddleware, vendorController.getProducts);
router.get('/:id/oos-products', authMiddleware, vendorController.getOosProducts);

module.exports = router;
