// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { API_URL } from '@/utils/api';

// export default function StudentDashboard() {
//     const [user, setUser] = useState<any>(null);
//     const [requests, setRequests] = useState<any[]>([]);
//     const [isModalOpen, setIsModalOpen] = useState(false);
//     const [editingRequest, setEditingRequest] = useState<any>(null);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [filterStatus, setFilterStatus] = useState('');
//     const [loading, setLoading] = useState(true);
//     const [viewingReason, setViewingReason] = useState<string | null>(null);

//     const [formData, setFormData] = useState({
//         photo: '',
//         fullName: '',
//         enrollNo: '',
//         phone: '',
//         email: '',
//         outTime: '',
//         inTime: '',
//         date: '',
//         reason: ''
//     });

//     const router = useRouter();

//     const format24To12 = (time24: string) => {
//         if (!time24) return '';
//         const [hours, minutes] = time24.split(':');
//         let h = parseInt(hours, 10);
//         const ampm = h >= 12 ? 'PM' : 'AM';
//         h = h % 12;
//         h = h ? h : 12;
//         const m = minutes.padStart(2, '0');
//         return `${h}:${m} ${ampm}`;
//     };

//     useEffect(() => {
//         const storedUser = localStorage.getItem('user');
//         const token = localStorage.getItem('token');
//         if (!storedUser || !token) {
//             router.push('/');
//             return;
//         }
//         const parsedUser = JSON.parse(storedUser);
//         setUser(parsedUser);
//         setFormData(prev => ({
//             ...prev,
//             fullName: parsedUser.fullName,
//             enrollNo: parsedUser.loginId,
//             email: parsedUser.email
//         }));
//         fetchRequests();
//     }, []);

//     const fetchRequests = async () => {
//         try {
//             setLoading(true);
//             const token = localStorage.getItem('token');
//             const res = await fetch(`${API_URL}/gatepass/my-requests${filterStatus ? `?status=${filterStatus}` : ''}`, {
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             const data = await res.json();
//             setRequests(data);
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         if (user) fetchRequests();
//     }, [filterStatus]);

//     const handleLogout = () => {
//         localStorage.clear();
//         router.push('/');
//     };

//     const handlePhotoChange = (e: any) => {
//         const file = e.target.files[0];
//         if (file) {
//             const reader = new FileReader();
//             reader.onload = (event: any) => {
//                 setFormData({ ...formData, photo: event.target.result });
//             };
//             reader.readAsDataURL(file);
//         }
//     };

//     const handleSubmit = async () => {
//         try {
//             const token = localStorage.getItem('token');
//             const method = editingRequest ? 'PATCH' : 'POST';
//             const url = editingRequest
//                 ? `${API_URL}/gatepass/${editingRequest._id}`
//                 : `${API_URL}/gatepass/apply`;

//             const res = await fetch(url, {
//                 method,
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 },
//                 body: JSON.stringify(formData)
//             });

//             if (!res.ok) throw new Error('Failed to save request');

//             alert(editingRequest ? 'Request updated' : 'Request submitted');
//             setIsModalOpen(false);
//             setEditingRequest(null);
//             fetchRequests();
//         } catch (err: any) {
//             alert(err.message);
//         }
//     };

//     const handleDelete = async (id: string) => {
//         if (!confirm('Are you sure you want to delete this request?')) return;
//         try {
//             const token = localStorage.getItem('token');
//             const res = await fetch(`${API_URL}/gatepass/${id}`, {
//                 method: 'DELETE',
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (!res.ok) throw new Error('Failed to delete');
//             fetchRequests();
//         } catch (err: any) {
//             alert(err.message);
//         }
//     };

//     const openEditModal = (req: any) => {
//         setEditingRequest(req);
//         setFormData({
//             photo: req.photo || '',
//             fullName: req.fullName,
//             enrollNo: req.enrollNo,
//             phone: req.phone,
//             email: req.email,
//             outTime: req.outTime,
//             inTime: req.inTime,
//             date: req.date,
//             reason: req.reason
//         });
//         setIsModalOpen(true);
//     };

//     const filteredRequests = requests.filter(req =>
//         req.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         req.enrollNo.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     if (!user) return null;

//     return (
//         <div className="container">
//             <div className="header">
//                 <div className="welcome-text">Welcome <b>{user.fullName}</b> · {user.role}</div>
//                 <div className="header-actions">
//                     <button className="btn btn-primary" onClick={() => { setEditingRequest(null); setIsModalOpen(true); }}>+ Request Gate Pass</button>
//                     <button className="btn btn-outline" onClick={handleLogout}>Sign out</button>
//                 </div>
//             </div>

