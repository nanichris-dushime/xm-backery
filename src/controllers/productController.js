const Joi = require('joi');
const db = require('../config/db');

const productSchema = Joi.object({
  name:        Joi.string().min(2).required(),
  description: Joi.string().allow('').optional(),
  price:       Joi.number().precision(2).positive().required(),
  category:    Joi.string().min(2).required(),
  quantity:    Joi.number().integer().min(0).required(),
});

const productUpdateSchema = Joi.object({
  name:        Joi.string().min(2).optional(),
  description: Joi.string().allow('').optional(),
  price:       Joi.number().precision(2).positive().optional(),
  category:    Joi.string().min(2).optional(),
  quantity:    Joi.number().integer().min(0).optional(),
});

async function createProduct(req, res, next) {
  try {
    const { error, value } = productSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Validation failed', details: error.details.map((d) => d.message) });
    }
    const { name, description, price, category, quantity } = value;
    const [result] = await db.query(
      'INSERT INTO products (name, description, price, category, quantity) VALUES (?, ?, ?, ?, ?)',
      [name, description || '', price, category, quantity]
    );
    res.status(201).json({ message: 'Product created', productId: result.insertId });
  } catch (err) {
    next(err);
  }
}

async function listProducts(req, res, next) {
  try {
    const { category, minPrice, maxPrice, minQuantity, maxQuantity, search, sortBy, order, page, limit } = req.query;
    const filters = [];
    const values = [];
    let sql = 'SELECT * FROM products WHERE 1=1';

    if (category) {
      filters.push('category = ?');
      values.push(category);
    }
    if (minPrice) {
      filters.push('price >= ?');
      values.push(Number(minPrice));
    }
    if (maxPrice) {
      filters.push('price <= ?');
      values.push(Number(maxPrice));
    }
    if (minQuantity) {
      filters.push('quantity >= ?');
      values.push(Number(minQuantity));
    }
    if (maxQuantity) {
      filters.push('quantity <= ?');
      values.push(Number(maxQuantity));
    }
    if (search) {
      filters.push('(name LIKE ? OR description LIKE ? OR category LIKE ?)');
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (filters.length) {
      sql += ' AND ' + filters.join(' AND ');
    }

    const sortableColumns = ['name', 'price', 'category', 'quantity', 'created_at'];
    const orderBy    = sortableColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder  = order === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${orderBy} ${sortOrder}`;

    const pageNum   = parseInt(page,  10) || 1;
    const pageLimit = parseInt(limit, 10) || 20;
    const offset    = (pageNum - 1) * pageLimit;
    sql += ' LIMIT ? OFFSET ?';
    values.push(pageLimit, offset);

    const [rows] = await db.query(sql, values);

    let countSql = 'SELECT COUNT(*) AS total FROM products WHERE 1=1';
    if (filters.length) countSql += ' AND ' + filters.join(' AND ');
    const countValues = values.slice(0, values.length - 2);
    const [[{ total }]] = await db.query(countSql, countValues);

    res.json({ page: pageNum, limit: pageLimit, total, pages: Math.ceil(total / pageLimit), data: rows });
  } catch (err) {
    next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { error, value } = productUpdateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Validation failed', details: error.details.map((d) => d.message) });
    }
    const fields = Object.keys(value);
    if (!fields.length) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    const sets   = fields.map((f) => `${f} = ?`).join(', ');
    const vals   = fields.map((f) => value[f]);
    vals.push(req.params.id);

    const [result] = await db.query(`UPDATE products SET ${sets} WHERE id = ?`, vals);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product updated' });
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
}

async function listCategories(req, res, next) {
  try {
    const [rows] = await db.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category ASC');
    res.json(rows.map((r) => r.category));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  listCategories,
};
