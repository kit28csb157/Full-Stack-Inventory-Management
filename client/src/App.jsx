import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import AddProduct from './pages/AddProduct';
import EditProduct from './pages/EditProduct';
import ProductDetails from './pages/ProductDetails';
import UserManagement from './pages/UserManagement';
import Orders from './pages/Orders';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { getCurrentUser } from './services/api';
import './App.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const user = getCurrentUser();
    if (!user) return <Navigate to="/login" />;
    if (adminOnly && user.role !== 'Admin') return <Navigate to="/dashboard" />;
    return children;
};

const Layout = ({ children }) => {
    return (
        <div className="layout">
            <Sidebar />
            <div className="main-content">
                <Navbar />
                <div className="content">
                    {children}
                </div>
            </div>
        </div>
    );
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
                <Route path="/products" element={<ProtectedRoute><Layout><ProductManagement /></Layout></ProtectedRoute>} />
                <Route path="/products/add" element={<ProtectedRoute adminOnly={true}><Layout><AddProduct /></Layout></ProtectedRoute>} />
                <Route path="/products/edit/:id" element={<ProtectedRoute adminOnly={true}><Layout><EditProduct /></Layout></ProtectedRoute>} />
                <Route path="/products/:id" element={<ProtectedRoute><Layout><ProductDetails /></Layout></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Layout><Orders /></Layout></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute adminOnly={true}><Layout><UserManagement /></Layout></ProtectedRoute>} />
            </Routes>
        </Router>
    );
}

export default App;
