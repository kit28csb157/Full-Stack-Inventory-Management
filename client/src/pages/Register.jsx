import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import { User, Lock, Eye, EyeOff, ShieldCheck, Package } from 'lucide-react';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('User');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await register(username, password, role);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = () => {
        if (password.length === 0) return null;
        if (password.length < 6) return { label: 'Weak', color: '#e74c3c', width: '30%' };
        if (password.length < 10) return { label: 'Medium', color: '#f39c12', width: '60%' };
        return { label: 'Strong', color: '#2ecc71', width: '100%' };
    };
    const strength = passwordStrength();

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#f0f4f8' }}>
            {/* Left Panel */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #1a3a2a 0%, #2c3e50 50%, #1a4a6b 100%)',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center',
                padding: '60px 40px', color: 'white'
            }} className="login-left-panel">
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{
                        width: '90px', height: '90px', background: 'rgba(255,255,255,0.15)',
                        borderRadius: '24px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 28px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                        <Package size={48} color="white" />
                    </div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 12px' }}>Join Inventory Pro</h1>
                    <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 0 36px', fontSize: '1rem' }}>
                        Create your account and start managing your inventory efficiently today.
                    </p>

                    {/* Role descriptions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                        {[
                            { icon: '👤', role: 'User', desc: 'Browse products & place orders' },
                            { icon: '👑', role: 'Admin', desc: 'Full control: manage products, users & orders' }
                        ].map(r => (
                            <div key={r.role} style={{
                                background: 'rgba(255,255,255,0.1)', borderRadius: '10px',
                                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                                border: '1px solid rgba(255,255,255,0.15)'
                            }}>
                                <span style={{ fontSize: '1.4rem' }}>{r.icon}</span>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{r.role}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)' }}>{r.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Register Form */}
            <div style={{
                flex: '0 0 480px',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                padding: '48px 52px', background: 'white',
                boxShadow: '-4px 0 30px rgba(0,0,0,0.06)', overflowY: 'auto'
            }} className="login-right-panel">
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '1.9rem', fontWeight: '800', color: '#1a2a4a', margin: '0 0 6px' }}>
                        Create Account 🎉
                    </h2>
                    <p style={{ color: '#8a9bb0', margin: 0, fontSize: '0.95rem' }}>
                        Fill in the details below to get started
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: '#fff5f5', border: '1px solid #fed7d7',
                        color: '#c53030', borderRadius: '10px',
                        padding: '12px 16px', marginBottom: '20px', fontSize: '0.88rem'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                                placeholder="Choose a username"
                                style={{
                                    width: '100%', padding: '12px 14px 12px 42px',
                                    border: '1.5px solid #e5e7eb', borderRadius: '10px',
                                    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                        </div>
                    </div>

                    {/* Role Selector */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                            Account Role
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {['User', 'Admin'].map(r => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    style={{
                                        flex: 1, padding: '12px',
                                        border: role === r ? '2px solid #2563eb' : '1.5px solid #e5e7eb',
                                        borderRadius: '10px', cursor: 'pointer',
                                        background: role === r ? '#eff6ff' : 'white',
                                        color: role === r ? '#1d4ed8' : '#6b7280',
                                        fontWeight: role === r ? '700' : '500',
                                        fontSize: '0.9rem', transition: 'all 0.2s',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                    }}
                                >
                                    {r === 'Admin' ? <ShieldCheck size={16} /> : <User size={16} />}
                                    {r}
                                </button>
                            ))}
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
                                placeholder="Create a password"
                                style={{
                                    width: '100%', padding: '12px 44px 12px 42px',
                                    border: '1.5px solid #e5e7eb', borderRadius: '10px',
                                    fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}>
                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {/* Strength meter */}
                        {strength && (
                            <div style={{ marginTop: '6px' }}>
                                <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: strength.width, background: strength.color, transition: 'all 0.3s', borderRadius: '2px' }} />
                                </div>
                                <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: '600' }}>{strength.label} password</span>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                            Confirm Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Repeat your password"
                                style={{
                                    width: '100%', padding: '12px 14px 12px 42px',
                                    border: `1.5px solid ${confirmPassword && confirmPassword !== password ? '#e74c3c' : '#e5e7eb'}`,
                                    borderRadius: '10px', fontSize: '0.95rem', outline: 'none',
                                    boxSizing: 'border-box', fontFamily: 'inherit'
                                }}
                                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                                onBlur={e => e.target.style.borderColor = confirmPassword !== password ? '#e74c3c' : '#e5e7eb'}
                            />
                            {confirmPassword && (
                                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>
                                    {confirmPassword === password ? '✅' : '❌'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1a3a2a, #16a34a)',
                            color: 'white', border: 'none',
                            padding: '14px', borderRadius: '10px',
                            fontSize: '1rem', fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '6px', letterSpacing: '0.3px',
                            boxShadow: loading ? 'none' : '0 4px 15px rgba(22,163,74,0.35)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? '⏳ Creating account...' : '🎉 Create Account'}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center', marginTop: '24px',
                    padding: '16px', background: '#f8fafc',
                    borderRadius: '10px', fontSize: '0.9rem', color: '#6b7280'
                }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
                        Sign In →
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
