import React, { useState, useEffect, useRef } from 'react';
import {
    Bell,
    CheckCircle2,
    Truck,
    MapPin,
    CheckCheck,
    AlertTriangle,
    Check,
    X,
    ExternalLink
} from 'lucide-react';
import {
    deriveNotificationsFromOrders,
    markNotificationRead,
    markAllNotificationsRead
} from '../services/notificationService';
import { getMyOrders, getAllOrders, getCurrentUser } from '../services/api';
import { generateSampleData } from '../services/dashboardData';

const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffSecs = Math.floor((now - d) / 1000);

    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getNotifIcon = (type) => {
    switch (type) {
        case 'confirmed':
            return <CheckCircle2 size={16} color="#3b82f6" />;
        case 'shipped':
            return <Truck size={16} color="#0284c7" />;
        case 'out_for_delivery':
            return <MapPin size={16} color="#8b5cf6" />;
        case 'delivered':
            return <CheckCheck size={16} color="#16a34a" />;
        case 'delayed':
            return <AlertTriangle size={16} color="#d97706" />;
        default:
            return <Bell size={16} color="#64748b" />;
    }
};

const NotificationDropdown = ({ onSelectOrder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'
    const dropdownRef = useRef(null);
    const user = getCurrentUser();
    const username = user?.username || 'user';

    const loadNotifications = async () => {
        try {
            let orders = [];
            try {
                orders = user?.role === 'Admin' ? await getAllOrders() : await getMyOrders();
            } catch (err) {
                // Fallback to sample orders
                const sample = generateSampleData([]);
                orders = sample.sampleOrders;
            }
            if (!orders || orders.length === 0) {
                const sample = generateSampleData([]);
                orders = sample.sampleOrders;
            }
            const derived = deriveNotificationsFromOrders(orders, username);
            setNotifications(derived);
        } catch (error) {
            console.error('Error fetching notifications', error);
        }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 15000);
        return () => clearInterval(interval);
    }, [user?.username]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAsRead = (e, notifId) => {
        e.stopPropagation();
        markNotificationRead(username, notifId);
        setNotifications(prev =>
            prev.map(n => (n.id === notifId ? { ...n, isRead: true } : n))
        );
    };

    const handleMarkAllRead = () => {
        const ids = notifications.map(n => n.id);
        markAllNotificationsRead(username, ids);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const filteredNotifs = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        return true;
    });

    return (
        <div className="notif-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Bell Trigger Button */}
            <button
                type="button"
                className="notif-bell-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
                title="View order notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notif-badge-count">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="notif-popover">
                    <div className="notif-popover-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bell size={18} color="#2563eb" />
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>
                                Notifications
                            </h4>
                            {unreadCount > 0 && (
                                <span className="notif-pill-tag">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="notif-mark-all-btn"
                                onClick={handleMarkAllRead}
                            >
                                <Check size={14} /> Mark all read
                            </button>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="notif-filter-tabs">
                        <button
                            type="button"
                            className={`notif-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            type="button"
                            className={`notif-tab ${filter === 'unread' ? 'active' : ''}`}
                            onClick={() => setFilter('unread')}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>

                    {/* Notification List */}
                    <div className="notif-list">
                        {filteredNotifs.length === 0 ? (
                            <div className="notif-empty-state">
                                <Bell size={32} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                                <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                                    {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                                </p>
                            </div>
                        ) : (
                            filteredNotifs.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                                    onClick={() => {
                                        if (!notif.isRead) {
                                            markNotificationRead(username, notif.id);
                                            setNotifications(prev =>
                                                prev.map(n => (n.id === notif.id ? { ...n, isRead: true } : n))
                                            );
                                        }
                                        if (onSelectOrder && notif.order) {
                                            onSelectOrder(notif.order);
                                        }
                                    }}
                                >
                                    <div className={`notif-icon-box ${notif.severity}`}>
                                        {getNotifIcon(notif.type)}
                                    </div>
                                    <div className="notif-content">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                                            <span className="notif-title">{notif.title}</span>
                                            <span className="notif-time">{formatTimeAgo(notif.timestamp)}</span>
                                        </div>
                                        <p className="notif-msg">{notif.message}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                            <span className={`notif-status-badge ${notif.type}`}>
                                                {notif.type.replace(/_/g, ' ')}
                                            </span>
                                            {!notif.isRead && (
                                                <button
                                                    type="button"
                                                    className="notif-read-btn"
                                                    onClick={(e) => handleMarkAsRead(e, notif.id)}
                                                    title="Mark as read"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
