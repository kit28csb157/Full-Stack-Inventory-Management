/**
 * notificationService.js
 * Generates and manages user notifications for order lifecycle milestones:
 * - Order Confirmed
 * - Order Shipped
 * - Out for Delivery
 * - Delivered
 * - Delivery Delayed
 * Persists read/unread state per user in localStorage.
 */

const STORAGE_KEY_PREFIX = 'inv_notif_read_';

export const getReadNotificationIds = (username = 'default') => {
    try {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${username}`);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

export const markNotificationRead = (username = 'default', notifId) => {
    try {
        const readIds = getReadNotificationIds(username);
        if (!readIds.includes(notifId)) {
            readIds.push(notifId);
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${username}`, JSON.stringify(readIds));
        }
    } catch (e) {
        console.error('Error saving read notification', e);
    }
};

export const markAllNotificationsRead = (username = 'default', notifIds = []) => {
    try {
        const existing = getReadNotificationIds(username);
        const merged = Array.from(new Set([...existing, ...notifIds]));
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${username}`, JSON.stringify(merged));
    } catch (e) {
        console.error('Error marking all notifications read', e);
    }
};

export const deriveNotificationsFromOrders = (orders = [], username = 'default') => {
    const readIds = getReadNotificationIds(username);
    const notifications = [];

    orders.forEach(order => {
        const orderId = order.orderId || (order._id ? `#ORD-${order._id.toString().slice(-4).toUpperCase()}` : '#ORD-1001');
        const prodName = order.product?.name || 'Product';
        const qty = order.quantity || 1;
        const status = order.status;

        // 1. Order Confirmed
        if (['Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Delayed'].includes(status)) {
            const notifId = `notif_${order._id || order.orderId}_confirmed`;
            notifications.push({
                id: notifId,
                orderId,
                order,
                type: 'confirmed',
                title: 'Order Confirmed',
                message: `Your order ${orderId} for ${qty}x ${prodName} has been confirmed and is being prepared.`,
                timestamp: order.createdAt || order.orderDate || new Date().toISOString(),
                isRead: readIds.includes(notifId),
                severity: 'info'
            });
        }

        // 2. Order Shipped
        if (['Shipped', 'Out for Delivery', 'Delivered', 'Delayed'].includes(status)) {
            const notifId = `notif_${order._id || order.orderId}_shipped`;
            notifications.push({
                id: notifId,
                orderId,
                order,
                type: 'shipped',
                title: 'Order Shipped',
                message: `Package ${orderId} (${prodName}) has departed the warehouse and is on its way.`,
                timestamp: order.updatedAt || order.createdAt,
                isRead: readIds.includes(notifId),
                severity: 'info'
            });
        }

        // 3. Out for Delivery
        if (['Out for Delivery', 'Delivered'].includes(status)) {
            const notifId = `notif_${order._id || order.orderId}_out_for_delivery`;
            notifications.push({
                id: notifId,
                orderId,
                order,
                type: 'out_for_delivery',
                title: 'Out for Delivery',
                message: `Courier is out for delivery with ${prodName} (${orderId}) today!`,
                timestamp: order.updatedAt || order.createdAt,
                isRead: readIds.includes(notifId),
                severity: 'primary'
            });
        }

        // 4. Delivered
        if (status === 'Delivered') {
            const notifId = `notif_${order._id || order.orderId}_delivered`;
            notifications.push({
                id: notifId,
                orderId,
                order,
                type: 'delivered',
                title: 'Order Delivered',
                message: `Package ${orderId} (${prodName}) was successfully delivered. Enjoy your purchase!`,
                timestamp: order.actualDeliveryDate || order.actualDeliveryTime || order.updatedAt || order.createdAt,
                isRead: readIds.includes(notifId),
                severity: 'success'
            });
        }

        // 5. Delivery Delayed
        if (status === 'Delayed') {
            const notifId = `notif_${order._id || order.orderId}_delayed`;
            const dateStr = order.updatedExpectedDeliveryDate
                ? new Date(order.updatedExpectedDeliveryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : 'shortly';
            notifications.push({
                id: notifId,
                orderId,
                order,
                type: 'delayed',
                title: 'Delivery Delayed',
                message: `Delivery for ${orderId} (${prodName}) is delayed. New expected delivery: ${dateStr}.${order.delayReason ? ' (' + order.delayReason + ')' : ''}`,
                timestamp: order.updatedAt || order.createdAt,
                isRead: readIds.includes(notifId),
                severity: 'warning'
            });
        }
    });

    // Sort newest notifications first
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return notifications;
};