//             <div className="table-section">
//                 <div className="table-header">
//                     <h2>My Gate Pass Requests</h2>
//                     <div style={{ display: 'flex', gap: '10px' }}>
//                         <input
//                             type="text"
//                             className="form-control"
//                             placeholder="Search..."
//                             style={{ width: '200px', padding: '6px 12px' }}
//                             value={searchTerm}
//                             onChange={(e) => setSearchTerm(e.target.value)}
//                         />
//                         <select
//                             className="form-control"
//                             style={{ width: '150px', padding: '6px 12px' }}
//                             value={filterStatus}
//                             onChange={(e) => setFilterStatus(e.target.value)}
//                         >
//                             <option value="">All Status</option>
//                             <option value="pending">Pending</option>
//                             <option value="hod_approved">HOD Approved</option>
//                             <option value="principal_approved">Approved</option>
//                             <option value="rejected">Rejected</option>
//                             <option value="used">Used</option>
//                         </select>
//                     </div>
//                 </div>

//                 <div className="table-container">
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>Photo</th>
//                                 <th>Name</th>
//                                 <th>Enroll</th>
//                                 <th>Date</th>
//                                 <th>Out/In</th>
//                                 <th>Status</th>
//                                 <th>HOD</th>
//                                 <th>Principal</th>
//                                 <th>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {loading ? (
//                                 <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
//                             ) : filteredRequests.length === 0 ? (
//                                 <tr><td colSpan={9} className="empty-state">No requests found.</td></tr>
//                             ) : filteredRequests.map((req) => (
//                                 <tr key={req._id}>
//                                     <td>
//                                         <div className="photo-thumb" style={{ backgroundImage: req.photo ? `url(${req.photo})` : 'none' }}>
//                                             {!req.photo && req.fullName.charAt(0)}
//                                         </div>
//                                     </td>
//                                     <td>{req.fullName}</td>
//                                     <td>{req.enrollNo}</td>
//                                     <td>{req.date}</td>
//                                     <td>{format24To12(req.outTime)} - {format24To12(req.inTime)}</td>
//                                     <td>
//                                         <span className={`status status-${req.status}`}>{req.status.replace('_', ' ')}</span>
//                                         {req.status === 'rejected' && req.rejectionReason && (
//                                             <div style={{ marginTop: '6px' }}>
//                                                 <button className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={() => setViewingReason(req.rejectionReason)}>View Reason</button>
//                                             </div>
//                                         )}
//                                     </td>
//                                     <td><span className={`status status-${req.hodApproval.status}`}>{req.hodApproval.status}</span></td>
//                                     <td><span className={`status status-${req.principalApproval.status}`}>{req.principalApproval.status}</span></td>
//                                     <td>
//                                         <div className="action-group">
//                                             {req.status === 'pending' && (
//                                                 <>
//                                                     <button className="btn btn-warning btn-sm" onClick={() => openEditModal(req)}>Edit</button>
//                                                     <button className="btn btn-danger btn-sm" onClick={() => handleDelete(req._id)}>Delete</button>
//                                                 </>
//                                             )}
//                                             {req.status !== 'pending' && <span style={{ fontSize: '12px', color: '#666' }}>Locked</span>}
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>

