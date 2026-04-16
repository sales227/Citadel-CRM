import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall, getQuotations, getCustomers, getLeads, approveQuotation, deleteQuotations } from '../api/apiService';
import { CheckCircle2, FileText, Download, Edit, Search, Trash2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QuotationsPage() {
    const { user, isAdmin } = useAuth();

    const [quotations, setQuotations] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    const [dateFilter, setDateFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    // Delete modal state
    const [selectedQuotationIds, setSelectedQuotationIds] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
            const handleDeleteQuotation = (quotationId) => {
                setSelectedQuotationIds([quotationId]);
                setShowDeleteModal(true);
            };

            const handleDeleteSelected = async () => {
                setDeleting(true);
                try {
                    await deleteQuotations(selectedQuotationIds, user?.UserID);
                    setQuotations(qs => qs.filter(q => !selectedQuotationIds.includes(q.QuotationID)));
                    setShowDeleteModal(false);
                    setSelectedQuotationIds([]);
                } catch (e) {
                    alert("Delete failed: " + (e.message || "Unknown error"));
                } finally {
                    setDeleting(false);
                }
            };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [qRes, cRes, lRes] = await Promise.all([
                getQuotations(),
                getCustomers(),
                getLeads(isAdmin ? {} : { assignedUser: user?.UserID })
            ]);

            // If staff, only show quotes linked to their leads
            if (!isAdmin) {
                const staffLeadIds = lRes.map(l => l.LeadID);
                setQuotations(qRes.filter(q => staffLeadIds.includes(q.LeadID)));
            } else {
                setQuotations(qRes);
            }
            setCustomers(cRes);
            setLeads(lRes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (qId) => {
        try {
            await approveQuotation(qId);
            setQuotations(quo => quo.map(q => q.QuotationID === qId ? { ...q, "ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)": "Approved" } : q));
        } catch (e) {
            alert("Failed to approve");
        }
    };

    const filtered = quotations.filter(q => {
        const sMatch = statusFilter === 'All' || q['ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'] === statusFilter;
        let dMatch = true;
        if (dateFilter !== 'All') {
            const qDate = new Date(q.QuotationDate);
            const today = new Date();
            if (dateFilter === 'This Month') {
                dMatch = qDate.getMonth() === today.getMonth() && qDate.getFullYear() === today.getFullYear();
            } else if (dateFilter === 'Last Month') {
                const lastMonth = new Date(today); lastMonth.setMonth(lastMonth.getMonth() - 1);
                dMatch = qDate.getMonth() === lastMonth.getMonth() && qDate.getFullYear() === lastMonth.getFullYear();
            }
        }
        return sMatch && dMatch;
    });

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading quotations...</div>;

    return (
        <div className="space-y-6">

            {/* Top Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-primary" /> Quotations Dashboard</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 bg-white rounded-md text-sm font-bold focus:ring-primary focus:border-primary">
                        <option value="All">All Statuses</option>
                        <option value="PendingApproval">Pending Approval</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="NotRequired">Not Required</option>
                    </select>
                    <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="px-3 py-2 border border-gray-300 bg-white rounded-md text-sm font-bold focus:ring-primary focus:border-primary">
                        <option value="All">All Time</option>
                        <option value="This Month">This Month</option>
                        <option value="Last Month">Last Month</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Quotation ID</th>
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold">Value</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Approval Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(q => {
                                const c = customers.find(x => x.CustomerID === q.CustomerID);
                                const status = q['ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'];

                                return (
                                    <tr key={q.QuotationID} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{q.QuotationID}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">{c?.CustomerName || 'Unkown'}</p>
                                            <Link to={`/leads/${q.LeadID}`} className="text-xs text-primary font-bold hover:underline">View Lead</Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-black text-gray-900">₹{q.QuotedPrice}</p>
                                            <p className="text-xs text-gray-500">₹{q.QuotedPricePerUnit} / {q.Unit}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">{new Date(q.QuotationDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wide
                        ${status === 'PendingApproval' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                    status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' :
                                                        status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                                                            'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                {status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {isAdmin && status === 'PendingApproval' && (
                                                    <>
                                                        <button onClick={() => handleApprove(q.QuotationID)} className="bg-green-50 hover:bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded text-xs border border-green-200 transition-colors">Approve</button>
                                                        <button className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-3 py-1.5 rounded text-xs border border-red-200 transition-colors">Reject</button>
                                                    </>
                                                )}
                                                {q.DriveFileURL && (
                                                    <a href={q.DriveFileURL} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded" title="Download PDF"><Download size={16} /></a>
                                                )}
                                                <button onClick={() => handleDeleteQuotation(q.QuotationID)} className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors" title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                                {/* Delete Quotation Modal */}
                                                {showDeleteModal && (
                                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                                                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                                                            <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
                                                                <AlertCircle size={18} className="text-red-600" />
                                                                <h2 className="text-base font-bold text-red-900">Delete {selectedQuotationIds.length} quotation{selectedQuotationIds.length > 1 ? 's' : ''}?</h2>
                                                            </div>
                                                            <div className="p-6">
                                                                <p className="text-sm text-gray-600">This action cannot be undone. The selected quotation(s) and all related orders and payments will be permanently removed from the system.</p>
                                                            </div>
                                                            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
                                                                <button type="button" onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold">Cancel</button>
                                                                <button type="button" onClick={handleDeleteSelected} className="px-6 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 shadow-sm flex items-center gap-2" disabled={deleting}><Trash2 size={16} /> Delete</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                    </tr>
                                )
                            })}
                            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">No quotations found matching filters.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}