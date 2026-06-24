const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const invoiceController = require('../controllers/invoiceController');

router.get('/', authMiddleware, invoiceController.getAll);
router.post('/', authMiddleware, invoiceController.create);
router.get('/:id', authMiddleware, invoiceController.getById);

module.exports = router;
