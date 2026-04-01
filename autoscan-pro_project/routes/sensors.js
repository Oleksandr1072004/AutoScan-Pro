const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const sensorController = require('../controllers/sensorController');

router.use(verifyToken);

router.get('/live',              sensorController.getLive);
router.get('/history/:sessionId',sensorController.getHistory);

module.exports = router;
