'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/utils/api';

export default function SecurityDashboard() {
    const [user, setUser] = useState<any>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    const format24To12 = (time24: string) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        const m = minutes.padStart(2, '0');
        return `${h}:${m} ${ampm}`;
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!storedUser || !token) {
            router.push('/');
            return;
        }
        setUser(JSON.parse(storedUser));
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (searchDate) params.append('date', searchDate);
            if (searchTerm) params.append('enrollNo', searchTerm);
            const query = params.toString() ? `?${params.toString()}` : '';

            const res = await fetch(`${API_URL}/gatepass/all${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setRequests(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchRequests();
    }, [searchDate, searchTerm]);

    const handleMarkUsed = async (id: string) => {
        if (!confirm('Mark this pass as used?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/gatepass/${id}/mark-used`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Action failed');
            alert('Gate pass marked as used');
            fetchRequests();
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
        <div className="container">
            <div className="header">
                <div className="welcome-text">Security: <b>{user.fullName}</b></div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={handleLogout}>Sign out</button>
                </div>
            </div>

            <div className="table-section">
                <div className="table-header">
                    <h2>Gate Pass Verification</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search Enroll No..."
                            style={{ width: '180px', padding: '6px 12px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <input
                            type="date"
                            className="form-control"
                            style={{ width: '150px', padding: '6px 12px' }}
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Photo</th>
                                <th>Name</th>
                                <th>Enroll</th>
                                <th>Date</th>
                                <th>Out/In</th>
                                <th>HOD</th>
                                <th>Principal</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={8} className="empty-state">No matching approved passes.</td></tr>
                            ) : requests.map((req) => (
                                <tr key={req._id}>
                                    <td>
                                        <div className="photo-thumb" style={{ backgroundImage: req.photo ? `url(${req.photo})` : 'none' }}>
                                            {!req.photo && req.fullName.charAt(0)}
                                        </div>
                                    </td>
                                    <td>{req.fullName}</td>
                                    <td>{req.enrollNo}</td>
                                    <td>{req.date}</td>
                                    <td>{format24To12(req.outTime)} - {format24To12(req.inTime)}</td>
                                    <td><span className={`status status-${req.hodApproval.status}`}>{req.hodApproval.status}</span></td>
                                    <td><span className={`status status-${req.principalApproval.status}`}>{req.principalApproval.status}</span></td>
                                    <td>
                                        {req.status === 'principal_approved' ? (
                                            <button className="btn btn-primary btn-sm" onClick={() => handleMarkUsed(req._id)}>Mark Used</button>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#666' }}>{req.status.toUpperCase()}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
