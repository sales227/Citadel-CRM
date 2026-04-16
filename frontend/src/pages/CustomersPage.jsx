import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCustomers, getLeads, getUsers, createCustomer, deleteCustomers } from '../api/apiService';
import { getVisibleCustomers } from '../utils/permissions';
import { useSyncData } from '../hooks/useSyncData';
import { Search, Plus, Building2, Phone, Mail, MapPin, Eye, FileText, CheckCircle2, X, Upload, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function CustomersPage() {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const { syncing, getLastSyncDisplay, syncData } = useSyncData();

    const [customers, setCustomers] = useState([]);
    const [leads, setLeads] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form, setForm] = useState({ CustomerName: '', Phone: '', Email: '', CompanyName: '', City: '', GSTNumber: '' });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Delete modal state
    const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, lRes, uRes] = await Promise.all([
                getCustomers(isAdmin ? {} : { staffID: user?.UserID }),
                getLeads(isAdmin ? {} : { assignedUser: user?.UserID }),
                getUsers()
            ]);
            // Apply permission-based filtering
            const filteredCustomers = getVisibleCustomers(cRes, user);
            setCustomers(filteredCustomers);
            setLeads(lRes);
            setUsers(uRes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const filtered = customers.filter(c => {
        const search = searchTerm.toLowerCase();
        return (
            c.CustomerName?.toLowerCase().includes(search) ||
            c.Phone?.includes(search) ||
            c.CompanyName?.toLowerCase().includes(search) ||
            c.City?.toLowerCase().includes(search)
        );
    });

    const handleDeleteCustomer = (customerId) => {
        setSelectedCustomerIds([customerId]);
        setShowDeleteModal(true);
    };

    const handleDeleteSelected = async () => {
        setDeleting(true);
        try {
            await deleteCustomers(selectedCustomerIds, user?.UserID);
            showToast(`${selectedCustomerIds.length} customer(s) deleted`);
            setShowDeleteModal(false);
            setSelectedCustomerIds([]);
            fetchData();
        } catch (e) {
            alert("Delete failed: " + (e.message || "Unknown error"));
        } finally {
            setDeleting(false);
        }
    };

    const getCustomerStats = (customerId) => {
        const custLeads = leads.filter(l => l.CustomerID === customerId);
        return {
            leadsCount: custLeads.length,
            lastOrder: 'N/A' // Need orders to show last order exactly, keeping simple or could fetch orders
        };
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        let err = {};
        if (!form.CustomerName.trim()) err.CustomerName = 'Required';
        if (!form.Phone.trim() || form.Phone.length < 10) err.Phone = 'Valid phone required';
        if (Object.keys(err).length > 0) return setErrors(err);

        setSubmitting(true);
        try {
            await createCustomer({ ...form, AssignedUserID: user?.UserID });
            showToast('Customer created successfully');
            setIsModalOpen(false);
            setForm({ CustomerName: '', Phone: '', Email: '', CompanyName: '', City: '', GSTNumber: '' });
            fetchData();
        } catch (e) {
            alert("Error creating customer");
        } finally {
            setSubmitting(false);
        }
    };

    // Pull-to-refresh
    const [touchStartY, setTouchStartY] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleTouchStart = (e) => {
        if (window.scrollY === 0) setTouchStartY(e.touches[0].clientY);
        else setTouchStartY(0);
    };

    const handleTouchMove = (e) => {
        if (touchStartY === 0) return;
        const currentY = e.touches[0].clientY;
        if (currentY - touchStartY > 80 && !isRefreshing) {
            setIsRefreshing(true);
            setTouchStartY(0);
            fetchData().finally(() => setIsRefreshing(false));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading customers...</div>;

    return (
        <>
            {/* Top Bar */}
            <div className="space-y-6 min-h-[50vh]" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Building2 className="text-primary" /> Customers</h2>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"><Plus size={18} /> Add Customer</button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Customer Name</th>
                                    <th className="px-6 py-4 font-semibold">Phone</th>
                                    <th className="px-6 py-4 font-semibold">Company</th>
                                    <th className="px-6 py-4 font-semibold">City</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(c => (
                                    <tr key={c.CustomerID} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900">{c.CustomerName}</td>
                                        <td className="px-6 py-4">{c.Phone}</td>
                                        <td className="px-6 py-4">{c.CompanyName}</td>
                                        <td className="px-6 py-4">{c.City}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => navigate(`/customers/${c.CustomerID}`)} className="text-primary font-bold hover:underline mr-4">View</button>
                                            <button onClick={() => handleDeleteCustomer(c.CustomerID)} className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors" title="Delete"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Customer Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
                            <AlertCircle size={18} className="text-red-600" />
                            <h2 className="text-base font-bold text-red-900">Delete {selectedCustomerIds.length} customer{selectedCustomerIds.length > 1 ? 's' : ''}?</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600">This action cannot be undone. The selected customer(s) and all related leads, quotations, orders, and payments will be permanently removed from the system.</p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
                            <button type="button" onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold">Cancel</button>
                            <button type="button" onClick={handleDeleteSelected} className="px-6 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 shadow-sm flex items-center gap-2" disabled={deleting}><Trash2 size={16} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Customer Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <form onSubmit={handleCreateCustomer} className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-800">Add Customer</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Customer Name *</label>
                                <input type="text" value={form.CustomerName} onChange={e => setForm({ ...form, CustomerName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
                                {errors.CustomerName && <div className="text-xs text-red-600 mt-1">{errors.CustomerName}</div>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phone *</label>
                                <input type="text" value={form.Phone} onChange={e => setForm({ ...form, Phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
                                {errors.Phone && <div className="text-xs text-red-600 mt-1">{errors.Phone}</div>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                                <input type="email" value={form.Email} onChange={e => setForm({ ...form, Email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Company Name</label>
                                <input type="text" value={form.CompanyName} onChange={e => setForm({ ...form, CompanyName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                                <input type="text" value={form.City} onChange={e => setForm({ ...form, City: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">GST Number</label>
                                <input type="text" value={form.GSTNumber} onChange={e => setForm({ ...form, GSTNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2" disabled={submitting}><CheckCircle2 size={16} /> Save</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-lg shadow-lg font-bold animate-in fade-in z-50">
                    {toastMessage}
                </div>
            )}
        </>
    );
}