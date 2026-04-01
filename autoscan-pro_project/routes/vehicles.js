const router = require('express').Router();
const { verifyToken } = require('../middleware/auth');
const vehicleController = require('../controllers/vehicleController');

router.use(verifyToken);

router.get('/',     vehicleController.getAll);
router.post('/',    vehicleController.create);
router.get('/:id',  vehicleController.getById);
router.patch('/:id',vehicleController.update);
router.delete('/:id',vehicleController.remove);

module.exports = router;
