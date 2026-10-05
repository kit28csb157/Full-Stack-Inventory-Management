import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

export const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

export const register = async (username, password, role) => {
    const response = await axios.post(`${API_URL}/auth/register`, { username, password, role });
    if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('user');
};

export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user'));
};

export const getUsers = async () => {
    const response = await api.get('/auth/users');
    return response.data;
};

export const getProducts = async () => {
    const response = await api.get('/products');
    return response.data;
};

export const getProduct = async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
};

export const addProduct = async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
};

export const updateProduct = async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
};

export const deleteProduct = async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
};

// Orders
export const placeOrder = async (productId, quantity, note = '') => {
    const response = await api.post('/orders', { productId, quantity, note });
    return response.data;
};

export const getMyOrders = async () => {
    const response = await api.get('/orders/my');
    return response.data;
};

export const getAllOrders = async () => {
    const response = await api.get('/orders');
    return response.data;
};

export const updateOrderStatus = async (id, statusData) => {
    const payload = typeof statusData === 'string' ? { status: statusData } : statusData;
    const response = await api.put(`/orders/${id}/status`, payload);
    return response.data;
};

export const cancelOrder = async (id) => {
    const response = await api.put(`/orders/${id}/cancel`);
    return response.data;
};

export const getUserNotifications = async () => {
    const response = await api.get('/orders/notifications');
    return response.data;
};
