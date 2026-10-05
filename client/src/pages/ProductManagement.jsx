import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct, getCurrentUser } from '../services/api';
import { Eye, Pencil, Trash2, PlusCircle, Search } from 'lucide-react';

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const user = getCurrentUser();

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id);
                loadProducts();
            } catch (error) {
                console.error('Failed to delete', error);
            }
        }
    };

    const categories = [...new Set(products.map(p => p.category))];

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.productId.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div>
            <div className="header-flex">
                <h2>Product Management</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            className="search-box"
                            style={{ paddingLeft: '28px' }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {user?.role === 'Admin' && (
                        <Link to="/products/add" className="btn btn-primary">
                            <PlusCircle size={16} /> Add Product
                        </Link>
                    )}
                </div>
            </div>

            {/* Product Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '20px',
                marginTop: '10px'
            }}>
                {filteredProducts.map(p => {
                    const imgSrc = p.imageUrl || `https://picsum.photos/seed/${p.productId}/400/220`;
                    const status = p.quantity === 0 ? 'out' : p.quantity <= p.minStockLevel ? 'low' : 'ok';
                    const statusLabel = p.quantity === 0 ? 'Out of Stock' : p.quantity <= p.minStockLevel ? 'Low Stock' : 'In Stock';
                    return (
                        <div key={p._id} style={{
                            background: 'white',
                            borderRadius: '10px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'transform 0.2s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {/* Product Image */}
                            <div style={{ position: 'relative', height: '180px', background: '#f0f0f0', overflow: 'hidden' }}>
                                <img
                                    src={imgSrc}
                                    alt={p.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={e => { e.target.src = `https://picsum.photos/seed/${p.productId}/400/220`; }}
                                />
                                <span className={`badge ${status}`} style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem'
                                }}>
                                    {statusLabel}
                                </span>
                            </div>

                            {/* Product Info */}
                            <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {p.category} · {p.productId}
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#2c3e50', marginBottom: '2px' }}>
                                    {p.name}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#3498db' }}>
                                        ${p.price}
                                    </span>
                                    <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
                                        Qty: {p.quantity}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ padding: '10px 14px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <Link to={`/products/${p._id}`} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '5px 10px' }}>
                                    <Eye size={14} /> View
                                </Link>
                                {user?.role === 'Admin' && (
                                    <>
                                        <Link to={`/products/edit/${p._id}`} className="btn btn-warning" style={{ fontSize: '0.8rem', padding: '5px 10px' }}>
                                            <Pencil size={14} /> Edit
                                        </Link>
                                        <button onClick={() => handleDelete(p._id)} className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '5px 10px' }}>
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}

                {filteredProducts.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#95a5a6' }}>
                        No products found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductManagement;
