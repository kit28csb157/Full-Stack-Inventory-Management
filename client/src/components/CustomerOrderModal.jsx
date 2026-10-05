import React, { useState } from 'react';
import {
    X,
    ShoppingCart,
    Package,
    Truck,
    Clock,
    AlertCircle,
    CheckCircle2,
    Layers,
    DollarSign,
    Info
} from 'lucide-react';
import DeliveryTimeline from './DeliveryTimeline';

const CustomerOrderModal = ({
    order,
    productToOrder,
    onClose,
    onPlaceOrder,
    isSubmitting
}) => {
    // If order is passed -> Inspection/Tracking mode
    // If productToOrder is passed -> New Order Placement mode
    const [orderQty, setOrderQty] = useState(1);
    const [note, setNote] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    if (!order && !productToOrder) return null;

    const isTrackingMode = !!order;
    const currentProd = productToOrder || order?.product || {};

    const availableStock = currentProd.quantity !== undefined ? currentProd.quantity : 0;
    const isOutOfStock = availableStock <= 0;
    const isLowStock = availableStock > 0 && availableStock <= (currentProd.minStockLevel || 10);

    const handleQtyChange = (e) => {
        const val = parseInt(e.target.value, 10);
        setErrorMsg('');
        if (isNaN(val) || val < 1) {
            setOrderQty(1);
            return;
        }
        if (val > availableStock) {
            setOrderQty(availableStock);
            setErrorMsg(`Cannot exceed available stock of ${availableStock} units.`);
        } else {
            setOrderQty(val);
        }
    };

    const handleSubmitOrder = (e) => {
        e.preventDefault();
        if (isOutOfStock) {
            setErrorMsg('Product is currently out of stock.');
            return;
        }
        if (orderQty > availableStock) {
            setErrorMsg(`Available stock is only ${availableStock} unit(s).`);
            return;
        }
        if (onPlaceOrder) {
            onPlaceOrder(currentProd._id || currentProd.productId, orderQty, note);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth: isTrackingMode ? '700px' : '520px' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                            className="modal-icon-badge"
                            style={{ background: isTrackingMode ? '#eff6ff' : '#ecfdf5' }}
                        >
                            {isTrackingMode ? (
                                <Truck size={22} color="#2563eb" />
                            ) : (
                                <ShoppingCart size={22} color="#10b981" />
                            )}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>
                                {isTrackingMode
                                    ? `Order Tracking: ${order.orderId || '#ORD'}`
                                    : `Place Order: ${currentProd.name}`}
                            </h3>
                            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                {isTrackingMode
                                    ? `Placed on ${new Date(order.createdAt || order.orderDate).toLocaleDateString()}`
                                    : `Product ID: ${currentProd.productId || 'N/A'}`}
                            </span>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* TRACKING MODE */}
                    {isTrackingMode && (
                        <>
                            {/* Product summary card */}
                            <div style={{
                                display: 'flex',
                                gap: '14px',
                                background: '#f8fafc',
                                padding: '14px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                alignItems: 'center'
                            }}>
                                <img
                                    src={currentProd.imageUrl || `https://picsum.photos/seed/${currentProd.productId || 'img'}/120/120`}
                                    alt={currentProd.name}
                                    style={{ width: '70px', height: '70px', borderRadius: '6px', objectFit: 'cover' }}
                                    onError={e => { e.target.src = 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200'; }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>
                                        {currentProd.name}
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                                        Qty: <strong>{order.quantity}</strong> &nbsp;|&nbsp; Unit Price: ${Number(currentProd.price || 0).toFixed(2)}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                                        Total: ${Number(order.totalPrice || (order.quantity * (currentProd.price || 0))).toFixed(2)}
                                    </div>
                                </div>
                                <div>
                                    <span className={`status-badge-pill ${order.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            {/* Full Delivery Timeline */}
                            <div>
                                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Truck size={16} color="#2563eb" /> Delivery Progress
                                </h4>
                                <DeliveryTimeline order={order} />
                            </div>

                            {/* Additional Notes */}
                            {order.note && (
                                <div style={{ fontSize: '0.85rem', color: '#64748b', background: '#f1f5f9', padding: '10px 12px', borderRadius: '6px' }}>
                                    <strong>Customer Note:</strong> {order.note}
                                </div>
                            )}
                        </>
                    )}

                    {/* ORDER PLACEMENT MODE */}
                    {!isTrackingMode && (
                        <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Product Stock Status Indicator */}
                            <div style={{
                                padding: '14px',
                                borderRadius: '8px',
                                background: isOutOfStock ? '#fef2f2' : isLowStock ? '#fffbeb' : '#f0fdf4',
                                border: `1px solid ${isOutOfStock ? '#fecaca' : isLowStock ? '#fde68a' : '#bbf7d0'}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                        {isOutOfStock ? (
                                            <>
                                                <AlertCircle size={16} color="#dc2626" />
                                                <span style={{ color: '#dc2626' }}>Out of Stock</span>
                                            </>
                                        ) : isLowStock ? (
                                            <>
                                                <AlertCircle size={16} color="#d97706" />
                                                <span style={{ color: '#d97706' }}>Low Stock Alert</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={16} color="#16a34a" />
                                                <span style={{ color: '#16a34a' }}>Available in Stock</span>
                                            </>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                                        {isOutOfStock
                                            ? 'Zero units remaining. Reordering in progress.'
                                            : isLowStock
                                            ? `Only ${availableStock} unit(s) remaining! Order soon.`
                                            : `${availableStock} units ready for immediate fulfillment.`}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                                        ${Number(currentProd.price || 0).toFixed(2)}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>per unit</span>
                                </div>
                            </div>

                            {/* Quantity Input with Strict Availability Cap */}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                                    <span>Quantity to Order:</span>
                                    <span style={{ fontWeight: 'normal', color: isLowStock ? '#d97706' : '#64748b' }}>
                                        (Max available: {availableStock})
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={availableStock || 1}
                                    disabled={isOutOfStock}
                                    value={orderQty}
                                    onChange={handleQtyChange}
                                    required
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '6px',
                                        border: errorMsg ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                        fontSize: '1rem',
                                        width: '100%'
                                    }}
                                />
                                {errorMsg && (
                                    <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <AlertCircle size={13} /> {errorMsg}
                                    </div>
                                )}
                            </div>

                            {/* Order Note */}
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
                                    Delivery Note (Optional):
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Leave at front door, call upon arrival"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%' }}
                                />
                            </div>

                            {/* Order Price Calculation */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: '#f8fafc',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                    Order Total ({orderQty} unit{orderQty > 1 ? 's' : ''}):
                                </span>
                                <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#2563eb' }}>
                                    ${(Number(currentProd.price || 0) * (isOutOfStock ? 0 : orderQty)).toFixed(2)}
                                </span>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isOutOfStock || isSubmitting || orderQty > availableStock}
                                style={{
                                    padding: '12px',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    justifyContent: 'center',
                                    borderRadius: '6px',
                                    opacity: isOutOfStock || orderQty > availableStock ? 0.6 : 1,
                                    cursor: isOutOfStock || orderQty > availableStock ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <ShoppingCart size={18} />
                                {isOutOfStock
                                    ? 'Out of Stock'
                                    : isSubmitting
                                    ? 'Processing Order...'
                                    : `Confirm & Place Order`}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn" style={{ background: '#64748b', color: 'white' }} onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerOrderModal;
