const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const scanController = require('../controllers/scanController');

router.use(verifyToken);

router.post('/',                           scanController.initiateScan);
router.get('/:id',                         scanController.getResult);
router.get('/history/:vehicleId',          scanController.getHistory);
router.delete('/:vehicleId/clear-dtc',     scanController.clearDtc);
router.delete('/:id',                      scanController.deleteSession);

module.exports = router;
