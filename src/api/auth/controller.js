const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./model');

exports.register = async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);
  const user = await User.create({ username: req.body.username, password: hashed });
  res.status(201).json(user);
};

exports.login = async (req, res) => {
  const user = await User.findOne({ where: { username: req.body.username } });
  if (!user || !(await bcrypt.compare(req.body.password, user.password)))
    return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
  res.json({ token });
};

exports.protected = (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
};