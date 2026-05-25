require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const db = require('./config/db.js');

const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

const port = process.env.PORT || 4000;

db.getConnection()
  .then((connection) => {
    connection.release();
    app.listen(port, () => {
      console.log(`XM Bakeries API listening on port ${port}`);
      console.log(`Swagger UI: http://localhost:${port}/api/docs`);
    });
  })
  .catch((error) => {
    console.error('Unable to connect to database:', error.message);
    process.exit(1);
  });
