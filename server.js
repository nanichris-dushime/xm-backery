require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express();

// Global middleware (must come before routes)
app.use(cors());
app.use(express.json());

// Routes
const authRoutes     = require('./routes/authRoutes');
const adminRoutes    = require('./routes/adminRoutes');
const productRoutes  = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes    = require('./routes/orderRoutes');

app.use('/api/auth',      authRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders',    orderRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => res.send('XM Bakery API Running...'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
