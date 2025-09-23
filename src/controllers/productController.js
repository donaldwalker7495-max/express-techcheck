const db = require('../utils/db');
const { validationResult } = require('express-validator');

exports.getAll = async (req, res) => { /* GET /products */ }
exports.getById = async (req, res) => { /* GET /products/:id */ }
exports.create = async (req, res) => { /* POST /products */ }
exports.update = async (req, res) => { /* PUT /products/:id */ }
exports.remove = async (req, res) => { /* DELETE /products/:id */ }
exports.search = async (req, res) => { /* GET /products/search?q= */ }
