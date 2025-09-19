const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

// Define Product model
const Product = sequelize.define('Product', {
  name: DataTypes.STRING,
  description: DataTypes.STRING,
  price: DataTypes.FLOAT,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Define User model
const User = sequelize.define('User', {
  username: DataTypes.STRING,
  password: DataTypes.STRING,
});

// Sync DB
const initDB = async () => {
  try {
    await sequelize.sync({ alter: true }); // use { force: true } for dev reset
    console.log('✅ Database synced');
  } catch (err) {
    console.error('❌ DB sync failed:', err);
  }
};

module.exports = {
  sequelize,
  Product,
  User,
  initDB,
};