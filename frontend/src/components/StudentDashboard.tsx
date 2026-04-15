'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/utils/api';

export default function StudentDashboard() {
    const [user, setUser] = useState<any>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRequest, setEditingRequest] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewingReason, setViewingReason] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        photo: '',
        fullName: '',
        enrollNo: '',
        phone: '',
        email: '',
        outTime: '',
        inTime: '',
        date: '',
        reason: ''
    });

    const router = useRouter();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!storedUser || !token) {
            router.push('/');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setFormData(prev => ({ 
            ...prev, 
            fullName: parsedUser.fullName, 
            enrollNo: parsedUser.loginId,
            email: parsedUser.email
        }));
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/gatepass/my-requests${filterStatus ? `?status=${filterStatus}` : ''}`, {
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

    const handleLogout = () => {
        localStorage.clear();
        router.push('/');
    };

    const handlePhotoChange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event: any) => {
                setFormData({ ...formData, photo: event.target.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            const method = editingRequest ? 'PATCH' : 'POST';
            const url = editingRequest 
                ? `${API_URL}/gatepass/${editingRequest._id}`
                : `${API_URL}/gatepass/apply`;

            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to save request');
            
            alert(editingRequest ? 'Request updated' : 'Request submitted');
            setIsModalOpen(false);
            setEditingRequest(null);
            fetchRequests();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this request?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/gatepass/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete');
            fetchRequests();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const openEditModal = (req: any) => {
        setEditingRequest(req);
        setFormData({
            photo: req.photo || '',
            fullName: req.fullName,
            enrollNo: req.enrollNo,
            phone: req.phone,
            email: req.email,
            outTime: req.outTime,
            inTime: req.inTime,
            date: req.date,
            reason: req.reason
        });
        setIsModalOpen(true);
    };

    const filteredRequests = requests.filter(req => 
        req.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.enrollNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) return null;

    return (
        <div className="container">
            <div className="header">
                <div className="welcome-text">Welcome <b>{user.fullName}</b> · {user.role}</div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => { setEditingRequest(null); setIsModalOpen(true); }}>+ Request Gate Pass</button>
                    <button className="btn btn-outline" onClick={handleLogout}>Sign out</button>
                </div>
            </div>

            <div className="table-section">
                <div className="table-header">
                    <h2>My Gate Pass Requests</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Search..." 
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
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="hod_approved">HOD Approved</option>
                            <option value="principal_approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="used">Used</option>
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
                                <th>Status</th>
                                <th>HOD</th>
                                <th>Principal</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={9} style={{textAlign:'center', padding:'20px'}}>Loading...</td></tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr><td colSpan={9} className="empty-state">No requests found.</td></tr>
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
                                    <td>
                                        <span className={`status status-${req.status}`}>{req.status.replace('_', ' ')}</span>
                                        {req.status === 'rejected' && req.rejectionReason && (
                                            <div style={{ marginTop: '6px' }}>
                                                <button className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={() => setViewingReason(req.rejectionReason)}>View Reason</button>
                                            </div>
                                        )}
                                    </td>
                                    <td><span className={`status status-${req.hodApproval.status}`}>{req.hodApproval.status}</span></td>
                                    <td><span className={`status status-${req.principalApproval.status}`}>{req.principalApproval.status}</span></td>
                                    <td>
                                        <div className="action-group">
                                            {req.status === 'pending' && (
                                                <>
                                                    <button className="btn btn-warning btn-sm" onClick={() => openEditModal(req)}>Edit</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(req._id)}>Delete</button>
                                                </>
                                            )}
                                            {req.status !== 'pending' && <span style={{fontSize:'12px', color:'#666'}}>Locked</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h2>{editingRequest ? 'Edit Request' : 'New Gate Pass Request'}</h2>
                        <div className="form-grid">
                            <div className="full-width photo-upload">
                                <label className="form-label">Photo</label>
                                <div className="preview-row">
                                    <div className="preview-circle" style={{ backgroundImage: formData.photo ? `url(${formData.photo})` : 'none' }}></div>
                                    <input type="file" accept="image/*" className="form-control" onChange={handlePhotoChange} style={{ flex: 1 }} />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Full Name</label>
                                <input type="text" className="form-control" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Enroll No</label>
                                <input type="text" className="form-control" value={formData.enrollNo} onChange={(e) => setFormData({...formData, enrollNo: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Phone</label>
                                <input type="text" className="form-control" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Email</label>
                                <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Out Time</label>
                                <input type="time" className="form-control" value={formData.outTime} onChange={(e) => setFormData({...formData, outTime: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">In Time</label>
                                <input type="time" className="form-control" value={formData.inTime} onChange={(e) => setFormData({...formData, inTime: e.target.value})} />
                            </div>
                            <div>
                                <label className="form-label">Date</label>
                                <input type="date" className="form-control" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div className="full-width">
                                <label className="form-label">Reason</label>
                                <textarea className="form-control" rows={2} value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})}></textarea>
                            </div>
                        </div>
                        <div className="modal-buttons">
                            <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSubmit}>Submit Request</button>
                        </div>
                    </div>
                </div>
            )}

            {viewingReason && (
                <div className="modal-overlay">
                    <div className="modal-card" style={{ maxWidth: '400px' }}>
                        <h2>Rejection Reason</h2>
                        <div style={{ padding: '15px', background: '#fff3f3', border: '1px solid #ffcdd2', borderRadius: '8px', marginTop: '15px', marginBottom: '20px', color: '#d32f2f' }}>
                            {viewingReason}
                        </div>
                        <div className="modal-buttons" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-outline" onClick={() => setViewingReason(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
