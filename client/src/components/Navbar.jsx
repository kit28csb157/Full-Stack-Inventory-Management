import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/api';
import NotificationDropdown from './NotificationDropdown';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const user = getCurrentUser();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="navbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.95rem', color: '#475569' }}>
                    Welcome, <strong style={{ color: '#1e293b' }}>{user?.username}</strong>
                </span>
                <span style={{
                    fontSize: '0.75rem',
                    background: user?.role === 'Admin' ? '#fee2e2' : '#eff6ff',
                    color: user?.role === 'Admin' ? '#b91c1c' : '#1d4ed8',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 600
                }}>
                    {user?.role}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Real-time Order Notifications Dropdown (Feature 6) */}
                <NotificationDropdown
                    onSelectOrder={() => {
                        navigate('/orders');
                    }}
                />

                <button
                    className="logout-btn"
                    onClick={handleLogout}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <LogOut size={15} /> Logout
                </button>
            </div>
        </div>
    );
};

export default Navbar;
