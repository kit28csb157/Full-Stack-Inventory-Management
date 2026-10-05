/**
 * File: productController.js
 * Purpose: Handles CRUD operations for inventory products (e.g., retrieving, adding, updating, and deleting products).
 */

const Product = require('../models/Product');

/**
 * Retrieve all products.
 * Fetches the complete list of products from the database.
 */
const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Add a new product to the inventory.
 * Creates a new product document using the request body data.
 */
const addProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Update an existing product.
 * Modifies a product by its ID and returns the updated document.
 */
const updateProduct = async (req, res) => {
    try {
        // findByIdAndUpdate with { new: true } returns the document after update
        // { runValidators: true } ensures the update complies with schema rules
        const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Delete a product.
 * Removes a product from the database by its ID.
 */
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Retrieve a single product.
 * Fetches a specific product by its ID.
 */
const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getProducts, addProduct, updateProduct, deleteProduct, getProduct };
