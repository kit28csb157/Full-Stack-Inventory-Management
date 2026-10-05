import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProduct, getAllOrders, getMyOrders, getCurrentUser, placeOrder } from '../services/api';
import {
    ArrowLeft,
    Pencil,
    ShoppingCart,
    Package,
    Layers,
    ShoppingBag,
    Truck,
    CheckCircle2,
    Clock,
    XCircle,
    AlertTriangle,
    AlertCircle,
    Info
} from 'lucide-react';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [orders, setOrders] = useState([]);
    const [orderQty, setOrderQty] = useState(1);
    const [orderNote, setOrderNote] = useState('');
    const [ordering, setOrdering] = useState(false);
    const [orderMsg, setOrderMsg] = useState(null);
    const [qtyError, setQtyError] = useState('');
    const [showOrder, setShowOrder] = useState(false);
    const user = getCurrentUser();
    const isAdmin = user?.role === 'Admin';

    useEffect(() => {
        const fetchProductAndOrders = async () => {
            try {
                const data = await getProduct(id);
                setProduct(data);
                
                try {
                    const orderData = isAdmin ? await getAllOrders() : await getMyOrders();
                    setOrders(orderData || []);
                } catch (e) {
                    console.warn('Could not fetch orders for product details', e);
                }
            } catch (error) {
                console.error('Failed to fetch product', error);
            }
        };
        fetchProductAndOrders();
    }, [id, isAdmin]);

    if (!product) return <div style={{ padding: '30px' }}>Loading product details...</div>;

    const imgSrc = product.imageUrl || `https://picsum.photos/seed/${product.productId}/600/350`;
    const availableStock = product.quantity !== undefined ? product.quantity : 0;
    const minStock = product.minStockLevel || 10;
    const isOutOfStock = availableStock <= 0;
    const isLowStock = availableStock > 0 && availableStock <= minStock;

    const statusClass = isOutOfStock ? 'out' : isLowStock ? 'low' : 'ok';
    const statusLabel = isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock';

    // Calculate product orders analytics
    const productOrders = orders.filter(o => {
        const prodId = o.product?._id || o.product?.productId || o.product;
        return prodId === product._id || prodId === product.productId;
    });
    const soldQty = productOrders.reduce((sum, o) => (o.status !== 'Cancelled' ? sum + Number(o.quantity || 0) : sum), 0);
    const totalStock = availableStock + soldQty;
    const orderCount = productOrders.length;
    const deliveredCount = productOrders.filter(o => o.status === 'Delivered').length;
    const pendingCount = productOrders.filter(o => ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery'].includes(o.status)).length;
    const cancelledCount = productOrders.filter(o => o.status === 'Cancelled').length;

    const handleQtyChange = (e) => {
        const val = parseInt(e.target.value, 10);
        setQtyError('');
        if (isNaN(val) || val < 1) {
            setOrderQty(1);
            return;
        }
        if (val > availableStock) {
            setOrderQty(availableStock);
            setQtyError(`Cannot order more than ${availableStock} available unit(s) in stock.`);
        } else {
            setOrderQty(val);
        }
    };

    const handleOrder = async (e) => {
        e.preventDefault();
        if (isOutOfStock) {
            setOrderMsg({ type: 'error', text: 'This item is currently out of stock.' });
            return;
        }
        if (orderQty > availableStock) {
            setOrderMsg({ type: 'error', text: `Order quantity cannot exceed available stock (${availableStock}).` });
            return;
        }
        setOrdering(true);
        setOrderMsg(null);
        try {
            await placeOrder(product._id, Number(orderQty), orderNote);
            setOrderMsg({
                type: 'success',
                text: `✅ Order placed successfully for ${orderQty} x ${product.name}! Estimated delivery: 3 business days.`
            });
            setShowOrder(false);
            setOrderQty(1);
            setOrderNote('');
            // Reload product to update quantity
            const updated = await getProduct(id);
            setProduct(updated);
        } catch (err) {
            setOrderMsg({ type: 'error', text: err.response?.data?.message || 'Failed to place order' });
        } finally {
            setOrdering(false);
        }
    };

    return (
        <div>
            <button onClick={() => navigate(-1)} className="btn btn-primary" style={{ marginBottom: '16px' }}>
                <ArrowLeft size={16} /> Back
            </button>

            <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                display: 'flex',
                flexWrap: 'wrap'
            }}>
                {/* Left: Image */}
                <div style={{ flex: '0 0 380px', maxWidth: '100%', background: '#f7f7f7', position: 'relative' }}>
                    <img
                        src={imgSrc}
                        alt={product.name}
                        style={{ width: '100%', height: '340px', objectFit: 'cover', display: 'block' }}
                        onError={e => { e.target.src = `https://picsum.photos/seed/${product.productId}/600/350`; }}
                    />
                    <span className={`badge ${statusClass}`} style={{
                        position: 'absolute', top: '14px', left: '14px',
                        padding: '6px 14px', borderRadius: '20px', fontSize: '0.82rem',
                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                        {isOutOfStock && <AlertCircle size={14} />}
                        {isLowStock && <AlertTriangle size={14} />}
                        {!isOutOfStock && !isLowStock && <CheckCircle2 size={14} />}
                        {statusLabel}
                    </span>
                </div>

                {/* Right: Details */}
                <div style={{ flex: 1, minWidth: '280px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {product.category} · SKU: {product.productId}
                    </div>
                    <h2 style={{ margin: 0, color: '#2c3e50', fontSize: '1.6rem' }}>{product.name}</h2>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>${Number(product.price).toFixed(2)}</div>

                    <p style={{ color: '#555', lineHeight: 1.6, margin: 0 }}>{product.description || 'No description available.'}</p>

                    {/* Feature 4: Stock Availability Banner */}
                    <div style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: isOutOfStock ? '#fef2f2' : isLowStock ? '#fffbeb' : '#f0fdf4',
                        border: `1px solid ${isOutOfStock ? '#fecaca' : isLowStock ? '#fde68a' : '#bbf7d0'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isOutOfStock ? (
                                <AlertCircle size={18} color="#dc2626" />
                            ) : isLowStock ? (
                                <AlertTriangle size={18} color="#d97706" />
                            ) : (
                                <CheckCircle2 size={18} color="#16a34a" />
                            )}
                            <div>
                                <strong style={{ color: isOutOfStock ? '#dc2626' : isLowStock ? '#d97706' : '#16a34a' }}>
                                    {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock Alert (${availableStock} remaining)` : `In Stock (${availableStock} available)`}
                                </strong>
                                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                    {isOutOfStock
                                        ? 'This item is currently sold out and cannot be ordered.'
                                        : isLowStock
                                        ? `Hurry, only ${availableStock} left before stock runs out!`
                                        : 'Ready for fast fulfillment & immediate delivery.'}
                                </div>
                            </div>
                        </div>
                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            Min threshold: <strong>{minStock}</strong>
                        </span>
                    </div>

                    {/* Stock & Analytics Breakdown Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '12px',
                        background: '#f8fafc',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        marginTop: '4px'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Layers size={13} /> TOTAL STOCK
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: '#1e293b' }}>{totalStock}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ShoppingBag size={13} color="#e67e22" /> SOLD QTY
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: '#e67e22' }}>{soldQty}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Package size={13} color={statusClass === 'ok' ? '#27ae60' : statusClass === 'low' ? '#f39c12' : '#e74c3c'} /> AVAILABLE
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: statusClass === 'ok' ? '#27ae60' : statusClass === 'low' ? '#f39c12' : '#e74c3c' }}>
                                {availableStock}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Truck size={13} color="#3498db" /> ORDERS
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: '#3498db' }}>{orderCount}</div>
                        </div>
                    </div>

                    {/* Delivery Status Summary for Admin */}
                    {isAdmin && (
                        <div style={{
                            background: '#f1f5f9',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '10px'
                        }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Truck size={15} /> Delivery Status Summary:
                            </span>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem' }}>
                                <span style={{ color: '#27ae60', fontWeight: 600 }}>{deliveredCount} Delivered</span>
                                <span style={{ color: '#d35400', fontWeight: 600 }}>{pendingCount} In Transit</span>
                                <span style={{ color: '#c0392b', fontWeight: 600 }}>{cancelledCount} Cancelled</span>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.85rem', color: '#64748b' }}>
                        <div><strong>Supplier:</strong> {product.supplier || 'N/A'}</div>
                    </div>

                    {/* Order Success / Error Message */}
                    {orderMsg && (
                        <div style={{
                            padding: '10px 14px',
                            borderRadius: '6px',
                            background: orderMsg.type === 'success' ? '#d5f5e3' : '#fde8e8',
                            color: orderMsg.type === 'success' ? '#1e8449' : '#c0392b',
                            fontSize: '0.9rem'
                        }}>
                            {orderMsg.text}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <button
                            className="btn btn-primary"
                            disabled={isOutOfStock}
                            onClick={() => {
                                if (isOutOfStock) return;
                                setShowOrder(!showOrder);
                                setOrderMsg(null);
                            }}
                            style={{
                                padding: '10px 20px',
                                fontSize: '0.95rem',
                                opacity: isOutOfStock ? 0.6 : 1,
                                cursor: isOutOfStock ? 'not-allowed' : 'pointer'
                            }}
                        >
                            <ShoppingCart size={16} />
                            {isOutOfStock ? 'Out of Stock' : showOrder ? 'Close Order Form' : 'Place Order'}
                        </button>

                        {isAdmin && (
                            <Link to={`/products/edit/${product._id}`} className="btn btn-warning" style={{ padding: '10px 20px', fontSize: '0.95rem' }}>
                                <Pencil size={16} /> Edit Product
                            </Link>
                        )}
                    </div>

                    {/* Order Form with Strict Quantity Cap */}
                    {showOrder && !isOutOfStock && (
                        <form onSubmit={handleOrder} style={{
                            marginTop: '8px',
                            background: '#f8f9fa',
                            padding: '18px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b' }}>
                                <Package size={16} color="#2563eb" /> Order Form
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                                    <span>Quantity to Order:</span>
                                    <span style={{ fontWeight: 'normal', color: isLowStock ? '#d97706' : '#64748b' }}>
                                        (Available: {availableStock})
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={availableStock}
                                    value={orderQty}
                                    onChange={handleQtyChange}
                                    required
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: qtyError ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                        width: '100%',
                                        fontSize: '1rem'
                                    }}
                                />
                                {qtyError && (
                                    <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <AlertCircle size={13} /> {qtyError}
                                    </div>
                                )}
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Delivery Note (optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Leave with security, call on delivery"
                                    value={orderNote}
                                    onChange={e => setOrderNote(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontWeight: '600', color: '#64748b', fontSize: '0.9rem' }}>
                                    Order Total:
                                </span>
                                <span style={{ fontWeight: 'bold', fontSize: '1.25rem', color: '#2563eb' }}>
                                    ${(product.price * orderQty).toFixed(2)}
                                </span>
                            </div>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={ordering || orderQty > availableStock || isOutOfStock}
                                style={{ padding: '10px', justifyContent: 'center', fontSize: '0.95rem' }}
                            >
                                {ordering ? 'Placing Order...' : 'Confirm & Place Order'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
