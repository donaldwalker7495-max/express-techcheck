const { Op } = require('sequelize');
const Product = require('./model');

exports.getAll = async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.getById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    product
      ? res.json(product)
      : res.status(404).json({ message: 'Product not found' });
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving product' });
  }
};

exports.create = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create product' });
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await Product.update(req.body, {
      where: { id: req.params.id }
    });
    updated
      ? res.json({ message: 'Product updated' })
      : res.status(404).json({ message: 'Product not found' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to update product' });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Product.destroy({ where: { id: req.params.id } });
    deleted
      ? res.status(204).end()
      : res.status(404).json({ message: 'Product not found' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

exports.search = async (req, res) => {
  try {
    const { q = '', page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const products = await Product.findAll({
      where: {
        name: {
          [Op.like]: `%${q}%`
        }
      },
      limit,
      offset
    });

    if (products.length === 0) {
      return res.json({ message: 'No results found' });
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
};