const Joi = require('joi');
const db = require('../config/db');

const orderSchema = Joi.object({
  customer_id: Joi.number().integer().required(),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
  delivery_address: Joi.string().required(),
  delivery_status: Joi.string().valid('pending', 'in_transit', 'delivered').default('pending'),
});

async function placeOrder(req, res, next) {
  const connection = await db.getConnection();
  try {
    const { error, value } = orderSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      connection.release();
      return res.status(400).json({ message: 'Validation failed', details: error.details.map((d) => d.message) });
    }

    const { customer_id, items, delivery_address, delivery_status } = value;

    await connection.beginTransaction();
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_id, delivery_address, delivery_status) VALUES (?, ?, ?)',
      [customer_id, delivery_address, delivery_status]
    );

    const orderId = orderResult.insertId;
    for (const item of items) {
      const [productRows] = await connection.query('SELECT quantity, price FROM products WHERE id = ?', [item.product_id]);
      if (!productRows.length) {
        throw new Error(`Product not found: ${item.product_id}`);
      }
      if (productRows[0].quantity < item.quantity) {
        throw new Error(`Insufficient quantity for product ${item.product_id}`);
      }
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, productRows[0].price]
      );
      await connection.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await connection.commit();
    connection.release();
    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    await connection.rollback();
    connection.release();
    if (err.message.startsWith('Product not found') || err.message.startsWith('Insufficient quantity')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
}

async function listOrders(req, res, next) {
  try {
    const { customerId, status, page, limit } = req.query;
    const filters = [];
    const values = [];
    let sql = 'SELECT o.*, c.name AS customer_name FROM orders o JOIN customers c ON o.customer_id = c.id WHERE 1=1';

    if (customerId) {
      filters.push('o.customer_id = ?');
      values.push(customerId);
    }
    if (status) {
      filters.push('o.delivery_status = ?');
      values.push(status);
    }

    if (filters.length) {
      sql += ' AND ' + filters.join(' AND ');
    }
    sql += ' ORDER BY o.created_at DESC';

    const pageNum = parseInt(page, 10) || 1;
    const pageLimit = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * pageLimit;
    sql += ' LIMIT ? OFFSET ?';
    values.push(pageLimit, offset);

    const [rows] = await db.query(sql, values);
    res.json({ page: pageNum, limit: pageLimit, data: rows });
  } catch (err) {
    next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const [orderRows] = await db.query('SELECT o.*, c.name AS customer_name, c.phone, c.address FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?', [req.params.id]);
    if (!orderRows.length) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const [items] = await db.query('SELECT oi.*, p.name AS product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [req.params.id]);
    res.json({ ...orderRows[0], items });
  } catch (err) {
    next(err);
  }
}

async function updateDeliveryStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['pending', 'in_transit', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid delivery status' });
    }
    const [result] = await db.query('UPDATE orders SET delivery_status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order status updated' });
  } catch (err) {
    next(err);
  }
}

async function deleteOrder(req, res, next) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [items] = await connection.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [req.params.id]);
    for (const item of items) {
      await connection.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
    }
    await connection.query('DELETE FROM order_items WHERE order_id = ?', [req.params.id]);
    const [result] = await connection.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ message: 'Order not found' });
    }
    await connection.commit();
    connection.release();
    res.json({ message: 'Order deleted' });
  } catch (err) {
    await connection.rollback();
    connection.release();
    next(err);
  }
}

module.exports = {
  placeOrder,
  listOrders,
  getOrder,
  updateDeliveryStatus,
  deleteOrder,
};
