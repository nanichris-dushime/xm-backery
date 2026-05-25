exports.validateProduct = (req, res, next) => {

  const { name, price, quantity } = req.body;

  if (!name || !price || quantity == null) {

    return res.status(400).json({
      message: "All required fields must be provided"
    });

  }

  if (price <= 0) {

    return res.status(400).json({
      message: "Price must be greater than zero"
    });

  }

  next();

};



exports.validateCustomer = (req, res, next) => {

  const { name, email } = req.body;

  if (!name || !email) {

    return res.status(400).json({
      message: "Name and email are required"
    });

  }

  next();

};