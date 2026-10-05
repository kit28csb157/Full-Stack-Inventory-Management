/**
 * File: Order.js (Model)
 * Purpose: Mongoose schema definition for the Order model, representing customer orders with delivery tracking in the database.
 */

const mongoose = require('mongoose');

// Define the schema for orders
const orderSchema = new mongoose.Schema({
    // Formatted readable order ID (e.g. ORD-100452)
    orderId: { type: String },
    // Reference to the user who placed the order
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Reference to the ordered product
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // Number of items ordered
    quantity: { type: Number, required: true, min: 1 },
    // Total cost for this order (price * quantity)
    totalPrice: { type: Number, required: true },
    // Current status of the order and delivery
    status: {
        type: String,
        enum: [
            'Pending',
            'Processing',
            'Confirmed',
            'Packed',
            'Shipped',
            'Out for Delivery',
            'Delivered',
            'Delayed',
            'Cancelled'
        ],
        default: 'Pending'
    },
    // Optional additional notes from the user
    note: { type: String },
    // Order creation date
    orderDate: { type: Date, default: Date.now },
    // Initial estimated delivery date
    expectedDeliveryDate: { type: Date },
    // Timestamp when delivery was completed
    actualDeliveryDate: { type: Date },
    // Updated expected delivery date if delayed
    updatedExpectedDeliveryDate: { type: Date },
    // Reason for delay if applicable
    delayReason: { type: String },
    // Delivery timeline milestones
    timeline: [
        {
            status: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            note: { type: String }
        }
    ]
}, { timestamps: true }); // Automatically manage createdAt and updatedAt fields

module.exports = mongoose.model('Order', orderSchema);
