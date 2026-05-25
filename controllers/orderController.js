const pool = require('../config/db');


// ================= PLACE ORDER =================
exports.placeOrder = async (req, res) => {
  const { customer_id, items } = req.body;

  if (!customer_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'customer_id and items[] are required' });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Validate customer
    const [customers] = await conn.query(
      'SELECT id FROM customers WHERE id = ?',
      [customer_id]
    );
    if (customers.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Customer not found' });
    }

    // 2. Validate products + check stock (SELECT FOR UPDATE locks rows)
    let totalAmount = 0;
    const enrichedItems = [];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity < 1) {
        await conn.rollback();
        return res.status(400).json({ message: 'Each item needs product_id and quantity >= 1' });
      }

      const [products] = await conn.query(
        'SELECT id, name, price, quantity FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );

      if (products.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: `Product ID ${item.product_id} not found` });
      }

      const product = products[0];

      if (product.quantity < item.quantity) {
        await conn.rollback();
        return res.status(400).json({
          message: `Insufficient stock for "${product.name}". Available: ${product.quantity}`
        });
      }

      totalAmount += product.price * item.quantity;
      enrichedItems.push({ ...item, price: product.price });
    }

    // 3. Insert order
    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)',
      [customer_id, totalAmount, 'pending']
    );
    const orderId = orderResult.insertId;

    // 4. Insert order_items + deduct inventory
    for (const item of enrichedItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );

      await conn.query(
        'UPDATE products SET quantity = quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    await conn.commit();

    res.status(201).json({
      message: 'Order placed successfully',
      order_id: orderId,
      total_amount: totalAmount
    });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Order failed', error: err.message });
  } finally {
    conn.release();
  }
};


// ================= GET ALL ORDERS (admin) =================
exports.getOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.id, c.name AS customer_name, o.total_amount, o.status, o.created_at
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `);
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= GET MY ORDERS (customer) =================
exports.getMyOrders = async (req, res) => {
  try {
    // JWT payload must contain customer_id (set during login)
    const customerId = req.user.customer_id;

    if (!customerId) {
      return res.status(400).json({ message: 'No customer profile linked to this account' });
    }

    const [orders] = await pool.query(`
      SELECT o.id, o.total_amount, o.status, o.created_at
      FROM orders o
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
    `, [customerId]);

    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= GET SINGLE ORDER =================
exports.getOrder = async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, c.name AS customer_name, c.email, c.phone
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [req.params.id]);

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Enforce ownership for customers
    if (req.user.role === 'customer' && orders[0].customer_id !== req.user.customer_id) {
      return res.status(403).json({ message: 'Access forbidden' });
    }

    const [items] = await pool.query(`
      SELECT oi.id, p.name AS product_name, oi.quantity, oi.price,
             (oi.quantity * oi.price) AS subtotal
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [req.params.id]);

    res.status(200).json({ order: orders[0], items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= UPDATE ORDER STATUS (admin) =================
exports.updateOrderStatus = async (req, res) => {
  const allowed = ['pending', 'processing', 'delivered', 'cancelled'];
  const { status } = req.body;

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= DELETE ORDER (admin) =================
exports.deleteOrder = async (req, res) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [items] = await conn.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [req.params.id]
    );

    // Restore inventory
    for (const item of items) {
      await conn.query(
        'UPDATE products SET quantity = quantity + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    const [result] = await conn.query('DELETE FROM orders WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }

    await conn.commit();
    res.status(200).json({ message: 'Order deleted and inventory restored' });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: err.message });
  } finally {
    conn.release();
  }
};
