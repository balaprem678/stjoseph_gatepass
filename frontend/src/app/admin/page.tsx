'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/utils/api';
export default function AdminLoginPage() {
    const [loginId, setLoginId] = useState('');
    const [authValue, setAuthValue] = useState(''); // Password
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const router = useRouter();

    const handleLogin = async () => {
        try {
            setError('');
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginId, role: 'admin', authValue })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            router.push('/dashboard/admin');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="card-wrapper">
            <div className="card">
                <h2>👑 Admin Portal</h2>
                <div className="subhead">Super Admin Login</div>

                <div className="form-group">
                    <label>Admin Username</label>
                    <input
                        type="text"
                        className="form-control"
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        placeholder="admin"
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            value={authValue}
                            onChange={(e) => setAuthValue(e.target.value)}
                            placeholder="Enter admin password"
                            style={{ paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '18px'
                            }}
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>
                    {error && <div className="error">{error}</div>}
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleLogin}>
                    Admin Login
                </button>

                <div className="link-text">
                    <a href="/">Back to User Login</a>
                </div>
            </div>
        </div>
    );
}
