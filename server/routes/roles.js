const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

router.post('/add', roleController.createRole);
router.get('/getAll', roleController.getRoles);
router.get('/getRoleById/:id', roleController.getRoleById);
router.get('/by-name/:name', roleController.getRoleByName);
router.put('/updateRole/:id', roleController.updateRole);
router.delete('/deleteRole/:id', roleController.deleteRole);

module.exports = router;
