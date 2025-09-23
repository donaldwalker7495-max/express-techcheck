const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/', productController.getAll);
router.get('/search', productController.search);
router.get('/:id', productController.getById);

router.post('/', authenticateToken, [
  body('name').notEmpty(),
  body('description').notEmpty(),
  body('price').isFloat({ gt: 0 })
], productController.create);

router.put('/:id', authenticateToken, [
  body('name').optional().notEmpty(),
  body('description').optional().notEmpty(),
  body('price').optional().isFloat({ gt: 0 })
], productController.update);

router.delete('/:id', authenticateToken, productController.remove);

module.exports = router;
