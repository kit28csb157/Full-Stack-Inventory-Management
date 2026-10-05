/**
 * dashboardData.js
 * Utility helper to filter and process sales, inventory, and delivery analytics
 * for any given date range (Today, Yesterday, Last 7 Days, This Month, Custom Date).
 * Includes comprehensive sample data generation covering all delivery lifecycle stages:
 * Order Placed → Order Confirmed → Packed → Shipped → Out for Delivery → Delivered (plus Delayed and Cancelled).
 */

// Delivery timeline steps definition
export const TIMELINE_STEPS = [
    { key: 'Order Placed', label: 'Order Placed', stepNumber: 1 },
    { key: 'Order Confirmed', label: 'Order Confirmed', stepNumber: 2 },
    { key: 'Packed', label: 'Packed', stepNumber: 3 },
    { key: 'Shipped', label: 'Shipped', stepNumber: 4 },
    { key: 'Out for Delivery', label: 'Out for Delivery', stepNumber: 5 },
    { key: 'Delivered', label: 'Delivered', stepNumber: 6 }
];

// Helper to check if date falls in range
export const isDateInRange = (dateStr, filterType, customStart, customEnd) => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    const now = new Date();
    
    // Normalise today boundaries
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (filterType === 'Today') {
        return d >= startOfToday && d <= endOfToday;
    }
    
    if (filterType === 'Yesterday') {
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        const endOfYesterday = new Date(startOfToday.getTime() - 1);
        return d >= startOfYesterday && d <= endOfYesterday;
    }
    
    if (filterType === 'Last 7 Days') {
        const start7 = new Date(startOfToday);
        start7.setDate(start7.getDate() - 6);
        return d >= start7 && d <= endOfToday;
    }
    
    if (filterType === 'This Month') {
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return d >= startMonth && d <= endOfToday;
    }
    
    if (filterType === 'Custom Date') {
        if (!customStart) return true;
        const cStart = new Date(customStart);
        cStart.setHours(0, 0, 0, 0);
        const cEnd = customEnd ? new Date(customEnd) : new Date(customStart);
        cEnd.setHours(23, 59, 59, 999);
        return d >= cStart && d <= cEnd;
    }
    
    return true;
};

