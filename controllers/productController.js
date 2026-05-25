const pool = require('../config/db');


exports.createProduct = async (req, res) => {
  const { name, price, category, quantity } = req.body;
  try {
    await pool.query(
      'INSERT INTO products (name, price, category, quantity) VALUES (?, ?, ?, ?)',
      [name, price, category, quantity]
    );
    res.status(201).json({ message: 'Product created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getProducts = async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM products');
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getProduct = async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (results.length === 0) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(results[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateProduct = async (req, res) => {
  const { name, price, category, quantity } = req.body;
  try {
    await pool.query(
      'UPDATE products SET name=?, price=?, category=?, quantity=? WHERE id=?',
      [name, price, category, quantity, req.params.id]
    );
    res.status(200).json({ message: 'Product updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.deleteProduct = async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=?', [req.params.id]);
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
