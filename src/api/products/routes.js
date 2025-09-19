const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { validateProduct } = require('./validator');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validateProduct, controller.create);
router.put('/:id', validateProduct, controller.update);
router.delete('/:id', controller.remove);
router.get('/search', controller.search);

module.exports = router;