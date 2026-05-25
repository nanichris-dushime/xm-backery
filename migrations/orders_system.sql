-- ============================================
-- XM BAKERY - ORDERS SYSTEM MIGRATION
-- ============================================

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  customer_id  INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status       ENUM('pending', 'processing', 'delivered', 'cancelled') DEFAULT 'pending',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  INDEX idx_customer (customer_id),
  INDEX idx_status   (status),
  INDEX idx_created  (created_at)
);


-- 2. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL,
  price      DECIMAL(10, 2) NOT NULL,   -- price snapshot at time of order

  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_order   (order_id),
  INDEX idx_product (product_id)
);


-- 3. Link users → customers (required for GET /api/orders/my)
--    Skip if the column already exists.
ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_id INT NULL;
ALTER TABLE users ADD CONSTRAINT fk_user_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
