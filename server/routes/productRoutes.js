const express = require('express');
const { getProducts, addProduct, updateProduct, deleteProduct, getProduct } = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, getProducts);
router.post('/', protect, admin, addProduct);
router.put('/:id', protect, admin, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);
router.get('/:id', protect, getProduct);

module.exports = router;
