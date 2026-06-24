const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const settingsController = require('../controllers/settingsController');

router.get('/', authMiddleware, settingsController.get);
router.put('/', authMiddleware, settingsController.update);

module.exports = router;