//             {isModalOpen && (
//                 <div className="modal-overlay">
//                     <div className="modal-card">
//                         <h2>{editingRequest ? 'Edit Request' : 'New Gate Pass Request'}</h2>
//                         <div className="form-grid">
//                             {/* <div className="full-width photo-upload">
//                                 <label className="form-label">Photo</label>
//                                 <div className="preview-row">
//                                     <div className="preview-circle" style={{ backgroundImage: formData.photo ? `url(${formData.photo})` : 'none' }}></div>
//                                     <input type="file" accept="image/*" className="form-control" onChange={handlePhotoChange} style={{ flex: 1 }} />
//                                 </div>
//                             </div> */}
//                             <div>
//                                 <label className="form-label">Full Name</label>
//                                 <input type="text" className="form-control" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
//                             </div>
//                             <div>
//                                 <label className="form-label">Enroll No</label>
//                                 <input type="text" className="form-control" value={formData.enrollNo} onChange={(e) => setFormData({ ...formData, enrollNo: e.target.value })} />
//                             </div>
//                             <div>
//                                 <label className="form-label">Phone</label>
//                                 <input type="text" className="form-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
//                             </div>
//                             <div>
//                                 <label className="form-label">Email</label>
//                                 <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
//                             </div>
//                             <div>
//                                 <label className="form-label">Out Time</label>
//                                 <input type="time" className="form-control" value={formData.outTime} onChange={(e) => setFormData({ ...formData, outTime: e.target.value })} />
//                             </div>
//                             <div>
//                                 <label className="form-label">In Time</label>
//                                 <input type="time" className="form-control" value={formData.inTime} onChange={(e) => setFormData({ ...formData, inTime: e.target.value })} />
//                             </div>
//                             <div>
//                                 <label className="form-label">Date</label>
//                                 <input type="date" className="form-control" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
//                             </div>
//                             <div className="full-width">
//                                 <label className="form-label">Reason</label>
//                                 <textarea className="form-control" rows={2} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}></textarea>
//                             </div>
//                         </div>
//                         <div className="modal-buttons">
//                             <button className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
//                             <button className="btn btn-primary" onClick={handleSubmit}>Submit Request</button>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {viewingReason && (
//                 <div className="modal-overlay">
//                     <div className="modal-card" style={{ maxWidth: '400px' }}>
//                         <h2>Rejection Reason</h2>
//                         <div style={{ padding: '15px', background: '#fff3f3', border: '1px solid #ffcdd2', borderRadius: '8px', marginTop: '15px', marginBottom: '20px', color: '#d32f2f' }}>
//                             {viewingReason}
//                         </div>
//                         <div className="modal-buttons" style={{ justifyContent: 'center' }}>
//                             <button className="btn btn-outline" onClick={() => setViewingReason(null)}>Close</button>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }









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
            <style jsx>{`
                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                }

                /* Header Styles */
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding: 15px 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 12px;
                    color: white;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .welcome-text {
                    font-size: 1.1rem;
                    color: #fff;
                }

                .welcome-text b {
                    color: #ffd700;
                }

                .header-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }

                /* Button Styles */
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                }

                .btn-primary {
                    background: white;
                    color: #667eea;
                }

                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }

                .btn-outline {
                    background: transparent;
                    border: 2px solid white;
                    color: white;
                }

                .btn-outline:hover {
                    background: white;
                    color: #667eea;
                }

                .btn-warning {
                    background: #ffc107;
                    color: #333;
                }

                .btn-warning:hover {
                    background: #ffb300;
                }

                .btn-danger {
                    background: #dc3545;
                    color: white;
                }

                .btn-danger:hover {
                    background: #c82333;
                }

                .btn-sm {
                    padding: 6px 12px;
                    font-size: 12px;
                }

                /* Table Section */
                .table-section {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    overflow: hidden;
                }

                .table-header {
                    padding: 20px;
                    background: #f8f9fa;
                    border-bottom: 1px solid #e9ecef;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .table-header h2 {
                    margin: 0;
                    font-size: 1.3rem;
                    color: #333;
                }

                /* Form Controls */
                .form-control {
                    padding: 8px 12px;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.3s;
                }

                .form-control:focus {
                    outline: none;
                    border-color: #667eea;
                }

                /* Table Styles */
                .table-container {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 800px;
                }

                th, td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #e9ecef;
                }

                th {
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #495057;
                }

                tr:hover {
                    background: #f8f9fa;
                }

                .photo-thumb {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    background-size: cover;
                    background-position: center;
                }

                /* Status Badges */
                .status {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .status-pending {
                    background: #fff3cd;
                    color: #856404;
                }

                .status-hod_approved {
                    background: #d1ecf1;
                    color: #0c5460;
                }

                .status-principal_approved, .status-approved {
                    background: #d4edda;
                    color: #155724;
                }

                .status-rejected {
                    background: #f8d7da;
                    color: #721c24;
                }

                .status-used {
                    background: #e2e3e5;
                    color: #383d41;
                }

                .action-group {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #6c757d;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }

                .modal-card {
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                }

                .modal-card h2 {
                    margin-top: 0;
                    margin-bottom: 20px;
                    color: #333;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin-bottom: 25px;
                }

                .full-width {
                    grid-column: span 2;
                }

                .form-label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #495057;
                    font-size: 14px;
                }

                textarea.form-control {
                    resize: vertical;
                    min-height: 80px;
                }

                .modal-buttons {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }

                .preview-row {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .preview-circle {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: #e9ecef;
                    background-size: cover;
                    background-position: center;
                }

                /* Responsive Breakpoints */
                @media (max-width: 768px) {
                    .container {
                        padding: 10px;
                    }

                    .header {
                        flex-direction: column;
                        text-align: center;
                    }

                    .header-actions {
                        width: 100%;
                        justify-content: center;
                    }

                    .table-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .table-header > div {
                        flex-direction: column;
                    }

                    .form-grid {
                        grid-template-columns: 1fr;
                        gap: 12px;
                    }

                    .full-width {
                        grid-column: span 1;
                    }

                    .modal-card {
                        padding: 20px;
                        margin: 10px;
                    }

                    .btn {
                        padding: 8px 16px;
                        font-size: 13px;
                    }
                }

                @media (max-width: 480px) {
                    .welcome-text {
                        font-size: 0.9rem;
                    }

                    .table-header h2 {
                        font-size: 1.1rem;
                    }

                    .form-control, select.form-control {
                        font-size: 16px; /* Prevents zoom on mobile */
                    }

                    .modal-buttons {
                        flex-direction: column;
                    }

                    .modal-buttons .btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .action-group {
                        flex-direction: column;
                    }

                    .action-group .btn-sm {
                        width: 100%;
                    }
                }

                @media (max-width: 1024px) and (min-width: 769px) {
                    .container {
                        padding: 15px;
                    }
                }

                /* Scrollbar Styling */
                .table-container::-webkit-scrollbar {
                    height: 8px;
                }

                .table-container::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }

                .table-container::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 10px;
                }

                .table-container::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }

                /* Loading State */
                .loading-state {
                    text-align: center;
                    padding: 40px;
                    color: #6c757d;
                }

                /* Photo Upload Section */
                .photo-upload {
                    margin-bottom: 10px;
                }
            `}</style>

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
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search..."
                            style={{ width: '200px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="form-control"
                            style={{ width: '150px' }}
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
                                {/* <th>Photo</th> */}
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
                                <tr><td colSpan={9} className="loading-state">Loading...</td></tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr><td colSpan={9} className="empty-state">No requests found.</td></tr>
                            ) : filteredRequests.map((req) => (
                                <tr key={req._id}>
                                    {/* <td>
                                        <div className="photo-thumb" style={{ backgroundImage: req.photo ? `url(${req.photo})` : 'none' }}>
                                            {!req.photo && req.fullName.charAt(0)}
                                        </div>
                                    </td> */}
                                    <td>{req.fullName}</td>
                                    <td>{req.enrollNo}</td>
                                    <td>{req.date}</td>
                                    <td>{format24To12(req.outTime)} - {format24To12(req.inTime)}</td>
                                    <td>
                                        <span className={`status status-${req.status}`}>{req.status.replace('_', ' ')}</span>
                                        {req.status === 'rejected' && req.rejectionReason && (
                                            <div style={{ marginTop: '6px' }}>
                                                <button className="btn btn-outline btn-sm" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={() => setViewingReason(req.rejectionReason)}>View Reason</button>
                                            </div>
                                        )}
                                    </td>
                                    <td><span className={`status status-${req.hodApproval?.status || 'pending'}`}>{req.hodApproval?.status || 'pending'}</span></td>
                                    <td><span className={`status status-${req.principalApproval?.status || 'pending'}`}>{req.principalApproval?.status || 'pending'}</span></td>
                                    <td>
                                        <div className="action-group">
                                            {req.status === 'pending' && (
                                                <>
                                                    <button className="btn btn-warning btn-sm" onClick={() => openEditModal(req)}>Edit</button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(req._id)}>Delete</button>
                                                </>
                                            )}
                                            {req.status !== 'pending' && <span style={{ fontSize: '12px', color: '#666' }}>Locked</span>}
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
                            {/* <div className="full-width photo-upload">
                                <label className="form-label">Photo</label>
                                <div className="preview-row">
                                    <div className="preview-circle" style={{ backgroundImage: formData.photo ? `url(${formData.photo})` : 'none' }}></div>
                                    <input type="file" accept="image/*" className="form-control" onChange={handlePhotoChange} style={{ flex: 1 }} />
                                </div>
                            </div> */}
                            <div>
                                <label className="form-label">Full Name</label>
                                <input type="text" className="form-control" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Enroll No</label>
                                <input type="text" className="form-control" value={formData.enrollNo} onChange={(e) => setFormData({ ...formData, enrollNo: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Phone</label>
                                <input type="text" className="form-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Email</label>
                                <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Out Time</label>
                                <input type="time" className="form-control" value={formData.outTime} onChange={(e) => setFormData({ ...formData, outTime: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">In Time</label>
                                <input type="time" className="form-control" value={formData.inTime} onChange={(e) => setFormData({ ...formData, inTime: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Date</label>
                                <input type="date" className="form-control" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="full-width">
                                <label className="form-label">Reason</label>
                                <textarea className="form-control" rows={2} value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}></textarea>
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