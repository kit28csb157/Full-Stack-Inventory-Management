/**
 * File: Product.js (Model)
 * Purpose: Mongoose schema definition for the Product model, representing inventory items.
 */

const mongoose = require('mongoose');

// Define the schema for products
const productSchema = new mongoose.Schema({
    // Unique identifier for the product (e.g., SKU or barcode)
    productId: { type: String, required: true, unique: true },
    // Name of the product
    name: { type: String, required: true },
    // Category the product belongs to
    category: { type: String, required: true },
    // Optional product description
    description: { type: String },
    // Unit price of the product
    price: { type: Number, required: true },
    // Current available stock quantity
    quantity: { type: Number, required: true, default: 0 },
    // Supplier or manufacturer name
    supplier: { type: String },
    // Minimum threshold for stock alerts
    minStockLevel: { type: Number, required: true, default: 10 },
    // URL pointing to the product image
    imageUrl: { type: String, default: '' }
}, { timestamps: true }); // Automatically manage createdAt and updatedAt fields

module.exports = mongoose.model('Product', productSchema);
