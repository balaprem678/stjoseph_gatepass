'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/utils/api';
import './approvaldashboard.scss';

type DashboardRole = 'hod' | 'principal';

interface ApprovalDashboardProps {
    role: DashboardRole;
}

interface ApprovalState {
    status: 'waiting' | 'approved' | 'rejected' | 'not_required';
    date?: string;
}

interface GatePassRequest {
    _id: string;
    photo?: string;
    fullName: string;
    enrollNo: string;
    date: string;
    outTime?: string;
    inTime?: string;
    reason: string;
    userRole: 'student' | 'staff' | string;
    status: string;
    rejectionReason?: string;
    hodApproval?: ApprovalState;
    principalApproval?: ApprovalState;
}

interface StoredUser {
    fullName: string;
    role: string;
}

export default function ApprovalDashboard({ role }: ApprovalDashboardProps) {
    const [user, setUser] = useState<StoredUser | null>(null);
    const [requests, setRequests] = useState<GatePassRequest[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'student' | 'staff'>('student');
    const [filterStatus, setFilterStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [viewingReason, setViewingReason] = useState<string | null>(null);
    const [viewingReasonId, setViewingReasonId] = useState<string | null>(null);
    const [smsSent, setSmsSent] = useState(false);

    const router = useRouter();

    const format24To12 = (time24?: string) => {
        if (!time24) return '';
        const [hours = '0', minutes = '0'] = time24.split(':');
        const parsedHours = Number.parseInt(hours, 10);

        if (Number.isNaN(parsedHours)) {
            return time24;
        }

        let h = parsedHours % 12;
        h = h || 12;
        const ampm = parsedHours >= 12 ? 'PM' : 'AM';
        const m = minutes.padStart(2, '0');

        return `${h}:${m} ${ampm}`;
    };

    const resetRejectionModal = () => {
        setRejectionModalOpen(false);
        setRejectingId(null);
        setRejectionReason('');
    };

    const handleViewRejectionReason = async (reason: string, requestId: string) => {
        setViewingReason(reason);
        setViewingReasonId(requestId);
        setSmsSent(false);

        // Send SMS notification to mobile
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/gatepass/${requestId}/send-rejection-sms`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setSmsSent(true);
            }
        } catch (err: unknown) {
            console.error('Failed to send SMS:', err);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!storedUser || !token) {
            router.push('/');
            return;
        }

        try {
            setUser(JSON.parse(storedUser) as StoredUser);
        } catch {
            handleLogout();
        }
    }, [router]);

    const fetchRequests = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            const query = filterStatus ? `?status=${encodeURIComponent(filterStatus)}` : '';
            const res = await fetch(`${API_URL}/gatepass/all${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error('Failed to load requests');
            }

            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'Failed to load requests');
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => {
        if (user) {
            void fetchRequests();
        }
    }, [user, fetchRequests]);

    const handleAction = async (id: string, decision: 'approved' | 'rejected', reason = '') => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/gatepass/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ decision, rejectionReason: reason })
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => null);
                throw new Error(payload?.message || 'Action failed');
            }

            alert(`Request ${decision}`);
            if (decision === 'rejected') {
                resetRejectionModal();
            }

            void fetchRequests();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Action failed');
        }
    };

    const canTakeAction = (request: GatePassRequest) => {
        if (['rejected', 'used', 'principal_approved'].includes(request.status)) {
            return false;
        }

        if (role === 'principal') {
            return true;
        }

        return role === 'hod' && request.userRole !== 'staff' && request.status === 'pending';
    };

    const filteredRequests = requests.filter((req) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = (
            req.fullName.toLowerCase().includes(search) ||
            req.enrollNo.toLowerCase().includes(search)
        );
        const matchesTab = req.userRole === activeTab;
        return matchesSearch && matchesTab;
    });

    if (!user) return null;

    return (
        <div className="container">
            <div className="header">
                <div className="welcome-text">
                    Welcome <b>{user.fullName}</b> · {user.role.toUpperCase()}
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={handleLogout}>Sign out</button>
                </div>
            </div>

            <div className="table-section">
                <div className="table-header">
                    <div>
                        <h2>Gate Pass Approval Queue</h2>
                        {role === 'principal' && (
                            <div style={{ marginTop: '4px', fontSize: '12px', color: '#6c757d' }}>
                                Principal can approve requests directly without waiting for HOD approval.
                            </div>
                        )}
                    </div>
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
                            <option value="">All</option>
                            <option value="pending">Pending</option>
                            <option value="hod_approved">HOD Approved</option>
                            <option value="principal_approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="used">Used</option>
                        </select>
                    </div>
                </div>

                {role === 'principal' && (
                    <div style={{ padding: '0 20px 15px', display: 'flex', gap: '10px', borderBottom: '1px solid #eee' }}>
                        <button
                            className="btn"
                            style={{
                                background: activeTab === 'student' ? '#667eea' : 'transparent',
                                color: activeTab === 'student' ? 'white' : '#667eea',
                                border: '1px solid #667eea',
                                padding: '6px 16px'
                            }}
                            onClick={() => setActiveTab('student')}
                        >
                            Student Requests
                        </button>
                        <button
                            className="btn"
                            style={{
                                background: activeTab === 'staff' ? '#667eea' : 'transparent',
                                color: activeTab === 'staff' ? 'white' : '#667eea',
                                border: '1px solid #667eea',
                                padding: '6px 16px'
                            }}
                            onClick={() => setActiveTab('staff')}
                        >
                            Staff Requests
                        </button>
                    </div>
                )}

                {error ? (
                    <div className="empty-state" style={{ marginBottom: '16px' }}>{error}</div>
                ) : null}

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Photo</th>
                                <th>Name</th>
                                <th>{activeTab === 'student' ? 'Enroll' : 'Staff ID'}</th>
                                <th>Date</th>
                                <th>Out Time</th>
                                <th>In Time</th>
                                <th>Reason</th>
                                <th>HOD</th>
                                <th>Principal</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={11} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="empty-state">No requests matching criteria.</td>
                                </tr>
                            ) : filteredRequests.map((req) => {
                                const hasActions = canTakeAction(req);

                                return (
                                    <tr key={req._id}>
                                        <td>
                                            <div
                                                className="photo-thumb"
                                                style={{ backgroundImage: req.photo ? `url(${req.photo})` : 'none' }}
                                            >
                                                {!req.photo && req.fullName.charAt(0)}
                                            </div>
                                        </td>
                                        <td>{req.fullName}</td>
                                        <td>{req.enrollNo}</td>
                                        <td>{req.date}</td>
                                        <td>{format24To12(req.outTime)}</td>
                                        <td>{format24To12(req.inTime)}</td>
                                        <td>{req.reason}</td>
                                        <td>
                                            {req.userRole === 'staff' ? (
                                                <span className="status" style={{ background: '#e9ecef', color: '#6c757d' }}>N/A</span>
                                            ) : (
                                                <span className={`status status-${req.hodApproval?.status || 'waiting'}`}>
                                                    {req.hodApproval?.status || 'waiting'}
                                                </span>
                                            )}
                                            {/* {req.hodApproval?.status === 'rejected' && req.rejectionReason && (
                                                <div style={{ marginTop: '6px' }}>
                                                    <button className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={() => handleViewRejectionReason(req.rejectionReason ?? null, req._id)}>View Reason</button>
                                                </div>
                                            )} */}
                                        </td>
                                        <td>
                                            <span className={`status status-${req.principalApproval?.status || 'waiting'}`}>
                                                {req.principalApproval?.status || 'waiting'}
                                            </span>
                                            {/* {req.principalApproval?.status === 'rejected' && req.rejectionReason && (
                                                <div style={{ marginTop: '6px' }}>
                                                    <button className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={() => handleViewRejectionReason(req.rejectionReason ?? null, req._id)}>View Reason</button>
                                                </div>
                                            )} */}
                                        </td>
                                        <td>
                                            <span className={`status status-${req.status}`}>
                                                {req.status.replace('_', ' ')}
                                            </span>
                                            {req.status === 'rejected' && req.rejectionReason && (
                                                <div style={{ marginTop: '6px' }}>
                                                    <button className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={() => handleViewRejectionReason(req.rejectionReason ?? null, req._id)}>
                                                        View Reason
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="action-group">
                                                {hasActions ? (
                                                    <>
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => void handleAction(req._id, 'approved')}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => {
                                                                setRejectingId(req._id);
                                                                setRejectionModalOpen(true);
                                                            }}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: '12px', color: '#666' }}>Processed</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {viewingReason && (
                <div className="modal-overlay">
                    <div className="modal-card" style={{ maxWidth: '400px' }}>
                        <h2>Rejection Reason</h2>
                        <div style={{ padding: '15px', background: '#fff3f3', border: '1px solid #ffcdd2', borderRadius: '8px', marginTop: '15px', marginBottom: '20px', color: '#d32f2f' }}>
                            {viewingReason}
                        </div>
                        {smsSent && (
                            <div style={{ padding: '10px', background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px', marginBottom: '15px', color: '#155724', fontSize: '12px' }}>
                                ✓ SMS reminder sent to student
                            </div>
                        )}
                        <div className="modal-buttons" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-outline" onClick={() => { setViewingReason(null); setViewingReasonId(null); setSmsSent(false); }}>Close</button>
                        </div>
                    </div>
                </div>
            )}

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
                            />
                        </div>
                        <div className="modal-buttons">
                            <button className="btn btn-outline" onClick={resetRejectionModal}>Cancel</button>
                            <button
                                className="btn btn-danger"
                                onClick={() => {
                                    if (!rejectingId) return;
                                    void handleAction(rejectingId, 'rejected', rejectionReason);
                                }}
                                disabled={!rejectingId}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
