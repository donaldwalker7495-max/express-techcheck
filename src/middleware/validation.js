import Joi from 'joi';

export const validateProduct = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    description: Joi.string().min(10).required(),
    price: Joi.number().positive().precision(2).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
};

export const validateUser = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(6).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
};