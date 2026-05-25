const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');
const role = require('../middleware/role');


// Only admin can access
router.get(
  '/dashboard',
  auth,
  role('admin'),
  (req, res) => {

    res.json({
      message: "Welcome Admin"
    });

  }
);

module.exports = router;