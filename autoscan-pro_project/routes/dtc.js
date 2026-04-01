const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const dtcController = require('../controllers/dtcController');

router.use(verifyToken);

router.get('/:code', dtcController.getByCode);

module.exports = router;
