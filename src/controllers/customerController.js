const Joi = require('joi');
const db = require('../config/db');

const customerSchema = Joi.object({
  name:    Joi.string().min(3).required(),
  email:   Joi.string().email().required(),
  phone:   Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
});

const customerUpdateSchema = Joi.object({
  name:    Joi.string().min(3).optional(),
  email:   Joi.string().email().optional(),
  phone:   Joi.string().allow('').optional(),
  address: Joi.string().allow('').optional(),
});

async function listCustomers(req, res, next) {
  try {
    const [rows] = await db.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getCustomer(req, res, next) {
  try {
    const [rows] = await db.query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

async function createCustomer(req, res, next) {
  try {
    const { error, value } = customerSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Validation failed', details: error.details.map((d) => d.message) });
    }
    const { name, email, phone, address } = value;

    const [existing] = await db.query('SELECT id FROM customers WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const [result] = await db.query(
      'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name, email, phone || '', address || '']
    );
    res.status(201).json({ message: 'Customer created', customerId: result.insertId });
  } catch (err) {
    next(err);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const { error, value } = customerUpdateSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Validation failed', details: error.details.map((d) => d.message) });
    }
    if (!Object.keys(value).length) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    const fields = Object.keys(value);
    const sets   = fields.map((f) => `${f} = ?`).join(', ');
    const vals   = fields.map((f) => value[f]);
    vals.push(req.params.id);

    const [result] = await db.query(`UPDATE customers SET ${sets} WHERE id = ?`, vals);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer updated' });
  } catch (err) {
    next(err);
  }
}

async function deleteCustomer(req, res, next) {
  try {
    const [result] = await db.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
