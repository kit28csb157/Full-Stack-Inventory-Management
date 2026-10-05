import React, { useEffect, useState } from 'react';
import {
    getProducts,
    getAllOrders,
    getMyOrders,
    getCurrentUser,
    placeOrder,
    cancelOrder
} from '../services/api';
import {
    computeDashboardMetrics,
    generateSampleData
} from '../services/dashboardData';
import {
    deriveNotificationsFromOrders,
    markNotificationRead,
    markAllNotificationsRead
} from '../services/notificationService';
import DailySalesChart from '../components/DailySalesChart';
import ProductDetailModal from '../components/ProductDetailModal';
import DeliveryTimeline from '../components/DeliveryTimeline';
import CustomerOrderModal from '../components/CustomerOrderModal';
import {
    Calendar,
    TrendingUp,
    DollarSign,
    Package,
    ShoppingCart,
    Truck,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Clock,
    Layers,
    Filter,
    Eye,
    RefreshCw,
    Bell,
    CheckCheck,
    Search,
    ShoppingBag,
    ArrowRight,
    MapPin,
    AlertCircle,
    Sparkles,
    User,
    Check
} from 'lucide-react';

const Dashboard = () => {
    const [rawProducts, setRawProducts] = useState([]);
    const [rawOrders, setRawOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState(null);

    // Customer dashboard navigation tab: 'orders' | 'tracking' | 'history' | 'catalog' | 'notifications'
    const [customerTab, setCustomerTab] = useState('orders');

    // Admin view toggle (if Admin wants to view customer view or analytics view)
    const [adminViewMode, setAdminViewMode] = useState('admin'); // 'admin' | 'customer'

    // Filter states for Admin analytics: 'Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Custom Date'
    const [dateFilter, setDateFilter] = useState('Today');
    const [customStart, setCustomStart] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });
    const [customEnd, setCustomEnd] = useState(() => {
        const d = new Date();
        return d.toISOString().split('T')[0];
    });

    // Chart metric toggle: 'revenue' | 'units'
    const [chartMetric, setChartMetric] = useState('revenue');

    // Selected product for modal inspection
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Modal state for Customer Order / Tracking
    const [modalTrackingOrder, setModalTrackingOrder] = useState(null);
    const [modalOrderProduct, setModalOrderProduct] = useState(null);
    const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

    // Delivery table search & filter (Admin)
    const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('ALL');

    // Customer filters
    const [historySearch, setHistorySearch] = useState('');
    const [historyStatusFilter, setHistoryStatusFilter] = useState('ALL');
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('');

    const currentUser = getCurrentUser();
    const isAdmin = currentUser?.role === 'Admin';
    const username = currentUser?.username || 'Customer';

    useEffect(() => {
        loadDashboardData();
    }, [currentUser?.role]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            let products = [];
            let orders = [];

            try {
                products = await getProducts();
            } catch (pErr) {
                console.warn('API getProducts fallback to sample data', pErr);
            }

            try {
                orders = isAdmin ? await getAllOrders() : await getMyOrders();
            } catch (oErr) {
                console.warn('API getOrders fallback to sample data', oErr);
            }

            // If database is empty or has no products/orders, use rich sample data
            if (!products || products.length === 0 || !orders || orders.length === 0) {
                const sample = generateSampleData(products || []);
                products = products && products.length > 0 ? products : sample.sampleProducts;
                orders = orders && orders.length > 0 ? orders : sample.sampleOrders;
            }

            setRawProducts(products);
            setRawOrders(orders);
        } catch (error) {
            console.error('Failed to load dashboard data', error);
            const sample = generateSampleData([]);
            setRawProducts(sample.sampleProducts);
            setRawOrders(sample.sampleOrders);
        } finally {
            setLoading(false);
        }
    };

    // Calculate computed metrics reactively based on active date filter
    const metrics = computeDashboardMetrics(
        rawProducts,
        rawOrders,
        dateFilter,
        customStart,
        customEnd
    );

    const {
        salesMetrics,
        productSales,
        stockStatus,
        deliveryMetrics,
        deliveryTableData,
        chartData
    } = metrics;

    // Filter delivery table rows if status filter applied (Admin)
    const filteredDeliveryTable = deliveryTableData.filter(d => {
        if (deliveryStatusFilter === 'ALL') return true;
        if (deliveryStatusFilter === 'On-Time') return d.onTimeStatus === 'On-Time';
        if (deliveryStatusFilter === 'Late') return d.onTimeStatus === 'Late';
        return d.deliveryStatus === deliveryStatusFilter;
    });

    // Customer notifications
    const notifications = deriveNotificationsFromOrders(rawOrders, username);
    const unreadNotifications = notifications.filter(n => !n.isRead);

    // Customer Orders Categorization
    const activeOrders = rawOrders.filter(o =>
        ['Pending', 'Processing', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delayed'].includes(o.status)
    );
    const completedOrders = rawOrders.filter(o =>
        ['Delivered', 'Cancelled'].includes(o.status)
    );

    // Customer Order History calculation
    const totalSpent = rawOrders
        .filter(o => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);

    // Filtered Order History
    const filteredOrderHistory = rawOrders.filter(o => {
        const prodName = o.product?.name || '';
        const ordId = o.orderId || o._id || '';
        const matchesSearch = prodName.toLowerCase().includes(historySearch.toLowerCase()) ||
            ordId.toLowerCase().includes(historySearch.toLowerCase());
        const matchesStatus = historyStatusFilter === 'ALL' || o.status === historyStatusFilter;
        return matchesSearch && matchesStatus;
    });

    // Filtered Catalog
    const categories = [...new Set(rawProducts.map(p => p.category).filter(Boolean))];
    const filteredCatalog = rawProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
            (p.productId && p.productId.toLowerCase().includes(catalogSearch.toLowerCase()));
        const matchesCategory = catalogCategoryFilter === '' || p.category === catalogCategoryFilter;
        return matchesSearch && matchesCategory;
    });

    // Handlers
    const handlePlaceOrderSubmit = async (productId, quantity, note) => {
        setIsSubmittingOrder(true);
        try {
            await placeOrder(productId, quantity, note);
            setActionMsg({ type: 'success', text: '✅ Order placed successfully! You can track its live delivery status below.' });
            setModalOrderProduct(null);
            loadDashboardData();
        } catch (err) {
            setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to place order' });
        } finally {
            setIsSubmittingOrder(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        try {
            await cancelOrder(orderId);
            setActionMsg({ type: 'success', text: 'Order cancelled successfully and inventory restored.' });
            loadDashboardData();
        } catch (err) {
            setActionMsg({ type: 'error', text: err.response?.data?.message || 'Failed to cancel order' });
        }
    };

    const formatDate = (dStr) => {
        if (!dStr) return '—';
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatDateTime = (dStr) => {
        if (!dStr) return '—';
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return '—';
        return d.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
                <RefreshCw size={28} style={{ marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
                <p>Loading dashboard data...</p>
            </div>
        );
    }

    // =========================================================================
    // RENDER: CUSTOMER / USER DASHBOARD VIEW
    // =========================================================================
    const renderCustomerDashboard = () => {
        return (
            <div className="customer-dashboard-container">
                {/* Header Welcome Banner */}
                <div className="customer-welcome-banner">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div className="user-avatar-circle">
                            👤
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#1e293b' }}>
                                Welcome back, {username}!
                            </h2>
                            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                                Track your live orders, browse product availability, and manage your purchase history.
                            </p>
                        </div>
                    </div>

                    {/* Action message banner */}
                    {actionMsg && (
                        <div style={{
                            marginTop: '12px',
                            padding: '10px 16px',
                            borderRadius: '6px',
                            background: actionMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                            color: actionMsg.type === 'success' ? '#15803d' : '#b91c1c',
                            fontSize: '0.88rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>{actionMsg.text}</span>
                            <button
                                onClick={() => setActionMsg(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>

                {/* Customer Top KPI Summary Cards */}
                <div className="card-container" style={{ marginBottom: '20px' }}>
                    <div className="kpi-card" onClick={() => setCustomerTab('orders')} style={{ cursor: 'pointer' }}>
                        <div className="kpi-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <Truck size={24} />
                        </div>
                        <div className="kpi-content">
                            <div className="kpi-label">Active Orders</div>
                            <div className="kpi-val" style={{ color: '#2563eb' }}>{activeOrders.length}</div>
                            <div className="kpi-subtext">In progress / transit</div>
                        </div>
                    </div>

                    <div className="kpi-card" onClick={() => setCustomerTab('history')} style={{ cursor: 'pointer' }}>
                        <div className="kpi-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                            <CheckCheck size={24} />
                        </div>
                        <div className="kpi-content">
                            <div className="kpi-label">Delivered Purchases</div>
                            <div className="kpi-val" style={{ color: '#16a34a' }}>
                                {rawOrders.filter(o => o.status === 'Delivered').length}
                            </div>
                            <div className="kpi-subtext">Successfully received</div>
                        </div>
                    </div>

                    <div className="kpi-card" onClick={() => setCustomerTab('history')} style={{ cursor: 'pointer' }}>
                        <div className="kpi-icon-box" style={{ background: '#faf5ff', color: '#9333ea' }}>
                            <DollarSign size={24} />
                        </div>
                        <div className="kpi-content">
                            <div className="kpi-label">Total Spend</div>
                            <div className="kpi-val" style={{ color: '#9333ea' }}>
                                ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="kpi-subtext">Across {rawOrders.length} orders</div>
                        </div>
                    </div>

                    <div className="kpi-card" onClick={() => setCustomerTab('notifications')} style={{ cursor: 'pointer' }}>
                        <div className="kpi-icon-box" style={{ background: '#fffbeb', color: '#d97706' }}>
                            <Bell size={24} />
                        </div>
                        <div className="kpi-content">
                            <div className="kpi-label">Order Notifications</div>
                            <div className="kpi-val" style={{ color: '#d97706' }}>
                                {unreadNotifications.length}
                            </div>
                            <div className="kpi-subtext">{notifications.length} total updates</div>
                        </div>
                    </div>
                </div>

                {/* Main Navigation Tabs */}
                <div className="customer-tabs-bar">
                    <button
                        type="button"
                        className={`customer-tab-btn ${customerTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setCustomerTab('orders')}
                    >
                        <Truck size={17} /> 1. My Orders & Delivery Tracking ({activeOrders.length})
                    </button>
                    <button
                        type="button"
                        className={`customer-tab-btn ${customerTab === 'history' ? 'active' : ''}`}
                        onClick={() => setCustomerTab('history')}
                    >
                        <CheckCheck size={17} /> 2. Order History ({rawOrders.length})
                    </button>
                    <button
                        type="button"
                        className={`customer-tab-btn ${customerTab === 'catalog' ? 'active' : ''}`}
                        onClick={() => setCustomerTab('catalog')}
                    >
                        <Package size={17} /> 3. Product Availability & Catalog ({rawProducts.length})
                    </button>
                    <button
                        type="button"
                        className={`customer-tab-btn ${customerTab === 'notifications' ? 'active' : ''}`}
                        onClick={() => setCustomerTab('notifications')}
                    >
                        <Bell size={17} /> 4. Notifications {unreadNotifications.length > 0 && `(${unreadNotifications.length})`}
                    </button>
                </div>

                {/* TAB CONTENT: 1. MY ORDERS & DELIVERY TRACKING */}
                {customerTab === 'orders' && (
                    <div className="dashboard-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                                <div className="section-title">
                                    <Truck size={22} color="#2563eb" /> My Active Orders & Delivery Tracking
                                </div>
                                <div className="section-subtitle">
                                    Real-time progress milestone tracking from order confirmation to doorstep delivery.
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => setCustomerTab('catalog')}
                            >
                                <ShoppingCart size={16} /> Place New Order
                            </button>
                        </div>

                        {activeOrders.length === 0 ? (
                            <div className="empty-order-box">
                                <ShoppingBag size={48} style={{ color: '#94a3b8', opacity: 0.5, marginBottom: '12px' }} />
                                <h3 style={{ color: '#334155', margin: 0 }}>No active orders currently in transit</h3>
                                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '6px' }}>
                                    All your previous orders have been completed or you haven't placed an order yet.
                                </p>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setCustomerTab('catalog')}
                                    style={{ marginTop: '12px' }}
                                >
                                    Browse Available Products
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {activeOrders.map(order => {
                                    const prod = order.product || {};
                                    const prodImg = prod.imageUrl || `https://picsum.photos/seed/${prod.productId || 'ord'}/200/200`;
                                    const isDelayed = order.status === 'Delayed';
                                    const canCancel = order.status === 'Pending' || order.status === 'Processing';

                                    return (
                                        <div key={order._id || order.orderId} className="customer-order-card">
                                            {/* Order Card Top Bar */}
                                            <div className="order-card-header">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                                    <span className="order-id-badge">
                                                        {order.orderId || `#ORD-${order._id?.toString().slice(-4).toUpperCase()}`}
                                                    </span>
                                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                        Placed on: <strong>{formatDate(order.orderDate || order.createdAt)}</strong>
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span className={`status-badge-pill ${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                        {order.status === 'Delayed' && <AlertTriangle size={13} style={{ marginRight: '4px' }} />}
                                                        {order.status}
                                                    </span>
                                                    {canCancel && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger"
                                                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                                            onClick={() => handleCancelOrder(order._id)}
                                                        >
                                                            Cancel Order
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Order Details & Product Summary */}
                                            <div className="order-card-body">
                                                <div className="order-product-info">
                                                    <img
                                                        src={prodImg}
                                                        alt={prod.name}
                                                        className="order-product-thumb"
                                                        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200'; }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#1e293b' }}>
                                                            {prod.name || 'Product'}
                                                        </h3>
                                                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '6px' }}>
                                                            SKU: <strong>{prod.productId || 'N/A'}</strong> · Category: {prod.category || 'General'}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '16px', fontSize: '0.88rem', color: '#334155' }}>
                                                            <div>Quantity: <strong>{order.quantity}</strong></div>
                                                            <div>Unit Price: <strong>${Number(prod.price || 0).toFixed(2)}</strong></div>
                                                            <div style={{ color: '#2563eb', fontWeight: 700 }}>
                                                                Total: ${Number(order.totalPrice || (order.quantity * (prod.price || 0))).toFixed(2)}
                                                            </div>
                                                        </div>
                                                        {order.note && (
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                                                                Note: "{order.note}"
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Feature 2: Delivery Tracking Stepper Component */}
                                                <div style={{ marginTop: '16px' }}>
                                                    <DeliveryTimeline order={order} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB CONTENT: 2. ORDER HISTORY (Feature 5) */}
                {customerTab === 'history' && (
                    <div className="dashboard-section">
                        <div className="section-title">
                            <CheckCheck size={22} color="#16a34a" /> Purchase & Order History
                        </div>
                        <div className="section-subtitle">
                            View all past orders, total spending, delivered items, and fulfillment history.
                        </div>

                        {/* Search and Filters for History */}
                        <div className="history-filter-bar">
                            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder="Search past purchases by Product or Order ID..."
                                    className="search-box"
                                    style={{ width: '100%', paddingLeft: '32px' }}
                                    value={historySearch}
                                    onChange={e => setHistorySearch(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Filter size={15} color="#64748b" />
                                <select
                                    value={historyStatusFilter}
                                    onChange={e => setHistoryStatusFilter(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="Delivered">Delivered Only</option>
                                    <option value="Cancelled">Cancelled Only</option>
                                    <option value="Shipped">Shipped / In Transit</option>
                                    <option value="Delayed">Delayed Only</option>
                                </select>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="table-container" style={{ marginTop: '10px' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Product Name</th>
                                        <th>Order Date</th>
                                        <th>Quantity</th>
                                        <th>Total Amount</th>
                                        <th>Delivery Status</th>
                                        <th>Delivery Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrderHistory.map(row => {
                                        const prod = row.product || {};
                                        const isDelivered = row.status === 'Delivered';
                                        const isCancelled = row.status === 'Cancelled';
                                        const isDelayed = row.status === 'Delayed';

                                        return (
                                            <tr key={row._id || row.orderId}>
                                                <td style={{ fontWeight: 700, color: '#1e293b' }}>
                                                    {row.orderId || `#ORD-${row._id?.toString().slice(-4).toUpperCase()}`}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <img
                                                            src={prod.imageUrl || `https://picsum.photos/seed/${prod.productId || 'thumb'}/50/50`}
                                                            alt={prod.name}
                                                            style={{ width: '38px', height: '38px', borderRadius: '4px', objectFit: 'cover' }}
                                                            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100'; }}
                                                        />
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{prod.name || 'Product'}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{prod.category}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                    {formatDate(row.orderDate || row.createdAt)}
                                                </td>
                                                <td style={{ fontWeight: 600 }}>{row.quantity}</td>
                                                <td style={{ fontWeight: 700, color: '#2563eb' }}>
                                                    ${Number(row.totalPrice || (row.quantity * (prod.price || 0))).toFixed(2)}
                                                </td>
                                                <td>
                                                    <span className={`status-badge-pill ${row.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                        {isDelayed && <AlertTriangle size={12} style={{ marginRight: '3px' }} />}
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: isDelivered ? '#16a34a' : '#64748b' }}>
                                                    {isDelivered
                                                        ? (formatDate(row.actualDeliveryDate || row.actualDeliveryTime) || 'Delivered')
                                                        : isCancelled
                                                        ? <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Cancelled</span>
                                                        : isDelayed && row.updatedExpectedDeliveryDate
                                                        ? <span style={{ color: '#d97706', fontWeight: 600 }}>New: {formatDate(row.updatedExpectedDeliveryDate)}</span>
                                                        : (formatDate(row.expectedDeliveryDate || row.expectedDeliveryTime) || 'Estimated')}
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary"
                                                        style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                                        onClick={() => setModalTrackingOrder(row)}
                                                        title="View full delivery timeline"
                                                    >
                                                        <Truck size={13} /> Track
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredOrderHistory.length === 0 && (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                                No orders match your filter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: 3. PRODUCT AVAILABILITY & CATALOG (Feature 4) */}
                {customerTab === 'catalog' && (
                    <div className="dashboard-section">
                        <div className="section-title">
                            <Package size={22} color="#059669" /> Product Availability & Store Catalog
                        </div>
                        <div className="section-subtitle">
                            Check real-time stock levels (Available Stock, Low Stock, Out of Stock) and place orders with quantity validation.
                        </div>

                        {/* Search & Category Filter Bar */}
                        <div className="history-filter-bar">
                            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                <input
                                    type="text"
                                    placeholder="Search products by name or SKU..."
                                    className="search-box"
                                    style={{ width: '100%', paddingLeft: '32px' }}
                                    value={catalogSearch}
                                    onChange={e => setCatalogSearch(e.target.value)}
                                />
                            </div>
                            <select
                                value={catalogCategoryFilter}
                                onChange={e => setCatalogCategoryFilter(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Product Cards Grid with Strict Stock Availability Indicators */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: '20px',
                            marginTop: '12px'
                        }}>
                            {filteredCatalog.map(product => {
                                const qty = product.quantity !== undefined ? product.quantity : 0;
                                const minStock = product.minStockLevel || 10;
                                const isOut = qty <= 0;
                                const isLow = qty > 0 && qty <= minStock;
                                const imgSrc = product.imageUrl || `https://picsum.photos/seed/${product.productId || 'p'}/400/240`;

                                return (
                                    <div key={product._id || product.productId} className="catalog-product-card">
                                        {/* Image Container with Badges */}
                                        <div className="catalog-img-wrapper">
                                            <img
                                                src={imgSrc}
                                                alt={product.name}
                                                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'; }}
                                            />
                                            {/* Stock Availability Badge */}
                                            {isOut ? (
                                                <span className="stock-pill out">
                                                    <AlertCircle size={12} /> Out of Stock
                                                </span>
                                            ) : isLow ? (
                                                <span className="stock-pill low">
                                                    <AlertTriangle size={12} /> Low Stock ({qty} left)
                                                </span>
                                            ) : (
                                                <span className="stock-pill ok">
                                                    <CheckCircle2 size={12} /> In Stock ({qty})
                                                </span>
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="catalog-card-body">
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {product.category || 'General'} · {product.productId}
                                            </div>
                                            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1e293b', margin: '4px 0' }}>
                                                {product.name}
                                            </div>

                                            {/* Availability Stock Counter */}
                                            <div className="stock-count-indicator">
                                                <span>Available Stock:</span>
                                                <strong style={{ color: isOut ? '#dc2626' : isLow ? '#d97706' : '#16a34a' }}>
                                                    {isOut ? '0 units' : `${qty} units`}
                                                </strong>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px' }}>
                                                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#2563eb' }}>
                                                    ${Number(product.price || 0).toFixed(2)}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    disabled={isOut}
                                                    onClick={() => setModalOrderProduct(product)}
                                                    style={{
                                                        padding: '8px 14px',
                                                        fontSize: '0.85rem',
                                                        opacity: isOut ? 0.6 : 1,
                                                        cursor: isOut ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    <ShoppingCart size={15} />
                                                    {isOut ? 'Out of Stock' : 'Order Now'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredCatalog.length === 0 && (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    No products found for your search.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: 4. NOTIFICATIONS (Feature 6) */}
                {customerTab === 'notifications' && (
                    <div className="dashboard-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                                <div className="section-title">
                                    <Bell size={22} color="#d97706" /> Delivery Notifications & Updates
                                </div>
                                <div className="section-subtitle">
                                    Alerts for Order Confirmed, Order Shipped, Out for Delivery, Delivered, and Delivery Delays.
                                </div>
                            </div>
                            {unreadNotifications.length > 0 && (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                    onClick={() => {
                                        markAllNotificationsRead(username, notifications.map(n => n.id));
                                        loadDashboardData();
                                    }}
                                >
                                    <Check size={15} /> Mark All as Read
                                </button>
                            )}
                        </div>

                        <div className="notifications-feed-container">
                            {notifications.map(notif => {
                                const isDelayed = notif.type === 'delayed';
                                const isDelivered = notif.type === 'delivered';
                                const isOut = notif.type === 'out_for_delivery';
                                const isShipped = notif.type === 'shipped';

                                return (
                                    <div
                                        key={notif.id}
                                        className={`notification-feed-card ${!notif.isRead ? 'unread' : ''}`}
                                        onClick={() => {
                                            if (!notif.isRead) {
                                                markNotificationRead(username, notif.id);
                                            }
                                            if (notif.order) {
                                                setModalTrackingOrder(notif.order);
                                            }
                                        }}
                                    >
                                        <div className={`notif-feed-icon ${notif.type}`}>
                                            {isDelayed && <AlertTriangle size={20} />}
                                            {isDelivered && <CheckCheck size={20} />}
                                            {isOut && <MapPin size={20} />}
                                            {isShipped && <Truck size={20} />}
                                            {!isDelayed && !isDelivered && !isOut && !isShipped && <CheckCircle2 size={20} />}
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                                <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#1e293b' }}>
                                                    {notif.title}
                                                </h4>
                                                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                                    {formatDateTime(notif.timestamp)}
                                                </span>
                                            </div>
                                            <p style={{ margin: '4px 0 8px 0', fontSize: '0.88rem', color: '#475569', lineHeight: 1.4 }}>
                                                {notif.message}
                                            </p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className={`status-badge-pill ${notif.type.replace(/_/g, '-')}`}>
                                                    {notif.type.replace(/_/g, ' ')}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                                                    Click to view live delivery timeline →
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {notifications.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                                    <Bell size={40} style={{ opacity: 0.4, marginBottom: '8px' }} />
                                    <p>No notifications available yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // =========================================================================
    // RENDER: ADMIN ANALYTICS VIEW (Preserves all existing features completely)
    // =========================================================================
    const renderAdminDashboard = () => {
        const filterLabels = {
            Today: 'Today',
            Yesterday: 'Yesterday',
            'Last 7 Days': 'Last 7 Days',
            'This Month': 'This Month',
            'Custom Date': 'Custom Range'
        };
        const activePeriodName = filterLabels[dateFilter] || dateFilter;

        return (
            <div className="dashboard-container">
                {/* Top Bar: Title & Date Filter */}
                <div className="dashboard-header-bar">
                    <div>
                        <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.6rem' }}>Admin Dashboard</h2>
                        <div style={{ fontSize: '0.88rem', color: '#7f8c8d', marginTop: '4px' }}>
                            Overview & Real-time analytics for <strong>{activePeriodName}</strong>
                        </div>
                    </div>

                    {/* Date Filter */}
                    <div className="date-filter-group">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: '#64748b', paddingLeft: '6px', fontWeight: 600 }}>
                            <Calendar size={15} /> Period:
                        </span>
                        {['Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Custom Date'].map(f => (
                            <button
                                key={f}
                                type="button"
                                className={`date-pill-btn ${dateFilter === f ? 'active' : ''}`}
                                onClick={() => setDateFilter(f)}
                            >
                                {f}
                            </button>
                        ))}

                        {dateFilter === 'Custom Date' && (
                            <div className="custom-date-inputs">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={e => setCustomStart(e.target.value)}
                                    aria-label="Start date"
                                />
                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>to</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={e => setCustomEnd(e.target.value)}
                                    aria-label="End date"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* SECTION 1: Daily Sales Analytics                                          */}
                {/* ========================================================================= */}
                <div className="dashboard-section">
                    <div>
                        <div className="section-title">
                            <TrendingUp size={22} color="#3498db" /> Daily Sales Analysis
                        </div>
                        <div className="section-subtitle">
                            Sales volume, units sold, and revenue performance for {activePeriodName.toLowerCase()}
                        </div>
                    </div>

                    {/* Daily Sales KPI Cards */}
                    <div className="card-container" style={{ marginBottom: 0 }}>
                        <div className="card" style={{ borderLeft: '4px solid #3498db', alignItems: 'flex-start', padding: '18px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.9rem', color: '#7f8c8d', fontWeight: 600 }}>Total Sales ({activePeriodName})</span>
                                <ShoppingCart size={20} color="#3498db" />
                            </div>
                            <p style={{ margin: 0, fontSize: '2rem', color: '#2c3e50' }}>{salesMetrics.totalSales}</p>
                            <span style={{ fontSize: '0.78rem', color: '#95a5a6', marginTop: '4px' }}>Completed transactions</span>
                        </div>

                        <div className="card" style={{ borderLeft: '4px solid #2ecc71', alignItems: 'flex-start', padding: '18px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.9rem', color: '#7f8c8d', fontWeight: 600 }}>Products Sold ({activePeriodName})</span>
                                <Package size={20} color="#2ecc71" />
                            </div>
                            <p style={{ margin: 0, fontSize: '2rem', color: '#27ae60' }}>{salesMetrics.productsSold}</p>
                            <span style={{ fontSize: '0.78rem', color: '#95a5a6', marginTop: '4px' }}>Total units moved</span>
                        </div>

                        <div className="card" style={{ borderLeft: '4px solid #9b59b6', alignItems: 'flex-start', padding: '18px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.9rem', color: '#7f8c8d', fontWeight: 600 }}>Total Revenue ({activePeriodName})</span>
                                <DollarSign size={20} color="#9b59b6" />
                            </div>
                            <p style={{ margin: 0, fontSize: '2rem', color: '#8e44ad' }}>
                                ${salesMetrics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <span style={{ fontSize: '0.78rem', color: '#95a5a6', marginTop: '4px' }}>Gross sales revenue</span>
                        </div>
                    </div>

                    {/* Sales Chart Container */}
                    <div className="table-container" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <TrendingUp size={18} color="#3498db" /> {activePeriodName} Sales Trend Chart
                            </h3>
                            <span style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                                Hover over bars for detailed revenue and unit breakdowns
                            </span>
                        </div>
                        <DailySalesChart
                            chartData={chartData}
                            periodLabel={activePeriodName}
                            metricType={chartMetric}
                            setMetricType={setChartMetric}
                        />
                    </div>

                    {/* Product-wise Sales Table */}
                    <div className="table-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#2c3e50' }}>Product-wise Sales & Stock Flow</h3>
                            <span style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                                💡 Click any product name to inspect complete details
                            </span>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product Name</th>
                                    <th>Product ID</th>
                                    <th>Price</th>
                                    <th>Opening Stock</th>
                                    <th>Sold Qty</th>
                                    <th>Remaining Stock</th>
                                    <th>Revenue</th>
                                    <th>Stock Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productSales.map(item => {
                                    const statusClass = item.status === 'In Stock' ? 'ok' : item.status === 'Low Stock' ? 'low' : 'out';
                                    return (
                                        <tr key={item._id || item.productId}>
                                            <td>
                                                <span
                                                    className="clickable-product-cell"
                                                    onClick={() => setSelectedProduct(item)}
                                                    title="Click to view product details"
                                                >
                                                    {item.name}
                                                </span>
                                            </td>
                                            <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{item.productId}</td>
                                            <td>${item.price.toFixed(2)}</td>
                                            <td style={{ fontWeight: '600', color: '#555' }}>{item.openingStock}</td>
                                            <td>
                                                <span style={{
                                                    fontWeight: 'bold',
                                                    color: item.soldQty > 0 ? '#27ae60' : '#95a5a6'
                                                }}>
                                                    {item.soldQty}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 'bold' }}>{item.remainingStock}</td>
                                            <td style={{ fontWeight: '600', color: '#2c3e50' }}>
                                                ${item.revenue.toFixed(2)}
                                            </td>
                                            <td>
                                                <span className={`badge ${statusClass}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {productSales.length === 0 && (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', color: '#95a5a6', padding: '24px' }}>
                                            No product sales records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* SECTION 2: Stock Availability / Stock Status                              */}
                {/* ========================================================================= */}
                <div className="dashboard-section">
                    <div>
                        <div className="section-title">
                            <Package size={22} color="#f39c12" /> Stock Status
                        </div>
                        <div className="section-subtitle">
                            Inventory availability, low stock alerts, and replenishment status
                        </div>
                    </div>

                    {/* Stock Status KPI Cards */}
                    <div className="card-container" style={{ marginBottom: 0 }}>
                        <div className="card">
                            <h3>Total Products</h3>
                            <p>{stockStatus.totalProducts}</p>
                            <span style={{ fontSize: '0.78rem', color: '#95a5a6', marginTop: '4px' }}>Active inventory items</span>
                        </div>
                        <div className="card">
                            <h3>Available Stock</h3>
                            <p>{stockStatus.availableStock}</p>
                            <span style={{ fontSize: '0.78rem', color: '#95a5a6', marginTop: '4px' }}>Total units across all items</span>
                        </div>
                        <div className="card" style={{ borderLeft: '4px solid #f39c12' }}>
                            <h3>Low Stock</h3>
                            <p style={{ color: '#d35400' }}>{stockStatus.lowStockProducts.length}</p>
                            <span style={{ fontSize: '0.78rem', color: '#e67e22', marginTop: '4px' }}>Below minimum threshold</span>
                        </div>
                        <div className="card" style={{ borderLeft: '4px solid #e74c3c' }}>
                            <h3>Out of Stock</h3>
                            <p style={{ color: '#c0392b' }}>{stockStatus.outOfStockProducts.length}</p>
                            <span style={{ fontSize: '0.78rem', color: '#e74c3c', marginTop: '4px' }}>Immediate reorder required</span>
                        </div>
                    </div>

                    {/* Low Stock & Out of Stock Tables */}
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div className="table-container" style={{ flex: 1, minWidth: '300px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h3 style={{ margin: 0, color: '#d35400', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertTriangle size={18} /> Low Stock Products
                                </h3>
                                <span className="badge low">{stockStatus.lowStockProducts.length} items</span>
                            </div>
                            <table style={{ marginTop: '10px' }}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Quantity</th>
                                        <th>Min Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockStatus.lowStockProducts.map(p => (
                                        <tr key={p._id || p.productId}>
                                            <td>
                                                <span
                                                    className="clickable-product-cell"
                                                    onClick={() => setSelectedProduct(p)}
                                                >
                                                    {p.name}
                                                </span>
                                            </td>
                                            <td><span className="badge low">{p.quantity}</span></td>
                                            <td>{p.minStockLevel || 10}</td>
                                        </tr>
                                    ))}
                                    {stockStatus.lowStockProducts.length === 0 && (
                                        <tr><td colSpan="3" style={{ textAlign: 'center', color: '#95a5a6' }}>No low stock items</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="table-container" style={{ flex: 1, minWidth: '300px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <h3 style={{ margin: 0, color: '#c0392b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <XCircle size={18} /> Out of Stock Products
                                </h3>
                                <span className="badge out">{stockStatus.outOfStockProducts.length} items</span>
                            </div>
                            <table style={{ marginTop: '10px' }}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockStatus.outOfStockProducts.map(p => (
                                        <tr key={p._id || p.productId}>
                                            <td>
                                                <span
                                                    className="clickable-product-cell"
                                                    onClick={() => setSelectedProduct(p)}
                                                >
                                                    {p.name}
                                                </span>
                                            </td>
                                            <td>{p.category || 'General'}</td>
                                            <td><span className="badge out">Out of Stock</span></td>
                                        </tr>
                                    ))}
                                    {stockStatus.outOfStockProducts.length === 0 && (
                                        <tr><td colSpan="3" style={{ textAlign: 'center', color: '#95a5a6' }}>No out of stock items</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ========================================================================= */}
                {/* SECTION 3: Delivery Tracking / Delivery Analysis                          */}
                {/* ========================================================================= */}
                <div className="dashboard-section">
                    <div>
                        <div className="section-title">
                            <Truck size={22} color="#27ae60" /> Delivery Analysis
                        </div>
                        <div className="section-subtitle">
                            Order fulfillment speed, delivery statuses, and on-time vs late metrics for {activePeriodName.toLowerCase()}
                        </div>
                    </div>

                    {/* Delivery KPI Summary Cards */}
                    <div className="card-container" style={{
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        marginBottom: 0
                    }}>
                        <div className="card" style={{ borderLeft: '4px solid #3498db', alignItems: 'flex-start', padding: '16px' }}>
                            <h3 style={{ fontSize: '0.85rem' }}>Total Orders</h3>
                            <p style={{ fontSize: '1.8rem', margin: '4px 0' }}>{deliveryMetrics.totalOrders}</p>
                            <span style={{ fontSize: '0.75rem', color: '#95a5a6' }}>All placed orders</span>
                        </div>

                        <div className="card" style={{ borderLeft: '4px solid #2ecc71', alignItems: 'flex-start', padding: '16px' }}>
                            <h3 style={{ fontSize: '0.85rem' }}>Delivered</h3>
                            <p style={{ fontSize: '1.8rem', color: '#27ae60', margin: '4px 0' }}>{deliveryMetrics.deliveredOrders}</p>
                            <span style={{ fontSize: '0.75rem', color: '#27ae60' }}>
                                {deliveryMetrics.totalOrders > 0
                                    ? `${Math.round((deliveryMetrics.deliveredOrders / deliveryMetrics.totalOrders) * 100)}% completion`
                                    : '0% completion'}
                            </span>
                        </div>

                        <div className="card" style={{ borderLeft: '4px solid #f39c12', alignItems: 'flex-start', padding: '16px' }}>
                            <h3 style={{ fontSize: '0.85rem' }}>Pending / In Transit</h3>
                            <p style={{ fontSize: '1.8rem', color: '#d35400', margin: '4px 0' }}>{deliveryMetrics.pendingOrders}</p>
                            <span style={{ fontSize: '0.75rem', color: '#95a5a6' }}>Processing & transit</span>
                        </div>

                        <div className="card" style={{ borderLeft: '4px solid #e74c3c', alignItems: 'flex-start', padding: '16px' }}>
                            <h3 style={{ fontSize: '0.85rem' }}>Delayed</h3>
                            <p style={{ fontSize: '1.8rem', color: '#c0392b', margin: '4px 0' }}>{deliveryMetrics.delayedOrders || 0}</p>
                            <span style={{ fontSize: '0.75rem', color: '#e74c3c' }}>Delayed transit</span>
                        </div>

                        <div className="card" style={{ borderLeft: '4px solid #95a5a6', alignItems: 'flex-start', padding: '16px' }}>
                            <h3 style={{ fontSize: '0.85rem' }}>Cancelled</h3>
                            <p style={{ fontSize: '1.8rem', color: '#7f8c8d', margin: '4px 0' }}>{deliveryMetrics.cancelledOrders}</p>
                            <span style={{ fontSize: '0.75rem', color: '#95a5a6' }}>Cancelled orders</span>
                        </div>

                        <div className="card" style={{ borderLeft: '4px solid #27ae60', alignItems: 'flex-start', padding: '16px' }}>
                            <h3 style={{ fontSize: '0.85rem' }}>On-Time</h3>
                            <p style={{ fontSize: '1.8rem', color: '#2ecc71', margin: '4px 0' }}>{deliveryMetrics.onTimeDeliveries}</p>
                            <span style={{ fontSize: '0.75rem', color: '#27ae60' }}>Met expected time</span>
                        </div>

                        <div className="card" style={{ borderLeft: '4px solid #c0392b', alignItems: 'flex-start', padding: '16px' }}>
                            <h3 style={{ fontSize: '0.85rem' }}>Late Deliveries</h3>
                            <p style={{ fontSize: '1.8rem', color: '#c0392b', margin: '4px 0' }}>{deliveryMetrics.lateDeliveries}</p>
                            <span style={{ fontSize: '0.75rem', color: '#e74c3c' }}>Delayed fulfillment</span>
                        </div>
                    </div>

                    {/* Delivery Tracking Table */}
                    <div className="table-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Truck size={18} color="#27ae60" /> Delivery Tracking Log ({filteredDeliveryTable.length} records)
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Filter size={15} color="#64748b" />
                                <select
                                    value={deliveryStatusFilter}
                                    onChange={e => setDeliveryStatusFilter(e.target.value)}
                                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="Delivered">Delivered Only</option>
                                    <option value="Pending">Pending Only</option>
                                    <option value="Confirmed">Confirmed / In Transit</option>
                                    <option value="Delayed">Delayed Only</option>
                                    <option value="On-Time">On-Time Deliveries</option>
                                    <option value="Late">Late Deliveries</option>
                                    <option value="Cancelled">Cancelled Only</option>
                                </select>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Product</th>
                                    <th>Customer</th>
                                    <th>Order Date</th>
                                    <th>Expected Delivery Time</th>
                                    <th>Actual Delivery Time</th>
                                    <th>Delivery Status</th>
                                    <th>Tracking & Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDeliveryTable.map(row => {
                                    const prod = row.product || {};
                                    const isDelivered = row.deliveryStatus === 'Delivered';
                                    const isCancelled = row.deliveryStatus === 'Cancelled';
                                    const isLate = row.onTimeStatus === 'Late';

                                    return (
                                        <tr key={row._id || row.orderId}>
                                            <td style={{ fontWeight: '600', color: '#334155' }}>
                                                {row.orderId}
                                            </td>
                                            <td>
                                                <span
                                                    className="clickable-product-cell"
                                                    onClick={() => setSelectedProduct(prod)}
                                                    title="Click to view product details"
                                                >
                                                    {prod.name || 'Unnamed Product'}
                                                </span>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                    Qty: {row.quantity} (${row.totalPrice ? Number(row.totalPrice).toFixed(2) : '—'})
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ fontWeight: '500', color: '#475569' }}>
                                                    👤 {row.customer}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                {formatDate(row.orderDate)}
                                            </td>
                                            <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                {formatDate(row.expectedDeliveryTime)}
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>
                                                {isDelivered ? (
                                                    <span style={{ color: isLate ? '#c0392b' : '#27ae60', fontWeight: '500' }}>
                                                        {formatDate(row.actualDeliveryTime)}
                                                    </span>
                                                ) : isCancelled ? (
                                                    <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Cancelled</span>
                                                ) : (
                                                    <span style={{ color: '#d35400', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={13} /> In Transit
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`status-badge-pill ${row.deliveryStatus?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                    {row.deliveryStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                                    onClick={() => setModalTrackingOrder(row)}
                                                    title="Inspect delivery timeline stepper"
                                                >
                                                    <Truck size={13} /> View Timeline
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredDeliveryTable.length === 0 && (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', color: '#95a5a6', padding: '24px' }}>
                                            No delivery records for the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Admin Switcher Bar to toggle between Admin Analytics and Customer Store View */}
            {isAdmin && (
                <div className="admin-view-toggle-bar">
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                        👀 View Dashboard as:
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            type="button"
                            className={`admin-toggle-btn ${adminViewMode === 'admin' ? 'active' : ''}`}
                            onClick={() => setAdminViewMode('admin')}
                        >
                            📊 Admin Analytics & Inventory View
                        </button>
                        <button
                            type="button"
                            className={`admin-toggle-btn ${adminViewMode === 'customer' ? 'active' : ''}`}
                            onClick={() => setAdminViewMode('customer')}
                        >
                            🛍️ Customer Store & Order Tracking View
                        </button>
                    </div>
                </div>
            )}

            {/* Render view based on role or admin toggle */}
            {!isAdmin || adminViewMode === 'customer'
                ? renderCustomerDashboard()
                : renderAdminDashboard()}

            {/* Product Detail Modal */}
            {selectedProduct && (
                <ProductDetailModal
                    product={selectedProduct}
                    orders={rawOrders}
                    onClose={() => setSelectedProduct(null)}
                />
            )}

            {/* Customer Tracking or New Order Modal */}
            {(modalTrackingOrder || modalOrderProduct) && (
                <CustomerOrderModal
                    order={modalTrackingOrder}
                    productToOrder={modalOrderProduct}
                    isSubmitting={isSubmittingOrder}
                    onClose={() => {
                        setModalTrackingOrder(null);
                        setModalOrderProduct(null);
                    }}
                    onPlaceOrder={handlePlaceOrderSubmit}
                />
            )}
        </div>
    );
};

export default Dashboard;
