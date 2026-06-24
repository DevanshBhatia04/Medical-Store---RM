const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const expiryController = require('../controllers/expiryController');

router.get('/', authMiddleware, expiryController.getExpiring);

module.exports = router;
