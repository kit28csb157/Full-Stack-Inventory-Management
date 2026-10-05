const express = require('express');
const { registerUser, loginUser, getUsers } = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/users', protect, admin, getUsers);

module.exports = router;
