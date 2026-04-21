'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/utils/api';
import "./page.css"
import logo from "../../public/logo.png";

export default function LoginPage() {
    const [role, setRole] = useState<'student' | 'staff'>('student');
    const [view, setView] = useState<'login' | 'register'>('login');
    const [staffAuthType, setStaffAuthType] = useState<'otp' | 'password'>('otp');
    const [loginId, setLoginId] = useState('');
    const [authValue, setAuthValue] = useState(''); // OTP or Password
    const [otpSent, setOtpSent] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Register fields
    const [regData, setRegData] = useState({ loginId: '', fullName: '', email: '', phone: '' });

    const router = useRouter();

    const handleSendOTP = async () => {
        try {
            setError('');
            setMessage('');
            const res = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginId, role })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setOtpSent(true);
            setMessage(data.message);
            if (data.otp) {
                console.log("Development OTP:", data.otp);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleLogin = async () => {
        try {
            setError('');
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginId, role, authValue })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect based on ACTUAL role from backend
            router.push(`/dashboard/${data.user.role}`);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleRegister = async () => {
        try {
            setError('');
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...regData, role })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert('Registration Successful. You can now login.');
            setView('login');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const roles: Array<'student' | 'staff'> = ['student', 'staff'];

    return (
        <div className="card-wrapper">
            <div className="card">
                <div className='tac'>
                    <h2 className='card-title'><img src={logo.src} alt="Logo" width={50} /> St. Joseph's College</h2>
                    <h5>College Gate Pass Management System</h5>
                    <div className="subhead">Student / Faculty Portal</div>
                </div>

                {view === 'login' && (
                    <>
                        <div className="role-group">
                            {roles.map((r) => (
                                <button
                                    key={r}
                                    className={`role-btn ${role === r ? 'active' : ''}`}
                                    onClick={() => {
                                        setRole(r);
                                        setOtpSent(false);
                                        setAuthValue('');
                                        setError('');
                                        setMessage('');
                                        setStaffAuthType('otp');
                                    }}
                                >
                                    {r.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className="form-group">
                            <label>{role === 'student' ? 'Enrollment Number' : 'Staff ID'}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={loginId}
                                onChange={(e) => setLoginId(e.target.value)}
                                placeholder={role === 'student' ? '2024CS101' : 'staff123'}
                            />
                        </div>

                        {role === 'staff' && (
                            <div className="form-group">
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '10px', fontSize: '13px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                        <input type="radio" checked={staffAuthType === 'otp'} onChange={() => { setStaffAuthType('otp'); setAuthValue(''); }} /> OTP Login
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                        <input type="radio" checked={staffAuthType === 'password'} onChange={() => { setStaffAuthType('password'); setAuthValue(''); }} /> Password (HOD/etc)
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>{(role === 'student' || (role === 'staff' && staffAuthType === 'otp')) ? 'OTP' : 'Password'}</label>
                            {(role === 'student' || (role === 'staff' && staffAuthType === 'otp')) ? (
                                <div className="otp-row">
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={authValue}
                                        onChange={(e) => setAuthValue(e.target.value)}
                                        placeholder="6-digit OTP"
                                    />
                                    <button className="send-btn" onClick={handleSendOTP}>
                                        {otpSent ? 'Resend' : 'Send OTP'}
                                    </button>
                                </div>
                            ) : (
                                <input
                                    type="password"
                                    className="form-control"
                                    value={authValue}
                                    onChange={(e) => setAuthValue(e.target.value)}
                                    placeholder="Enter password"
                                />
                            )}
                            {message && <div style={{ color: 'green', fontSize: '12px', marginTop: '5px' }}>{message}</div>}
                            {error && <div className="error">{error}</div>}
                        </div>

                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleLogin}>
                            Login
                        </button>

                        <div className="link-text">
                            New User? <a href="#" onClick={(e) => { e.preventDefault(); setView('register'); }}>Register</a>
                        </div>
                    </>
                )}

                {view === 'register' && (
                    <>
                        <div className="form-group">
                            <label>{role === 'student' ? 'Enrollment Number' : 'Staff ID'}</label>
                            <input
                                type="text"
                                className="form-control"
                                value={regData.loginId}
                                onChange={(e) => setRegData({ ...regData, loginId: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                className="form-control"
                                value={regData.fullName}
                                onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="form-control"
                                value={regData.email}
                                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="text"
                                className="form-control"
                                value={regData.phone}
                                onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                            />
                        </div>
                        {error && <div className="error">{error}</div>}
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleRegister}>
                            Register
                        </button>
                        <div className="link-text">
                            Already registered? <a href="#" onClick={(e) => { e.preventDefault(); setView('login'); }}>Login</a>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
