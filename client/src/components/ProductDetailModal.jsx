import React from 'react';
import { Link } from 'react-router-dom';
import { X, Package, DollarSign, Layers, ShoppingBag, Truck, CheckCircle2, Clock, XCircle, ExternalLink } from 'lucide-react';

const ProductDetailModal = ({ product, orders = [], onClose }) => {
    if (!product) return null;

    // Calculate product specific analytics from orders
    const productOrders = orders.filter(o => {
        const prodId = o.product?._id || o.product?.productId || o.product;
        return prodId === product._id || prodId === product.productId;
    });

    const soldQty = productOrders.reduce((sum, o) => (o.status !== 'Cancelled' ? sum + Number(o.quantity || 0) : sum), 0);
    const remainingQty = product.quantity !== undefined ? product.quantity : 0;
    const totalStock = product.totalStock !== undefined ? product.totalStock : (remainingQty + soldQty);
    const orderCount = productOrders.length;

    // Delivery status breakdown
    const deliveredCount = productOrders.filter(o => o.status === 'Delivered').length;
    const pendingCount = productOrders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').length;
    const cancelledCount = productOrders.filter(o => o.status === 'Cancelled').length;

    const statusType = remainingQty === 0 ? 'out' : remainingQty <= (product.minStockLevel || 10) ? 'low' : 'ok';
    const statusLabel = remainingQty === 0 ? 'Out of Stock' : remainingQty <= (product.minStockLevel || 10) ? 'Low Stock' : 'In Stock';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="modal-icon-badge">
                            <Package size={22} color="#3498db" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#2c3e50' }}>{product.name}</h3>
                            <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                                Product ID: <strong>{product.productId || product._id}</strong> · Category: {product.category || 'General'}
                            </span>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="modal-body">
                    {/* Status Banner */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: statusType === 'ok' ? '#eafaf1' : statusType === 'low' ? '#fef9e7' : '#fdedec',
                        marginBottom: '18px',
                        border: `1px solid ${statusType === 'ok' ? '#a9dfbf' : statusType === 'low' ? '#f9e79f' : '#f5b7b1'}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className={`badge ${statusType}`} style={{ fontSize: '0.85rem', padding: '5px 12px' }}>
                                {statusLabel}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: '#555' }}>
                                Min Stock Alert Level: <strong>{product.minStockLevel || 10} units</strong>
                            </span>
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c3e50' }}>
                            ${Number(product.price || 0).toFixed(2)}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="modal-stats-grid">
                        <div className="modal-stat-card">
                            <div className="stat-label">
                                <Layers size={15} color="#7f8c8d" /> Total Stock
                            </div>
                            <div className="stat-val">{totalStock}</div>
                            <div className="stat-sub">Opening / Capacity</div>
                        </div>

                        <div className="modal-stat-card">
                            <div className="stat-label">
                                <ShoppingBag size={15} color="#e67e22" /> Sold Quantity
                            </div>
                            <div className="stat-val" style={{ color: '#e67e22' }}>{soldQty}</div>
                            <div className="stat-sub">Units Sold</div>
                        </div>

                        <div className="modal-stat-card">
                            <div className="stat-label">
                                <Package size={15} color={statusType === 'ok' ? '#27ae60' : statusType === 'low' ? '#f39c12' : '#e74c3c'} /> Remaining Quantity
                            </div>
                            <div className="stat-val" style={{ color: statusType === 'ok' ? '#27ae60' : statusType === 'low' ? '#f39c12' : '#e74c3c' }}>
                                {remainingQty}
                            </div>
                            <div className="stat-sub">Currently in warehouse</div>
                        </div>

                        <div className="modal-stat-card">
                            <div className="stat-label">
                                <Truck size={15} color="#3498db" /> Number of Orders
                            </div>
                            <div className="stat-val" style={{ color: '#3498db' }}>{orderCount}</div>
                            <div className="stat-sub">Total Orders Placed</div>
                        </div>
                    </div>

                    {/* Delivery Status Section */}
                    <div style={{ marginTop: '20px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Truck size={16} /> Delivery Status Summary
                        </h4>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                            gap: '12px',
                            background: '#f8f9fa',
                            padding: '14px',
                            borderRadius: '8px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle2 size={18} color="#2ecc71" />
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: '#7f8c8d' }}>Delivered</div>
                                    <div style={{ fontWeight: 'bold', color: '#27ae60' }}>{deliveredCount} orders</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Clock size={18} color="#f39c12" />
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: '#7f8c8d' }}>In Progress / Pending</div>
                                    <div style={{ fontWeight: 'bold', color: '#d35400' }}>{pendingCount} orders</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <XCircle size={18} color="#e74c3c" />
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: '#7f8c8d' }}>Cancelled</div>
                                    <div style={{ fontWeight: 'bold', color: '#c0392b' }}>{cancelledCount} orders</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product Meta Info */}
                    {product.supplier && (
                        <div style={{ marginTop: '16px', fontSize: '0.85rem', color: '#666', background: '#fff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #eee' }}>
                            <strong>Supplier:</strong> {product.supplier} &nbsp;|&nbsp; <strong>Unit Price:</strong> ${Number(product.price).toFixed(2)}
                            {product.description && <div style={{ marginTop: '6px', color: '#777' }}>{product.description}</div>}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                    <button className="btn" style={{ background: '#95a5a6', color: 'white' }} onClick={onClose}>
                        Close
                    </button>
                    {product._id && (
                        <Link to={`/products/${product._id}`} className="btn btn-primary" onClick={onClose} style={{ textDecoration: 'none' }}>
                            <ExternalLink size={15} /> View Full Product Page
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;
