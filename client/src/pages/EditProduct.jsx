import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProduct, updateProduct } from '../services/api';

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        productId: '', name: '', category: '', description: '',
        price: '', quantity: '', supplier: '', minStockLevel: '', imageUrl: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await getProduct(id);
                setFormData({
                    productId: data.productId || '',
                    name: data.name || '',
                    category: data.category || '',
                    description: data.description || '',
                    price: data.price || '',
                    quantity: data.quantity || '',
                    supplier: data.supplier || '',
                    minStockLevel: data.minStockLevel || '',
                    imageUrl: data.imageUrl || ''
                });
            } catch (error) {
                console.error('Failed to fetch product', error);
            }
        };
        fetchProduct();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await updateProduct(id, formData);
            navigate('/products');
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to update product');
        }
    };

    return (
        <div>
            <h2>Edit Product</h2>
            <div className="table-container" style={{ marginTop: '20px', maxWidth: '640px' }}>
                {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Product ID *</label>
                            <input type="text" name="productId" value={formData.productId} onChange={handleChange} required />
                        </div>
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>Name *</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Category *</label>
                        <input type="text" name="category" value={formData.category} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3}></textarea>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Price ($) *</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" step="0.01" />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Quantity *</label>
                            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="0" />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Min Stock Level *</label>
                            <input type="number" name="minStockLevel" value={formData.minStockLevel} onChange={handleChange} required min="0" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Supplier</label>
                        <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Image URL (optional)</label>
                        <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://example.com/image.jpg" />
                        {formData.imageUrl && (
                            <img src={formData.imageUrl} alt="preview" style={{ marginTop: '8px', width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }}
                                onError={e => { e.target.style.display = 'none'; }} />
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button type="submit" className="btn btn-primary">Update Product</button>
                        <button type="button" className="btn btn-danger" onClick={() => navigate('/products')}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProduct;
