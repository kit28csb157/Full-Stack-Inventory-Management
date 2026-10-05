/**
 * File: orderController.js
 * Purpose: Contains controller functions for managing orders, including creation, retrieval, status updates, delivery tracking, and cancellations.
 */

const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Helper to compute an expected delivery date (default 3 days from date)
 */
const getDefaultExpectedDelivery = (baseDate = new Date()) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + 3);
    d.setHours(17, 0, 0, 0);
    return d;
};

/**
 * Place a new order (accessible by any logged-in user).
 * Validates product availability, decreases inventory stock, calculates total price, and creates the order.
 */
const placeOrder = async (req, res) => {
    const { productId, quantity, note } = req.body;
    try {
        const numQty = Number(quantity);
        if (!numQty || numQty < 1) {
            return res.status(400).json({ message: 'Please provide a valid quantity of at least 1' });
        }

        // Verify the requested product exists
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        
        // Ensure sufficient stock is available
        if (product.quantity < numQty) {
            return res.status(400).json({
                message: product.quantity === 0
                    ? 'Product is currently Out of Stock'
                    : `Only ${product.quantity} unit(s) available in stock. Cannot order ${numQty}.`
            });
        }
        
        // Deduct inventory quantity
        product.quantity -= numQty;
        await product.save();

        // Compute total price based on product unit price and quantity
        const totalPrice = product.price * numQty;
        const generatedOrderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
        const expectedDate = getDefaultExpectedDelivery();

        // Create the new order record in the database
        const order = await Order.create({
            orderId: generatedOrderId,
            user: req.user._id,
            product: productId,
            quantity: numQty,
            totalPrice,
            note: note || '',
            status: 'Pending',
            orderDate: new Date(),
            expectedDeliveryDate: expectedDate,
            timeline: [
                {
                    status: 'Order Placed',
                    timestamp: new Date(),
                    note: `Order placed for ${numQty} item(s)`
                }
            ]
        });
        
        // Populate referenced user and product data before returning the response
        const populated = await order.populate([
            { path: 'user', select: 'username role email' },
            { path: 'product', select: 'name productId price imageUrl category minStockLevel quantity' }
        ]);
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Get orders for the logged-in user.
 * Fetches all orders belonging to the authenticated user's ID.
 */
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('product', 'name productId price imageUrl category minStockLevel quantity')
            .populate('user', 'username role')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get all orders in the system (accessible by admin only).
 * Retrieves the complete order history across all users.
 */
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('product', 'name productId price imageUrl category minStockLevel quantity')
            .populate('user', 'username role email')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update order status and delivery tracking (accessible by admin).
 * Modifies the state of an order (e.g. Processing, Shipped, Delivered, Delayed, Cancelled).
 */
const updateOrderStatus = async (req, res) => {
    const { status, updatedExpectedDeliveryDate, delayReason, note } = req.body;
    try {
        const order = await Order.findById(req.params.id).populate('product');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const previousStatus = order.status;
        order.status = status;

        if (status === 'Delivered') {
            order.actualDeliveryDate = new Date();
        }

        if (status === 'Delayed') {
            if (updatedExpectedDeliveryDate) {
                order.updatedExpectedDeliveryDate = new Date(updatedExpectedDeliveryDate);
            } else {
                // Auto extend by 2 days if not explicitly specified
                const ext = new Date(order.updatedExpectedDeliveryDate || order.expectedDeliveryDate || Date.now());
                ext.setDate(ext.getDate() + 2);
                order.updatedExpectedDeliveryDate = ext;
            }
            if (delayReason) {
                order.delayReason = delayReason;
            }
        }

        // If newly cancelled by admin, restore product stock
        if (status === 'Cancelled' && previousStatus !== 'Cancelled' && order.product) {
            const product = await Product.findById(order.product._id || order.product);
            if (product) {
                product.quantity += order.quantity;
                await product.save();
            }
        }

        // Append to timeline
        order.timeline = order.timeline || [];
        order.timeline.push({
            status: status === 'Delayed' ? 'Delivery Delayed' : status,
            timestamp: new Date(),
            note: note || (status === 'Delayed' ? delayReason || 'Delivery rescheduled' : `Order status updated to ${status}`)
        });

        await order.save();

        const populated = await order.populate([
            { path: 'product', select: 'name productId price imageUrl category minStockLevel quantity' },
            { path: 'user', select: 'username role' }
        ]);
        res.json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

/**
 * Cancel an order.
 * Can be performed by the order owner or an admin, provided the order isn't already delivered.
 * Restores product stock upon cancellation.
 */
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        // Check authorization: must be the user who created it, or an admin
        const isOwner = order.user.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'Admin';
        if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized' });
        
        // Ensure delivered orders cannot be canceled
        if (order.status === 'Delivered') {
            return res.status(400).json({ message: 'Cannot cancel an order that is already delivered' });
        }
        if (order.status === 'Cancelled') {
            return res.status(400).json({ message: 'Order is already cancelled' });
        }
        
        order.status = 'Cancelled';
        order.timeline = order.timeline || [];
        order.timeline.push({
            status: 'Cancelled',
            timestamp: new Date(),
            note: `Order cancelled by ${isAdmin && !isOwner ? 'Admin' : 'Customer'}`
        });
        await order.save();

        // Restore inventory quantity
        const product = await Product.findById(order.product);
        if (product) {
            product.quantity += order.quantity;
            await product.save();
        }

        const populated = await order.populate([
            { path: 'product', select: 'name productId price imageUrl category minStockLevel quantity' },
            { path: 'user', select: 'username role' }
        ]);
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Generate notifications for the authenticated user based on their orders.
 */
const getUserNotifications = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('product', 'name productId imageUrl')
            .sort({ updatedAt: -1 });

        const notifications = [];
        orders.forEach(order => {
            const orderId = order.orderId || `ORD-${order._id.toString().slice(-6).toUpperCase()}`;
            const prodName = order.product?.name || 'Product';

            // Check recent events from status & timeline
            if (order.status === 'Confirmed') {
                notifications.push({
                    id: `notif-${order._id}-confirmed`,
                    orderId,
                    type: 'Order Confirmed',
                    title: `Order Confirmed: ${orderId}`,
                    message: `Your order for ${order.quantity}x ${prodName} has been confirmed.`,
                    timestamp: order.updatedAt || order.createdAt,
                    status: 'Confirmed'
                });
            } else if (order.status === 'Shipped') {
                notifications.push({
                    id: `notif-${order._id}-shipped`,
                    orderId,
                    type: 'Order Shipped',
                    title: `Order Shipped: ${orderId}`,
                    message: `Your package with ${prodName} has been handed to courier and is on the move.`,
                    timestamp: order.updatedAt || order.createdAt,
                    status: 'Shipped'
                });
            } else if (order.status === 'Out for Delivery') {
                notifications.push({
                    id: `notif-${order._id}-out-for-delivery`,
                    orderId,
                    type: 'Out for Delivery',
                    title: `Out for Delivery: ${orderId}`,
                    message: `Your order for ${prodName} is out for delivery today.`,
                    timestamp: order.updatedAt || order.createdAt,
                    status: 'Out for Delivery'
                });
            } else if (order.status === 'Delivered') {
                notifications.push({
                    id: `notif-${order._id}-delivered`,
                    orderId,
                    type: 'Delivered',
                    title: `Package Delivered: ${orderId}`,
                    message: `Your order for ${prodName} was successfully delivered.`,
                    timestamp: order.actualDeliveryDate || order.updatedAt || order.createdAt,
                    status: 'Delivered'
                });
            } else if (order.status === 'Delayed') {
                const dateStr = order.updatedExpectedDeliveryDate ? new Date(order.updatedExpectedDeliveryDate).toLocaleDateString() : 'soon';
                notifications.push({
                    id: `notif-${order._id}-delayed`,
                    orderId,
                    type: 'Delivery Delayed',
                    title: `Delivery Delayed: ${orderId}`,
                    message: `Delivery for ${prodName} has been rescheduled to ${dateStr}.${order.delayReason ? ' Reason: ' + order.delayReason : ''}`,
                    timestamp: order.updatedAt || order.createdAt,
                    status: 'Delayed'
                });
            }
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    placeOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    getUserNotifications
};
