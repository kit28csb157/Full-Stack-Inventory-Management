import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart } from 'lucide-react';
import { getCurrentUser } from '../services/api';

const Sidebar = () => {
    const user = getCurrentUser();
    const location = useLocation();

    const navItem = (to, icon, label) => {
        const active = location.pathname === to || location.pathname.startsWith(to + '/');
        return (
            <li style={{ borderLeft: active ? '3px solid #3498db' : '3px solid transparent' }}>
                <Link to={to} style={{
                    color: active ? '#3498db' : 'white',
                    background: active ? 'rgba(52,152,219,0.15)' : 'transparent',
                    borderRadius: '4px',
                    padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    textDecoration: 'none', fontSize: '1rem',
                    transition: 'all 0.2s'
                }}>
                    {icon} {label}
                </Link>
            </li>
        );
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                📦 Inventory Pro
            </div>
            <ul className="nav-links" style={{ listStyle: 'none', marginTop: '16px', padding: 0 }}>
                {navItem('/dashboard', <LayoutDashboard size={20} />, 'Dashboard')}
                {navItem('/products', <Package size={20} />, 'Products')}
                {navItem('/orders', <ShoppingCart size={20} />, 'My Orders')}
                {user?.role === 'Admin' && navItem('/users', <Users size={20} />, 'Users')}
            </ul>

            {/* User info at bottom */}
            <div style={{
                marginTop: 'auto', padding: '16px', borderTop: '1px solid #34495e',
                fontSize: '0.82rem', color: '#95a5a6'
            }}>
                <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>
                    👤 {user?.username}
                </div>
                <div style={{
                    display: 'inline-block', background: user?.role === 'Admin' ? '#e74c3c' : '#3498db',
                    color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem'
                }}>
                    {user?.role}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