// Generates fallback sample orders spanning today, yesterday, last week, and this month
export const generateSampleData = (products = []) => {
    const now = new Date();
    
    const sampleProducts = products.length > 0 ? products : [
        { _id: 'prod_1', productId: 'PRD-1001', name: 'Wireless Ergonomic Mouse', category: 'Electronics', price: 29.99, quantity: 45, minStockLevel: 15, supplier: 'LogiTech Co', imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400' },
        { _id: 'prod_2', productId: 'PRD-1002', name: 'Mechanical Gaming Keyboard', category: 'Electronics', price: 89.50, quantity: 8, minStockLevel: 10, supplier: 'Keytronics', imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400' },
        { _id: 'prod_3', productId: 'PRD-1003', name: 'Ultra-Wide 34" Monitor', category: 'Displays', price: 349.99, quantity: 4, minStockLevel: 5, supplier: 'Vision Corp', imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400' },
        { _id: 'prod_4', productId: 'PRD-1004', name: 'Noise-Cancelling Headphones', category: 'Audio', price: 149.00, quantity: 0, minStockLevel: 10, supplier: 'SonicWave', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' },
        { _id: 'prod_5', productId: 'PRD-1005', name: 'USB-C Multiport Hub 7-in-1', category: 'Accessories', price: 39.99, quantity: 60, minStockLevel: 20, supplier: 'AnkerTech', imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400' },
        { _id: 'prod_6', productId: 'PRD-1006', name: 'Ergonomic Office Chair', category: 'Furniture', price: 199.99, quantity: 3, minStockLevel: 8, supplier: 'ComfortSeats', imageUrl: 'https://images.unsplash.com/photo-1580481077195-c2662c957e84?w=400' },
        { _id: 'prod_7', productId: 'PRD-1007', name: 'HD 1080p Webcam with Mic', category: 'Electronics', price: 49.99, quantity: 0, minStockLevel: 12, supplier: 'StreamPro', imageUrl: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400' },
        { _id: 'prod_8', productId: 'PRD-1008', name: 'Standing Desk Converter', category: 'Furniture', price: 129.50, quantity: 18, minStockLevel: 6, supplier: 'FlexiDesk', imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400' }
    ];

    const customers = [
        'Alex Johnson', 'Sarah Miller', 'David Smith', 'Emily Davis',
        'Michael Brown', 'Jessica Wilson', 'Daniel Taylor', 'Sophia Martinez',
        'James Anderson', 'Olivia Thomas'
    ];

    const orders = [];
    let orderSeq = 1001;

    // Helper to format timestamps and build delivery milestones
    const createOrder = (daysAgo, hourOffset, prodIdx, qty, status, options = {}) => {
        const prod = sampleProducts[prodIdx % sampleProducts.length];
        const orderDate = new Date(now);
        orderDate.setDate(orderDate.getDate() - daysAgo);
        orderDate.setHours(9 + hourOffset, (hourOffset * 17) % 60, 0, 0);

        const expectedDelivery = new Date(orderDate);
        expectedDelivery.setDate(expectedDelivery.getDate() + 3);
        expectedDelivery.setHours(17, 0, 0, 0);

        let actualDelivery = null;
        let updatedExpectedDelivery = null;
        let delayReason = '';

        if (status === 'Delivered') {
            actualDelivery = new Date(expectedDelivery);
            if (options.isLate) {
                actualDelivery.setDate(actualDelivery.getDate() + 1);
                actualDelivery.setHours(19, 30, 0, 0);
            } else {
                actualDelivery.setDate(actualDelivery.getDate() - (options.daysEarly || 0));
                actualDelivery.setHours(14, 15, 0, 0);
            }
        }

        if (status === 'Delayed') {
            updatedExpectedDelivery = new Date(expectedDelivery);
            updatedExpectedDelivery.setDate(updatedExpectedDelivery.getDate() + 2);
            updatedExpectedDelivery.setHours(18, 0, 0, 0);
            delayReason = options.delayReason || 'Transit delay due to severe weather conditions along the transit corridor.';
        }

        // Build milestone timeline
        const timeline = [
            { status: 'Order Placed', timestamp: orderDate.toISOString(), note: 'Order placed by customer' }
        ];

        if (['Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Delayed'].includes(status)) {
            const confirmedDate = new Date(orderDate);
            confirmedDate.setHours(confirmedDate.getHours() + 2);
            timeline.push({ status: 'Order Confirmed', timestamp: confirmedDate.toISOString(), note: 'Payment verified and order confirmed' });
        }

        if (['Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Delayed'].includes(status)) {
            const packedDate = new Date(orderDate);
            packedDate.setHours(packedDate.getHours() + 6);
            timeline.push({ status: 'Packed', timestamp: packedDate.toISOString(), note: 'Inventory items packed and barcode labeled' });
        }

        if (['Shipped', 'Out for Delivery', 'Delivered', 'Delayed'].includes(status)) {
            const shippedDate = new Date(orderDate);
            shippedDate.setDate(shippedDate.getDate() + 1);
            shippedDate.setHours(11, 0, 0, 0);
            timeline.push({ status: 'Shipped', timestamp: shippedDate.toISOString(), note: 'Handed over to carrier transit hub' });
        }

        if (['Out for Delivery', 'Delivered'].includes(status)) {
            const outDate = new Date(orderDate);
            outDate.setDate(outDate.getDate() + 2);
            outDate.setHours(8, 30, 0, 0);
            timeline.push({ status: 'Out for Delivery', timestamp: outDate.toISOString(), note: 'Courier out for doorstep delivery' });
        }

        if (status === 'Delivered') {
            timeline.push({ status: 'Delivered', timestamp: actualDelivery.toISOString(), note: 'Signed & delivered successfully' });
        }

        if (status === 'Delayed') {
            timeline.push({
                status: 'Delivery Delayed',
                timestamp: new Date(orderDate.getTime() + 36 * 3600 * 1000).toISOString(),
                note: delayReason
            });
        }

        if (status === 'Cancelled') {
            timeline.push({
                status: 'Cancelled',
                timestamp: new Date(orderDate.getTime() + 4 * 3600 * 1000).toISOString(),
                note: 'Order cancelled before dispatch'
            });
        }

        const id = `ORD-${orderSeq++}`;
        const cust = customers[(orderSeq + daysAgo) % customers.length];

        orders.push({
            _id: `sample_${id}`,
            orderId: id,
            product: prod,
            user: { username: cust, role: 'User' },
            quantity: qty,
            totalPrice: prod.price * qty,
            status: status,
            orderDate: orderDate.toISOString(),
            createdAt: orderDate.toISOString(),
            updatedAt: (actualDelivery || updatedExpectedDelivery || orderDate).toISOString(),
            expectedDeliveryDate: expectedDelivery.toISOString(),
            actualDeliveryDate: actualDelivery ? actualDelivery.toISOString() : null,
            updatedExpectedDeliveryDate: updatedExpectedDelivery ? updatedExpectedDelivery.toISOString() : null,
            delayReason: delayReason,
            timeline: timeline,
            isLate: status === 'Delivered' ? !!options.isLate : (status === 'Delayed' || (now > expectedDelivery && status !== 'Cancelled'))
        });
    };

    // Orders for Today
    createOrder(0, 1, 0, 2, 'Delivered', { isLate: false }); // On-time
    createOrder(0, 2, 1, 1, 'Out for Delivery');            // Out for delivery
    createOrder(0, 3, 4, 3, 'Shipped');                     // Shipped
    createOrder(0, 4, 5, 1, 'Delayed', { delayReason: 'Severe weather delay in regional routing center' }); // Delayed
    createOrder(0, 5, 2, 1, 'Packed');                      // Packed
    createOrder(0, 6, 7, 2, 'Confirmed');                   // Confirmed
    createOrder(0, 7, 0, 1, 'Pending');                     // Pending
    createOrder(0, 8, 3, 1, 'Cancelled');                   // Cancelled

    // Orders for Yesterday
    createOrder(1, 1, 1, 2, 'Delivered', { isLate: false });
    createOrder(1, 3, 0, 4, 'Delivered', { isLate: true }); // Late
    createOrder(1, 4, 4, 2, 'Shipped');
    createOrder(1, 5, 5, 1, 'Delivered', { isLate: true });
    createOrder(1, 7, 7, 1, 'Out for Delivery');
    createOrder(1, 8, 2, 1, 'Cancelled');

    // Orders for Last 7 Days (days 2 to 6)
    createOrder(2, 2, 0, 3, 'Delivered', { isLate: false });
    createOrder(2, 5, 4, 2, 'Delivered', { isLate: false });
    createOrder(3, 1, 1, 1, 'Delivered', { isLate: true });
    createOrder(3, 4, 7, 2, 'Delivered', { isLate: false });
    createOrder(4, 2, 2, 1, 'Delivered', { isLate: false });
    createOrder(4, 6, 5, 1, 'Delivered', { isLate: false });
    createOrder(5, 3, 0, 5, 'Delivered', { isLate: false });
    createOrder(5, 7, 4, 3, 'Cancelled');
    createOrder(6, 2, 1, 2, 'Delivered', { isLate: true });
    createOrder(6, 5, 7, 1, 'Delivered', { isLate: false });

    // Orders for This Month (earlier days)
    createOrder(10, 3, 0, 2, 'Delivered', { isLate: false });
    createOrder(12, 2, 4, 4, 'Delivered', { isLate: false });
    createOrder(15, 4, 2, 1, 'Delivered', { isLate: true });
    createOrder(18, 5, 1, 1, 'Delivered', { isLate: false });
    createOrder(22, 1, 5, 2, 'Delivered', { isLate: false });

    return { sampleProducts, sampleOrders: orders };
};

// Computes all required metrics for the dashboard view
export const computeDashboardMetrics = (allProducts, allOrders, filterType, customStart, customEnd) => {
    // Filter orders based on active date filter
    const filteredOrders = allOrders.filter(o =>
        isDateInRange(o.createdAt || o.orderDate, filterType, customStart, customEnd)
    );

    // 1. Sales Metrics
    const nonCancelledOrders = filteredOrders.filter(o => o.status !== 'Cancelled');
    const totalSales = filteredOrders.length;
    const productsSold = nonCancelledOrders.reduce((sum, o) => sum + Number(o.quantity || 0), 0);
    const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);

    // 2. Product-wise Sales Breakdown
    const productMap = new Map();

    allProducts.forEach(p => {
        const prodKey = p.productId || p._id;
        productMap.set(prodKey, {
            _id: p._id,
            productId: p.productId || p._id,
            name: p.name,
            category: p.category || 'General',
            price: Number(p.price || 0),
            remainingStock: Number(p.quantity || 0),
            minStockLevel: Number(p.minStockLevel || 10),
            supplier: p.supplier || 'N/A',
            imageUrl: p.imageUrl || '',
            soldQty: 0,
            revenue: 0,
            orderCount: 0
        });
    });

    filteredOrders.forEach(o => {
        const prodId = o.product?.productId || o.product?._id || (typeof o.product === 'string' ? o.product : null);
        if (prodId && productMap.has(prodId)) {
            const item = productMap.get(prodId);
            item.orderCount += 1;
            if (o.status !== 'Cancelled') {
                item.soldQty += Number(o.quantity || 0);
                item.revenue += Number(o.totalPrice || 0);
            }
        }
    });

    const productSales = Array.from(productMap.values()).map(item => {
        const openingStock = item.remainingStock + item.soldQty;
        const status = item.remainingStock === 0 ? 'Out of Stock' : item.remainingStock <= item.minStockLevel ? 'Low Stock' : 'In Stock';
        return {
            ...item,
            openingStock,
            status
        };
    });

    // 3. Stock Status Metrics
    const totalProducts = allProducts.length;
    const availableStock = allProducts.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const lowStockProducts = allProducts.filter(p => Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.minStockLevel || 10));
    const outOfStockProducts = allProducts.filter(p => Number(p.quantity) === 0);

    // 4. Delivery Metrics
    const totalOrdersCount = filteredOrders.length;
    const deliveredOrders = filteredOrders.filter(o => o.status === 'Delivered');
    const pendingOrders = filteredOrders.filter(o => ['Pending', 'Processing', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery'].includes(o.status));
    const delayedOrders = filteredOrders.filter(o => o.status === 'Delayed');
    const cancelledOrders = filteredOrders.filter(o => o.status === 'Cancelled');

    const onTimeDeliveries = deliveredOrders.filter(o => !o.isLate).length;
    const lateDeliveries = deliveredOrders.filter(o => o.isLate).length;

    // Delivery table normalized entries
    const deliveryTableData = filteredOrders.map(o => {
        const orderId = o.orderId || (o._id ? `#ORD-${o._id.toString().slice(-4).toUpperCase()}` : '#ORD-1001');
        const prod = o.product || {};
        const customer = o.user?.username || (typeof o.user === 'string' ? o.user : 'Customer');
        const orderDate = o.orderDate || o.createdAt;
        
        let expectedTime = o.expectedDeliveryDate || o.expectedDeliveryTime;
        if (!expectedTime && orderDate) {
            const exp = new Date(orderDate);
            exp.setDate(exp.getDate() + 3);
            exp.setHours(17, 0, 0, 0);
            expectedTime = exp.toISOString();
        }

        let actualTime = o.actualDeliveryDate || o.actualDeliveryTime;
        if (!actualTime && o.status === 'Delivered') {
            actualTime = expectedTime;
        }

        let onTimeStatus = 'On-Time';
        if (o.status === 'Cancelled') {
            onTimeStatus = 'Cancelled';
        } else if (o.status === 'Delayed') {
            onTimeStatus = 'Delayed';
        } else if (o.status === 'Delivered') {
            onTimeStatus = o.isLate ? 'Late' : 'On-Time';
        } else {
            const expD = expectedTime ? new Date(expectedTime) : new Date();
            onTimeStatus = new Date() > expD ? 'Delayed' : 'On Schedule';
        }

        return {
            _id: o._id,
            orderId,
            product: prod,
            customer,
            orderDate,
            expectedDeliveryTime: expectedTime,
            actualDeliveryTime: actualTime,
            updatedExpectedDeliveryDate: o.updatedExpectedDeliveryDate,
            delayReason: o.delayReason,
            deliveryStatus: o.status,
            onTimeStatus,
            quantity: o.quantity,
            totalPrice: o.totalPrice,
            timeline: o.timeline || []
        };
    });

    // 5. Build Chart Data for the selected period
    let chartData = [];
    if (filterType === 'Today' || filterType === 'Yesterday') {
        // Hourly breakdown
        const hours = ['9 AM', '11 AM', '1 PM', '3 PM', '5 PM', '7 PM', '9 PM'];
        chartData = hours.map((hLabel, idx) => {
            const hStart = 8 + idx * 2;
            const hEnd = hStart + 2;
            const matching = nonCancelledOrders.filter(o => {
                const hour = new Date(o.createdAt || o.orderDate).getHours();
                return hour >= hStart && hour < hEnd;
            });
            const rev = matching.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
            const units = matching.reduce((s, o) => s + Number(o.quantity || 0), 0);
            return {
                label: hLabel,
                revenue: rev,
                units: units
            };
        });
    } else if (filterType === 'Last 7 Days') {
        const days = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' });
            const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

            const matching = nonCancelledOrders.filter(o => {
                const od = new Date(o.createdAt || o.orderDate);
                return od >= dStart && od <= dEnd;
            });
            const rev = matching.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
            const units = matching.reduce((s, o) => s + Number(o.quantity || 0), 0);
            days.push({
                label: dayLabel,
                revenue: rev,
                units: units
            });
        }
        chartData = days;
    } else {
        // This Month or Custom Date
        const intervals = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
        chartData = intervals.map((label, idx) => {
            const matching = nonCancelledOrders.filter((o, oIdx) => oIdx % intervals.length === idx);
            const rev = matching.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
            const units = matching.reduce((s, o) => s + Number(o.quantity || 0), 0);
            return {
                label,
                revenue: rev,
                units: units
            };
        });
    }

    return {
        salesMetrics: {
            totalSales,
            productsSold,
            totalRevenue
        },
        productSales,
        stockStatus: {
            totalProducts,
            availableStock,
            lowStockProducts,
            outOfStockProducts
        },
        deliveryMetrics: {
            totalOrders: totalOrdersCount,
            deliveredOrders: deliveredOrders.length,
            pendingOrders: pendingOrders.length,
            delayedOrders: delayedOrders.length,
            cancelledOrders: cancelledOrders.length,
            onTimeDeliveries,
            lateDeliveries
        },
        deliveryTableData,
        chartData
    };
};
