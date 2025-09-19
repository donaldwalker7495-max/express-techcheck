const { body, validationResult } = require('express-validator');

exports.validateProduct = [
  body('name').isString().notEmpty(),
  body('description').isString().notEmpty(),
  body('price').isFloat({ gt: 0 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];