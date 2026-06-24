const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
