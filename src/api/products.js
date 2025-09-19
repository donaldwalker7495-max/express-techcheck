import express from 'express';
import { z } from 'zod';
import db from '../database.js';

const router = express.Router();

// Validation schemas
const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
  price: z.number().positive('Price must be positive')
});

const updateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  price: z.number().positive().optional()
});

// GET /api/products - Get all products
router.get('/', (req, res) => {
  db.all('SELECT * FROM products ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve products' });
    }
    res.json({
      products: rows,
      count: rows.length
    });
  });
});

// GET /api/products/search - Search products by name (must come before /:id route)
router.get('/search', (req, res) => {
  const { q, page = 1 } = req.query;
  
  if (!q || q.trim() === '') {
    return res.status(400).json({ error: 'Search query (q) is required' });
  }

  const searchQuery = `%${q.toLowerCase()}%`;
  const limit = 10;
  const offset = (parseInt(page) - 1) * limit;

  // Get total count for pagination
  db.get('SELECT COUNT(*) as total FROM products WHERE LOWER(name) LIKE ?', [searchQuery], (err, countResult) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to search products' });
    }

    // Get paginated results
    db.all('SELECT * FROM products WHERE LOWER(name) LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?', 
           [searchQuery, limit, offset], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to search products' });
      }

      if (rows.length === 0) {
        return res.json({
          message: 'No products found matching your search query',
          products: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalCount: 0,
            limit
          }
        });
      }

      const totalPages = Math.ceil(countResult.total / limit);

      res.json({
        products: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount: countResult.total,
          limit
        }
      });
    });
  });
});

// GET /api/products/:id - Get product by ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to retrieve product' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(row);
  });
});

// POST /api/products - Create new product
router.post('/', (req, res) => {
  try {
    const validatedData = productSchema.parse(req.body);
    
    const stmt = db.prepare('INSERT INTO products (name, description, price) VALUES (?, ?, ?)');
    stmt.run(validatedData.name, validatedData.description, validatedData.price, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create product' });
      }
      
      // Get the created product
      db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ error: 'Product created but failed to retrieve' });
        }
        res.status(201).json({
          message: 'Product created successfully',
          product: row
        });
      });
    });
    stmt.finalize();
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    const validatedData = updateProductSchema.parse(req.body);
    
    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }

    // Check if product exists first
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to check product existence' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      
      if (validatedData.name !== undefined) {
        updates.push('name = ?');
        values.push(validatedData.name);
      }
      if (validatedData.description !== undefined) {
        updates.push('description = ?');
        values.push(validatedData.description);
      }
      if (validatedData.price !== undefined) {
        updates.push('price = ?');
        values.push(validatedData.price);
      }
      
      values.push(id);
      const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
      
      db.run(query, values, function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update product' });
        }
        
        // Get updated product
        db.get('SELECT * FROM products WHERE id = ?', [id], (err, updatedRow) => {
          if (err) {
            return res.status(500).json({ error: 'Product updated but failed to retrieve' });
          }
          res.json({
            message: 'Product updated successfully',
            product: updatedRow
          });
        });
      });
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  // Check if product exists first
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to check product existence' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }

    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete product' });
      }
      
      res.json({
        message: 'Product deleted successfully',
        deletedProduct: row
      });
    });
  });
});


export default router;
