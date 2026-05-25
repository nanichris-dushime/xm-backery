const pool = require('../config/db');


exports.createCustomer = async (req, res) => {
  const { name, email, phone, address } = req.body;
  try {
    await pool.query(
      'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name, email, phone, address]
    );
    res.status(201).json({ message: 'Customer created successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getCustomers = async (req, res) => {
  try {
    const [results] = await pool.query('SELECT * FROM customers');
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateCustomer = async (req, res) => {
  const { name, email, phone, address } = req.body;
  try {
    await pool.query(
      'UPDATE customers SET name=?, email=?, phone=?, address=? WHERE id=?',
      [name, email, phone, address, req.params.id]
    );
    res.status(200).json({ message: 'Customer updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.deleteCustomer = async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id=?', [req.params.id]);
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
