import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { getPayments, getCustomers, updatePayment, approveCredit, deletePayments } from '../api/apiService';
import { CreditCard, CheckCircle2, Clock, AlertTriangle, TrendingUp, Pencil, Trash2, X } from 'lucide-react';

export default function PaymentsPage() {
    const { user, isAdmin } = useAuth();
    const [searchParams] = useSearchParams();
    const [payments, setPayments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');

    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
    const [showOverdueOnly, setShowOverdueOnly] = useState(searchParams.get('overdue') === 'true');

    // Edit modal state
    const [editingPayment, setEditingPayment] = useState(null);
    const [editForm, setEditForm] = useState({ PaidAmount: '', InvoiceNumber: '', DueDate: '' });
    const [editSubmitting, setEditSubmitting] = useState(false);

    // Delete modal state
    const [deletingPaymentId, setDeletingPaymentId] = useState(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, cRes] = await Promise.all([getPayments(), getCustomers()]);
            // Simple role filtering -> ideally we should filter orders by staff, then payments.
            // But for display layout logic assume Admin looks at this route usually.
            setPayments(pRes);
            setCustomers(cRes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

    const handleMarkPaid = async (pId, total) => {
        try {
            await updatePayment(pId, { PaidAmount: total });
            setPayments(pay => pay.map(p =>
                p.PaymentID === pId
                    ? { ...p, PaidAmount: total, OutstandingAmount: '0.00', 'PaymentStatus (Pending/Partial/Paid)': 'Paid' }
                    : p
            ));
            showToast('Payment marked as Paid');
        } catch (e) {
            alert('Failed recording payment');
        }
    };

    const handleApproveCredit = async (pId) => {
        try {
            await approveCredit(pId);
            setPayments(pay => pay.map(p =>
                p.PaymentID === pId
                    ? { ...p, 'CreditApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)': 'Approved' }
                    : p
            ));
            showToast('Credit approved');
        } catch (e) {
            alert('Failed approving credit limit');
        }
    };

    const openEditModal = (p) => {
        setEditingPayment(p);
        setEditForm({
            PaidAmount: p.PaidAmount,
            InvoiceNumber: p.InvoiceNumber,
            DueDate: p.DueDate ? new Date(p.DueDate).toISOString().split('T')[0] : ''
        });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingPayment) return;
        setEditSubmitting(true);
        try {
            const total = parseFloat(editingPayment.TotalAmount) || 0;
            const paid = parseFloat(editForm.PaidAmount) || 0;
            const outstanding = Math.max(0, total - paid).toFixed(2);
            let status = 'Pending';
            if (paid >= total && total > 0) status = 'Paid';
            else if (paid > 0) status = 'Partial';

            await updatePayment(editingPayment.PaymentID, {
                PaidAmount: paid,
                InvoiceNumber: editForm.InvoiceNumber,
                DueDate: editForm.DueDate,
                OutstandingAmount: outstanding,
                'PaymentStatus (Pending/Partial/Paid)': status
            });

            setPayments(prev => prev.map(p =>
                p.PaymentID === editingPayment.PaymentID
                    ? { ...p, PaidAmount: paid, InvoiceNumber: editForm.InvoiceNumber, DueDate: editForm.DueDate, OutstandingAmount: outstanding, 'PaymentStatus (Pending/Partial/Paid)': status }
                    : p
            ));
            setEditingPayment(null);
            showToast('Payment updated successfully');
        } catch (err) {
            alert('Failed to update payment');
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingPaymentId) return;
        setDeleteSubmitting(true);
        try {
            await deletePayments([deletingPaymentId], user?.UserID);
            setPayments(prev => prev.filter(p => p.PaymentID !== deletingPaymentId));
            setDeletingPaymentId(null);
            showToast('Payment deleted');
        } catch (e) {
            alert('Failed to delete payment');
        } finally {
            setDeleteSubmitting(false);
        }
    };

    const todayZero = new Date().setHours(0, 0, 0, 0);

    const filtered = payments.filter(p => {
        const sMatch = statusFilter === 'All' || p['PaymentStatus (Pending/Partial/Paid)'] === statusFilter;
        let oMatch = true;
        if (showOverdueOnly) {
            const d = new Date(p.DueDate).getTime();
            oMatch = d < todayZero && p['PaymentStatus (Pending/Partial/Paid)'] !== 'Paid';
        }
        return sMatch && oMatch;
    });

    // Calculate Metrics
    const metrics = payments.reduce((acc, p) => {
        if (p['PaymentStatus (Pending/Partial/Paid)'] !== 'Paid') {
            acc.outstanding += parseFloat(p.OutstandingAmount || 0);
            const d = new Date(p.DueDate).getTime();
            if (d < todayZero) acc.overdue += parseFloat(p.OutstandingAmount || 0);
        }
        acc.collected += parseFloat(p.PaidAmount || 0);
        return acc;
    }, { outstanding: 0, overdue: 0, collected: 0 });

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading ledgers...</div>;

    return (
        <div className="space-y-6">

            {toastMessage && (
                <div className="fixed top-20 right-4 z-50 bg-green-50 text-green-800 border border-green-200 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="font-medium text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Metric Cards Top */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-xl shadow-sm border border-brand-200 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Total Outstanding</p>
                        <p className="text-3xl font-black text-gray-900">₹{metrics.outstanding.toFixed(2)}</p>
                    </div>
                    <div className="bg-brand-50 p-3 rounded-full"><Clock size={28} className="text-primary" /></div>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-red-100 flex items-center justify-between hover:shadow-md transition-shadow lg:-mt-2 transform">
                    <div>
                        <p className="text-sm font-bold text-red-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><AlertTriangle size={14} /> Overdue Amount</p>
                        <p className="text-3xl font-black text-red-700">₹{metrics.overdue.toFixed(2)}</p>
                    </div>
                </div>
                <div className="p-6 bg-white rounded-xl shadow-sm border border-brand-300 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-sm font-bold text-brand-700 uppercase tracking-widest mb-1">Total Collected</p>
                        <p className="text-3xl font-black text-gray-900">₹{metrics.collected.toFixed(2)}</p>
                    </div>
                    <div className="bg-brand-100 p-3 rounded-full"><TrendingUp size={28} className="text-brand-700" /></div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><CreditCard className="text-primary" /> Accounts Receivables</h2>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer user-select-none">
                        <input type="checkbox" checked={showOverdueOnly} onChange={() => setShowOverdueOnly(!showOverdueOnly)} className="w-4 h-4 text-red-500 rounded ring-red-500" />
                        <span className="text-red-600">Overdue Only</span>
                    </label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-bold focus:ring-primary focus:border-primary">
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                        <option value="Paid">Paid</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Invoice Details</th>
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold">Financials (₹)</th>
                                <th className="px-6 py-4 font-semibold">Due Date</th>
                                <th className="px-6 py-4 font-semibold">Payment Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(p => {
                                const c = customers.find(x => x.CustomerID === p.CustomerID);
                                const status = p['PaymentStatus (Pending/Partial/Paid)'];
                                const dDate = new Date(p.DueDate);
                                const isOverdue = dDate.getTime() < todayZero && status !== 'Paid';
                                const creditStatus = p['CreditApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'];

                                return (
                                    <tr key={p.PaymentID} className={`transition-colors ${isOverdue ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-gray-50'}`}>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900 border-b border-gray-100 pb-0.5 inline-block">{p.InvoiceNumber}</p>
                                            <p className="text-xs text-gray-500 font-mono mt-1">Ord: {p.OrderID}</p>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-800">{c?.CustomerName}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-between max-w-[140px] text-xs"><span className="text-gray-500">Total:</span><span className="font-bold text-gray-900">{parseFloat(p.TotalAmount).toFixed(2)}</span></div>
                                            <div className="flex justify-between max-w-[140px] text-xs my-0.5"><span className="text-gray-500">Paid:</span><span className="font-bold text-brand-700">{parseFloat(p.PaidAmount).toFixed(2)}</span></div>
                                            <div className="flex justify-between max-w-[140px] text-xs pt-0.5 border-t border-gray-100"><span className="text-gray-500">Dues:</span><span className={`font-black ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>{parseFloat(p.OutstandingAmount).toFixed(2)}</span></div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className={`font-bold ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>{dDate.toLocaleDateString()}</p>
                                            {isOverdue && <p className="text-[10px] font-black uppercase text-red-500 tracking-widest mt-0.5">Overdue</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wide
                        ${status === 'Pending' ? 'bg-brand-50 text-blue-700 border-brand-200' :
                                                    status === 'Partial' ? 'bg-brand-100 text-brand-800 border-brand-300' :
                                                        'bg-primary text-white border-primary'}`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end gap-2">
                                                {status !== 'Paid' && (
                                                    <button onClick={() => handleMarkPaid(p.PaymentID, p.TotalAmount)} className="bg-white border border-primary text-primary hover:bg-brand-50 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm whitespace-nowrap">
                                                        Mark Paid
                                                    </button>
                                                )}
                                                {isAdmin && creditStatus === 'PendingApproval' && (
                                                    <button onClick={() => handleApproveCredit(p.PaymentID)} className="bg-brand-100 border border-brand-300 text-brand-800 hover:bg-brand-200 px-3 py-1.5 rounded text-[10px] font-black tracking-widest uppercase transition-colors shadow-sm text-center">
                                                        Approve Credit
                                                    </button>
                                                )}
                                                <div className="flex gap-1 mt-1">
                                                    <button onClick={() => openEditModal(p)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded transition-colors" title="Edit Payment">
                                                        <Pencil size={14} />
                                                    </button>
                                                    {isAdmin && (
                                                        <button onClick={() => setDeletingPaymentId(p.PaymentID)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Payment">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">No payment ledgers found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- EDIT PAYMENT MODAL --- */}
            {editingPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2"><Pencil size={16} /> Edit Payment</h2>
                            <button onClick={() => setEditingPayment(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-full"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Invoice Number</label>
                                <input
                                    type="text"
                                    value={editForm.InvoiceNumber}
                                    onChange={e => setEditForm({ ...editForm, InvoiceNumber: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Total Amount (₹)</label>
                                <input
                                    type="number"
                                    value={editingPayment.TotalAmount}
                                    disabled
                                    className="w-full border border-gray-200 bg-gray-50 rounded px-3 py-2 text-sm text-gray-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Amount Paid (₹) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    min="0"
                                    max={editingPayment.TotalAmount}
                                    step="0.01"
                                    value={editForm.PaidAmount}
                                    onChange={e => setEditForm({ ...editForm, PaidAmount: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                                    required
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Outstanding: ₹{Math.max(0, parseFloat(editingPayment.TotalAmount) - parseFloat(editForm.PaidAmount || 0)).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={editForm.DueDate}
                                    onChange={e => setEditForm({ ...editForm, DueDate: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setEditingPayment(null)} className="px-4 py-2 border border-gray-300 rounded font-bold text-sm">Cancel</button>
                                <button type="submit" disabled={editSubmitting} className="px-5 py-2 bg-primary text-white rounded font-bold text-sm hover:bg-blue-800 disabled:opacity-50">
                                    {editSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- DELETE PAYMENT MODAL --- */}
            {deletingPaymentId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
                            <AlertTriangle size={18} className="text-red-600" />
                            <h2 className="text-base font-bold text-red-900">Delete Payment?</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600">This payment record will be permanently deleted. This action cannot be undone.</p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
                            <button onClick={() => setDeletingPaymentId(null)} disabled={deleteSubmitting} className="px-4 py-2 border rounded font-bold text-sm">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteSubmitting} className="px-5 py-2 bg-red-600 text-white rounded font-bold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5">
                                <Trash2 size={14} /> {deleteSubmitting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}