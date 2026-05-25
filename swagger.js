const swaggerJsDoc = require('swagger-jsdoc');

const options = {

  definition: {
    openapi: '3.0.0',
    info: {
      title: 'XM Bakery API',
      version: '1.0.0',
      description: 'Bakery Backend API Documentation'
    },

    servers: [
      {
        url: 'http://localhost:5000'
      }
    ]
  },

  apis: ['./routes/*.js']

};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;