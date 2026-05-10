'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/utils/api';

export default function AdminDashboard() {
    const [user, setUser] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'stats' | 'profiles' | 'users' | 'smtp' | 'sms'>('stats');
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [searchId, setSearchId] = useState('');
    const [smtp, setSmtp] = useState({ 
        serviceType: 'smtp', 
        host: '', 
        port: 587, 
        user: '', 
        pass: '', 
        apiKey: '', 
        from: '',
        fromName: ''
    });
    const [sms, setSms] = useState({ apiKey: '' });
    const [newProfile, setNewProfile] = useState({ loginId: '', fullName: '', email: '', password: '', role: 'hod' });
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!storedUser || !token) {
            router.push('/');
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setStats(data);
    };

    const fetchUsers = async (role?: string) => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/users${role ? `?role=${role}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setUsers(data);
        setLoading(false);
    };

    const fetchSMTP = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/smtp`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.config) setSmtp(data.config);
    };

    const fetchSMS = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/admin/sms`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.config) setSms(data.config);
    };

    useEffect(() => {
        if (!user) return;
        if (activeTab === 'stats') fetchStats();
        if (activeTab === 'profiles') fetchUsers();
        if (activeTab === 'users') fetchUsers(); // Fetch all to show both students and staff
        if (activeTab === 'smtp') fetchSMTP();
        if (activeTab === 'sms') fetchSMS();
        setSearchId(''); // Clear search when switching tabs
    }, [activeTab, user]);

    const handleCreateProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/create-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newProfile)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert(data.message);
            fetchUsers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleUpdateSMTP = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/smtp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(smtp)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert('SMTP Updated');
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleUpdateSMS = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/admin/sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(sms)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            alert('SMS API Key Updated');
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    if (!user) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <div style={{ width: '250px', background: '#1d3b5c', color: 'white', padding: '20px' }}>
                <h2 style={{ marginBottom: '30px', fontSize: '1.5rem' }}>Admin Panel</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button className={`btn ${activeTab === 'stats' ? 'btn-primary' : ''}`} style={{ justifyContent: 'flex-start', background: activeTab === 'stats' ? '#2a4f77' : 'transparent', color: 'white' }} onClick={() => setActiveTab('stats')}>📊 Statistics</button>
                    <button className={`btn ${activeTab === 'profiles' ? 'btn-primary' : ''}`} style={{ justifyContent: 'flex-start', background: activeTab === 'profiles' ? '#2a4f77' : 'transparent', color: 'white' }} onClick={() => setActiveTab('profiles')}>👮 Manage Staff</button>
                    <button className={`btn ${activeTab === 'users' ? 'btn-primary' : ''}`} style={{ justifyContent: 'flex-start', background: activeTab === 'users' ? '#2a4f77' : 'transparent', color: 'white' }} onClick={() => setActiveTab('users')}>🎓 Registered Users</button>
                    <button className={`btn ${activeTab === 'smtp' ? 'btn-primary' : ''}`} style={{ justifyContent: 'flex-start', background: activeTab === 'smtp' ? '#2a4f77' : 'transparent', color: 'white' }} onClick={() => setActiveTab('smtp')}>📧 SMTP Settings</button>
                    <button className={`btn ${activeTab === 'sms' ? 'btn-primary' : ''}`} style={{ justifyContent: 'flex-start', background: activeTab === 'sms' ? '#2a4f77' : 'transparent', color: 'white' }} onClick={() => setActiveTab('sms')}>💬 SMS Settings</button>
                    <div style={{ marginTop: 'auto', borderTop: '1px solid #2a4f77', paddingTop: '20px' }}>
                        <button className="btn btn-outline" style={{ width: '100%', color: 'white', borderColor: 'white' }} onClick={handleLogout}>Sign Out</button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: '30px', background: '#f5f7fb', overflowY: 'auto' }}>
                <div className="header" style={{ marginBottom: '20px' }}>
                    <div className="welcome-text">Super Admin: <b>{user.fullName}</b></div>
                </div>

                {activeTab === 'stats' && stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div className="table-section" style={{ textAlign: 'center', padding: '30px' }}>
                            <h3 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>TOTAL PASSES</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1d3b5c' }}>{stats.totalPasses}</div>
                        </div>
                        <div className="table-section" style={{ textAlign: 'center', padding: '30px' }}>
                            <h3 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>USED PASSES</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1d7a4f' }}>{stats.usedPasses}</div>
                        </div>
                        <div className="table-section" style={{ textAlign: 'center', padding: '30px' }}>
                            <h3 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>PENDING</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ffc107' }}>{stats.pendingPasses}</div>
                        </div>
                        <div className="table-section" style={{ textAlign: 'center', padding: '30px' }}>
                            <h3 style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>REJECTED</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#dc3545' }}>{stats.rejectedPasses}</div>
                        </div>
                    </div>
                )}

                {activeTab === 'profiles' && (
                    <div className="table-section">
                        <h2>Manage HOD / Principal / Security</h2>
                        <div style={{ marginBottom: '20px' }}>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Search by ID..." 
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                style={{ maxWidth: '300px' }}
                            />
                        </div>
                        <div className="form-grid" style={{ marginBottom: '30px', background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
                            <div>
                                <label className="form-label">ID / Username</label>
                                <input type="text" className="form-control" value={newProfile.loginId} onChange={(e) => setNewProfile({...newProfile, loginId: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Full Name</label>
                                <input type="text" className="form-control" value={newProfile.fullName} onChange={(e) => setNewProfile({...newProfile, fullName: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Email</label>
                                <input type="email" className="form-control" value={newProfile.email} onChange={(e) => setNewProfile({...newProfile, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Password</label>
                                <input type="password" className="form-control" value={newProfile.password} onChange={(e) => setNewProfile({...newProfile, password: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Role</label>
                                <select className="form-control" value={newProfile.role} onChange={(e) => setNewProfile({...newProfile, role: e.target.value})}>
                                    <option value="hod">HOD</option>
                                    <option value="principal">Principal</option>
                                    <option value="security">Gate Security</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button className="btn btn-primary" onClick={handleCreateProfile}>Create Profile</button>
                            </div>
                        </div>

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Registration Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u => ['hod', 'principal', 'security'].includes(u.role) && u.loginId.toLowerCase().includes(searchId.toLowerCase())).map(u => (
                                        <tr key={u._id}>
                                            <td>{u.loginId}</td>
                                            <td>{u.fullName}</td>
                                            <td>{u.email}</td>
                                            <td>{u.role.toUpperCase()}</td>
                                            <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                                            <td><span className="status status-approved">Active</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="table-section">
                        <h2>Registered Students & Staff</h2>
                        <div style={{ marginBottom: '20px' }}>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Search by ID..." 
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                style={{ maxWidth: '300px' }}
                            />
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Full Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Role</th>
                                        <th>Registration Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? <tr><td colSpan={6}>Loading...</td></tr> : users.filter(u => ['student', 'staff'].includes(u.role) && u.loginId.toLowerCase().includes(searchId.toLowerCase())).map(u => (
                                        <tr key={u._id}>
                                            <td>{u.loginId}</td>
                                            <td>{u.fullName}</td>
                                            <td>{u.email}</td>
                                            <td>{u.phone}</td>
                                            <td>{u.role.toUpperCase()}</td>
                                            <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'smtp' && (
                    <div className="table-section" style={{ maxWidth: '600px' }}>
                        <h2>Email Configuration</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Email Service</label>
                                <select 
                                    className="form-control" 
                                    value={smtp.serviceType} 
                                    onChange={(e) => setSmtp({...smtp, serviceType: e.target.value})}
                                >
                                    <option value="smtp">Standard SMTP (Gmail, Outlook, etc.)</option>
                                    <option value="brevo">Brevo API</option>
                                </select>
                            </div>

                            {smtp.serviceType === 'smtp' ? (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">SMTP Host</label>
                                        <input type="text" className="form-control" value={smtp.host} onChange={(e) => setSmtp({...smtp, host: e.target.value})} placeholder="smtp.gmail.com" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">SMTP Port</label>
                                        <input type="number" className="form-control" value={smtp.port} onChange={(e) => setSmtp({...smtp, port: parseInt(e.target.value)})} placeholder="587" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">SMTP User (Email)</label>
                                        <input type="text" className="form-control" value={smtp.user} onChange={(e) => setSmtp({...smtp, user: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">SMTP Password / App Password</label>
                                        <input type="password" className="form-control" value={smtp.pass} onChange={(e) => setSmtp({...smtp, pass: e.target.value})} />
                                    </div>
                                </>
                            ) : (
                                <div className="form-group">
                                    <label className="form-label">Brevo API Key</label>
                                    <input type="password" className="form-control" value={smtp.apiKey} onChange={(e) => setSmtp({...smtp, apiKey: e.target.value})} placeholder="xkeysib-..." />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">From Name</label>
                                <input type="text" className="form-control" value={(smtp as any).fromName} onChange={(e) => setSmtp({...smtp, fromName: e.target.value})} placeholder="St. Joseph Gate Pass" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">From Email Address</label>
                                <input type="email" className="form-control" value={smtp.from} onChange={(e) => setSmtp({...smtp, from: e.target.value})} placeholder="noreply@example.com" />
                            </div>
                            
                            <button className="btn btn-primary" onClick={handleUpdateSMTP}>Save Configuration</button>
                        </div>
                    </div>
                )}

                {activeTab === 'sms' && (
                    <div className="table-section" style={{ maxWidth: '600px' }}>
                        <h2>SMS Configuration (Fast2SMS)</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Fast2SMS Auth Key</label>
                                <input type="text" className="form-control" value={sms.apiKey} onChange={(e) => setSms({...sms, apiKey: e.target.value})} placeholder="Enter your Fast2SMS Authorization Key" />
                            </div>
                            <button className="btn btn-primary" onClick={handleUpdateSMS}>Save SMS Configuration</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
