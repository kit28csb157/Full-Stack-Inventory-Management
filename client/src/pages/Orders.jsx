import React, { useEffect, useState } from 'react';
import {
    getMyOrders,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    getCurrentUser
} from '../services/api';
import { generateSampleData } from '../services/dashboardData';
import DeliveryTimeline from '../components/DeliveryTimeline';
import {
    ShoppingCart,
    Clock,
    CheckCircle2,
    Truck,
    XCircle,
    AlertTriangle,
    CheckCheck,
    Calendar,
    Filter,
    Search,
    Package,
    ArrowRight,
    MapPin,
    RotateCcw
} from 'lucide-react';

const statusList = [
    'Pending',
    'Processing',
    'Confirmed',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Delayed',
    'Cancelled'
];

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history' | 'all'
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [delayModalOrder, setDelayModalOrder] = useState(null);
    const [delayDate, setDelayDate] = useState('');
    const [delayReason, setDelayReason] = useState('');
    const [actionMsg, setActionMsg] = useState(null);

    const user = getCurrentUser();
    const isAdmin = user?.role === 'Admin';

    useEffect(() => {
        loadOrders();
    }, [isAdmin]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            let data = [];
            try {
                data = isAdmin ? await getAllOrders() : await getMyOrders();
            } catch (apiErr) {
                console.warn('Fallback to sample orders in Orders page', apiErr);
                const sample = generateSampleData([]);
                data = sample.sampleOrders;
            }
            if (!data || data.length === 0) {
                const sample = generateSampleData([]);
                data = sample.sampleOrders;
            }
            setOrders(data);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        if (newStatus === 'Delayed') {
            const targetOrder = orders.find(o => o._id === orderId);
            setDelayModalOrder(targetOrder);
            const d = new Date();
            d.setDate(d.getDate() + 3);
            setDelayDate(d.toISOString().split('T')[0]);
            setDelayReason('Transit delay due to weather or logistics routing');
            return;
        }

        try {
            await updateOrderStatus(orderId, { status: newStatus });
            setActionMsg({ type: 'success', text: `Order status updated to "${newStatus}"` });
            loadOrders();
        } catch (err) {
            setActionMsg({ type: 'error', text: 'Failed to update order status' });
        }
    };

    const handleConfirmDelay = async (e) => {
        e.preventDefault();
        if (!delayModalOrder) return;
        try {
            await updateOrderStatus(delayModalOrder._id, {
                status: 'Delayed',
                updatedExpectedDeliveryDate: delayDate,
                delayReason: delayReason
            });
            setActionMsg({ type: 'success', text: 'Order marked as Delayed with updated expected delivery date.' });
            setDelayModalOrder(null);
            loadOrders();
        } catch (err) {
            setActionMsg({ type: 'error', text: 'Failed to update delay' });
        }
    };

    const handleCancel = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        try {
            await cancelOrder(orderId);
            setActionMsg({ type: 'success', text: 'Order cancelled successfully.' });
            loadOrders();
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

    // Filter orders by tab and search
    const activeOrders = orders.filter(o =>
        ['Pending', 'Processing', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delayed'].includes(o.status)
    );
    const completedOrders = orders.filter(o =>
        ['Delivered', 'Cancelled'].includes(o.status)
    );

    const displayedOrders = orders.filter(order => {
        if (activeTab === 'active' && !['Pending', 'Processing', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delayed'].includes(order.status)) {
            return false;
        }
        if (activeTab === 'history' && !['Delivered', 'Cancelled'].includes(order.status)) {
            return false;
        }
        if (statusFilter !== 'ALL' && order.status !== statusFilter) {
            return false;
        }
        const prodName = order.product?.name || '';
        const orderId = order.orderId || order._id || '';
        const customer = order.user?.username || '';
        const matchesSearch = prodName.toLowerCase().includes(search.toLowerCase()) ||
            orderId.toLowerCase().includes(search.toLowerCase()) ||
            customer.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
                <Clock size={32} style={{ marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
                <p>Loading orders & delivery tracking...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div className="header-flex" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#1e293b' }}>
                        <ShoppingCart size={24} color="#2563eb" />
                        {isAdmin ? 'All Orders & Fulfillment' : 'My Orders & Delivery Tracking'}
                    </h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                        Track step-by-step milestones, view expected & actual delivery times, and manage purchases.
                    </p>
                </div>
                <span style={{ color: '#64748b', fontSize: '0.9rem', background: '#e2e8f0', padding: '4px 12px', borderRadius: '14px', fontWeight: 600 }}>
                    {orders.length} total order(s)
                </span>
            </div>

            {/* Action feedback message */}
            {actionMsg && (
                <div style={{
                    marginBottom: '16px',
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

            {/* Tabs for Active Orders vs Order History */}
            <div className="customer-tabs-bar" style={{ marginBottom: '16px' }}>
                <button
                    type="button"
                    className={`customer-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                    onClick={() => setActiveTab('active')}
                >
                    <Truck size={17} /> Active & In-Transit ({activeOrders.length})
                </button>
                <button
                    type="button"
                    className={`customer-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    <CheckCheck size={17} /> Order History & Completed ({completedOrders.length})
                </button>
                <button
                    type="button"
                    className={`customer-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    <Package size={17} /> All Orders ({orders.length})
                </button>
            </div>

            {/* Filter Bar */}
            <div className="history-filter-bar" style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search by Order ID, Product, or Customer..."
                        className="search-box"
                        style={{ width: '100%', paddingLeft: '32px' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={15} color="#64748b" />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                    >
                        <option value="ALL">All Statuses</option>
                        {statusList.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Orders List */}
            {displayedOrders.length === 0 ? (
                <div className="empty-order-box">
                    <ShoppingCart size={48} style={{ marginBottom: '12px', opacity: 0.3, color: '#64748b' }} />
                    <h3 style={{ margin: 0, color: '#334155' }}>No orders found</h3>
                    <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                        No orders match the selected tab or search criteria.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {displayedOrders.map(order => {
                        const prod = order.product || {};
                        const isDelivered = order.status === 'Delivered';
                        const isCancelled = order.status === 'Cancelled';
                        const isDelayed = order.status === 'Delayed';
                        const canCancel = (order.status === 'Pending' || order.status === 'Processing') && !isDelivered;
                        const prodImg = prod.imageUrl || `https://picsum.photos/seed/${prod.productId || 'ord'}/150/150`;

                        return (
                            <div key={order._id || order.orderId} className="customer-order-card">
                                {/* Order Top Header */}
                                <div className="order-card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                        <span className="order-id-badge">
                                            {order.orderId || `#ORD-${order._id?.toString().slice(-4).toUpperCase()}`}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            Ordered: <strong>{formatDate(order.orderDate || order.createdAt)}</strong>
                                        </span>
                                        {isAdmin && order.user && (
                                            <span style={{ fontSize: '0.85rem', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                                                👤 Customer: <strong>{order.user.username || order.user}</strong>
                                            </span>
                                        )}
                                    </div>

                                    {/* Status Badge and Actions */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <span className={`status-badge-pill ${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {isDelayed && <AlertTriangle size={13} style={{ marginRight: '4px' }} />}
                                            {order.status}
                                        </span>

                                        {/* Admin Status Management dropdown */}
                                        {isAdmin && order.status !== 'Cancelled' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Change:</span>
                                                <select
                                                    value={order.status}
                                                    onChange={e => handleStatusChange(order._id, e.target.value)}
                                                    style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #cbd5e1',
                                                        fontSize: '0.82rem',
                                                        cursor: 'pointer',
                                                        background: 'white'
                                                    }}
                                                >
                                                    {statusList.map(st => (
                                                        <option key={st} value={st}>{st}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {/* Customer cancel button for pending orders */}
                                        {canCancel && (
                                            <button
                                                onClick={() => handleCancel(order._id)}
                                                className="btn btn-danger"
                                                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                                            >
                                                Cancel Order
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Order Content */}
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
                                                {prod.name || 'Product Item'}
                                            </h3>
                                            <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '6px' }}>
                                                Product ID: <strong>{prod.productId || 'N/A'}</strong> · Category: {prod.category || 'General'}
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '0.88rem', color: '#334155', flexWrap: 'wrap' }}>
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

                                    {/* Delivery Tracking Stepper */}
                                    <div style={{ marginTop: '16px' }}>
                                        <DeliveryTimeline order={order} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delay Rescheduling Modal for Admin */}
            {delayModalOrder && (
                <div className="modal-overlay" onClick={() => setDelayModalOrder(null)}>
                    <div className="modal-content" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={20} color="#d97706" />
                                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b' }}>
                                    Mark Order as Delayed
                                </h3>
                            </div>
                            <button className="modal-close-btn" onClick={() => setDelayModalOrder(null)}>
                                <XCircle size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleConfirmDelay} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                                Update the expected delivery date and add a delay notification note for order{' '}
                                <strong>{delayModalOrder.orderId || delayModalOrder._id}</strong>.
                            </p>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                                    New Updated Expected Delivery Date:
                                </label>
                                <input
                                    type="date"
                                    value={delayDate}
                                    onChange={e => setDelayDate(e.target.value)}
                                    required
                                    style={{ padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                                    Delay Reason:
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Courier transit delay due to weather"
                                    value={delayReason}
                                    onChange={e => setDelayReason(e.target.value)}
                                    required
                                    style={{ padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    style={{ background: '#94a3b8', color: 'white' }}
                                    onClick={() => setDelayModalOrder(null)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-warning">
                                    Save Delay & Notify Customer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
