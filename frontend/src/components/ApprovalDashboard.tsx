'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/utils/api';
import './approvaldashboard.scss';

export default function ApprovalDashboard({ role }: { role: 'hod' | 'principal' }) {
    const [user, setUser] = useState<any>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const router = useRouter();

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
            const res = await fetch(`${API_URL}/gatepass/all?status=${filterStatus}`, {
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
    }, [filterStatus]);

    const handleAction = async (id: string, decision: 'approved' | 'rejected', reason: string = '') => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/gatepass/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ decision, rejectionReason: reason })
            });
            if (!res.ok) throw new Error('Action failed');
            alert(`Request ${decision}`);
            if (decision === 'rejected') {
                setRejectionModalOpen(false);
                setRejectingId(null);
                setRejectionReason('');
            }
            fetchRequests();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const filteredRequests = requests.filter(req =>
        req.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.enrollNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) return null;

    return (
        <div className="container">
            <div className="header">
                <div className="welcome-text">Welcome <b>{user.fullName}</b> · {user.role.toUpperCase()}</div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={handleLogout}>Sign out</button>
                </div>
            </div>

            <div className="table-section">
                <div className="table-header">
                    <h2>Gate Pass Approval Queue</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search Name/Enroll..."
                            style={{ width: '200px', padding: '6px 12px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="form-control"
                            style={{ width: '150px', padding: '6px 12px' }}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="pending">Pending</option>
                            <option value="hod_approved">HOD Approved</option>
                            <option value="principal_approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="used">Used</option>
                            <option value="">All</option>
                        </select>
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
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr><td colSpan={8} className="empty-state">No requests matching criteria.</td></tr>
                            ) : filteredRequests.map((req) => (
                                <tr key={req._id}>
                                    <td>
                                        <div className="photo-thumb" style={{ backgroundImage: req.photo ? `url(${req.photo})` : 'none' }}>
                                            {!req.photo && req.fullName.charAt(0)}
                                        </div>
                                    </td>
                                    <td>{req.fullName}</td>
                                    <td>{req.enrollNo}</td>
                                    <td>{req.date}</td>
                                    <td>{req.outTime} - {req.inTime}</td>
                                    <td>{req.reason}</td>
                                    <td><span className={`status status-${req.status}`}>{req.status.replace('_', ' ')}</span></td>
                                    <td>
                                        <div className="action-group">
                                            {((role === 'hod' && req.hodApproval.status === 'waiting') ||
                                                (role === 'principal' && req.principalApproval.status === 'waiting' && req.hodApproval.status === 'approved')) ? (
                                                <>
                                                    <button className="btn btn-success btn-sm" onClick={() => handleAction(req._id, 'approved')}>Approve</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => { setRejectingId(req._id); setRejectionModalOpen(true); }}>Reject</button>
                                                </>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: '#666' }}>Processed</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {rejectionModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card" style={{ maxWidth: '400px' }}>
                        <h2>Reject Request</h2>
                        <div className="form-group" style={{ marginTop: '20px', marginBottom: '20px' }}>
                            <label className="form-label">Reason for rejection</label>
                            <textarea
                                className="form-control"
                                rows={3}
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Please provide a reason..."
                            ></textarea>
                        </div>
                        <div className="modal-buttons">
                            <button className="btn btn-outline" onClick={() => { setRejectionModalOpen(false); setRejectingId(null); setRejectionReason(''); }}>Cancel</button>
                            <button className="btn btn-danger" onClick={() => handleAction(rejectingId!, 'rejected', rejectionReason)}>Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
