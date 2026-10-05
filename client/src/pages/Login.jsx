import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { User, Lock, Eye, EyeOff, Package } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (u, p) => { setUsername(u); setPassword(p); };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            background: '#f0f4f8'
        }}>
            {/* Left Panel - Branding */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #1a2a4a 0%, #2c3e50 50%, #1a6b3a 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '60px 40px',
                color: 'white',
                minHeight: '100vh'
            }}
                className="login-left-panel"
            >
                <div style={{ textAlign: 'center', maxWidth: '420px' }}>
                    {/* Logo */}
                    <div style={{
                        width: '90px', height: '90px', background: 'rgba(255,255,255,0.15)',
                        borderRadius: '24px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 28px', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                        <Package size={48} color="white" />
                    </div>

                    <h1 style={{ fontSize: '2.4rem', fontWeight: '800', margin: '0 0 12px', letterSpacing: '-0.5px' }}>
                        Inventory Pro
                    </h1>
                    <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 0 40px' }}>
                        Manage your stock, track orders, and stay on top of your business — all in one place.
                    </p>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        {[
                            { label: 'Products', value: '10+' },
                            { label: 'Orders', value: 'Real-time' },
                            { label: 'Users', value: 'Multi-role' }
                        ].map(s => (
                            <div key={s.label} style={{
                                background: 'rgba(255,255,255,0.1)', borderRadius: '12px',
                                padding: '14px 18px', textAlign: 'center', backdropFilter: 'blur(6px)',
                                border: '1px solid rgba(255,255,255,0.15)'
                            }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{s.value}</div>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', marginTop: '2px' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div style={{
                flex: '0 0 480px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '48px 52px',
                background: 'white',
                boxShadow: '-4px 0 30px rgba(0,0,0,0.06)'
            }}
                className="login-right-panel"
            >
                <div style={{ marginBottom: '36px' }}>
                    <h2 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#1a2a4a', margin: '0 0 6px' }}>
                        Welcome back 👋
                    </h2>
                    <p style={{ color: '#8a9bb0', margin: 0, fontSize: '0.95rem' }}>
                        Sign in to your account to continue
                    </p>
                </div>

                {/* Demo Credentials Box */}
                <div style={{
                    background: 'linear-gradient(135deg, #eef6ff, #f0fff4)',
                    border: '1px solid #c3dafe',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    marginBottom: '24px'
                }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#3a5a8a', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        🔑 Demo Credentials
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => fillDemo('admin', 'admin123')}
                            style={{
                                background: '#1a2a4a', color: 'white', border: 'none',
                                padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
                                fontSize: '0.82rem', fontWeight: '600'
                            }}
                        >
                            👑 Admin Login
                        </button>
                        <div style={{ fontSize: '0.82rem', color: '#555', alignSelf: 'center' }}>
                            <span style={{ fontFamily: 'monospace', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>admin</span>
                            {' / '}
                            <span style={{ fontFamily: 'monospace', background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>admin123</span>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: '#fff5f5', border: '1px solid #fed7d7',
                        color: '#c53030', borderRadius: '10px',
                        padding: '12px 16px', marginBottom: '20px', fontSize: '0.88rem',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {/* Username */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                            Username
                        </label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                required
                                placeholder="Enter your username"
                                style={{
                                    width: '100%', padding: '12px 14px 12px 42px',
                                    border: '1.5px solid #e5e7eb', borderRadius: '10px',
                                    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                                style={{
                                    width: '100%', padding: '12px 44px 12px 42px',
                                    border: '1.5px solid #e5e7eb', borderRadius: '10px',
                                    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                style={{
                                    position: 'absolute', right: '14px', top: '50%',
                                    transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0
                                }}
                            >
                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1a2a4a, #2563eb)',
                            color: 'white', border: 'none',
                            padding: '14px', borderRadius: '10px',
                            fontSize: '1rem', fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '6px', letterSpacing: '0.3px',
                            transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 15px rgba(37,99,235,0.35)'
                        }}
                    >
                        {loading ? '⏳ Signing in...' : '🚀 Sign In'}
                    </button>
                </form>

                {/* Register Link */}
                <div style={{
                    textAlign: 'center', marginTop: '28px',
                    padding: '18px', background: '#f8fafc',
                    borderRadius: '10px', fontSize: '0.9rem', color: '#6b7280'
                }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
                        Create Account →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
