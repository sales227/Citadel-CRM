import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOrders, getCustomers, updateOrderStatus, deleteOrders } from '../api/apiService';
import { ShoppingCart, CheckCircle2, ChevronDown, PackageSearch, Package, Trash2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OrdersPage() {
    const { user, isAdmin } = useAuth();
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('All');

    // Delete modal state
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // These must be at component scope so JSX event handlers can reference them
    const handleDeleteOrder = (orderId) => {
        setSelectedOrderIds([orderId]);
        setShowDeleteModal(true);
    };

    const handleDeleteSelected = async () => {
        setDeleting(true);
        try {
            await deleteOrders(selectedOrderIds, user?.UserID);
            setOrders(os => os.filter(o => !selectedOrderIds.includes(o.OrderID)));
            setShowDeleteModal(false);
            setSelectedOrderIds([]);
        } catch (e) {
            alert("Delete failed: " + (e.message || "Unknown error"));
        } finally {
            setDeleting(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [oRes, cRes] = await Promise.all([getOrders(), getCustomers()]);

            // Filter if not admin
            if (!isAdmin) {
                setOrders(oRes.filter(o => o.AssignedUserID === user?.UserID));
            } else {
                setOrders(oRes);
            }
            setCustomers(cRes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const statusColors = {
        'Pending':    'bg-brand-50  text-blue-700  border-brand-200',
        'Confirmed':  'bg-brand-100 text-brand-800 border-brand-300',
        'Dispatched': 'bg-brand-200 text-brand-900 border-brand-300',
        'Delivered':  'bg-primary   text-white     border-primary',
        'Cancelled':  'bg-gray-100  text-gray-600  border-gray-200'
    };

    const handleStatusChange = async (oId, newStatus) => {
        try {
            await updateOrderStatus(oId, newStatus);
            setOrders(orders.map(o => o.OrderID === oId ? { ...o, "OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)": newStatus } : o));
        } catch (e) {
            alert("Failed to update status");
        }
    };

    const filtered = orders.filter(o => statusFilter === 'All' || o['OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)'] === statusFilter);

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading orders...</div>;

    return (
        <div className="space-y-6">

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><ShoppingCart className="text-primary" /> Orders Management</h2>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-bold focus:ring-primary focus:border-primary">
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Order ID</th>
                                <th className="px-6 py-4 font-semibold">Customer</th>
                                <th className="px-6 py-4 font-semibold">Product & Qty</th>
                                <th className="px-6 py-4 font-semibold">Schedule</th>
                                <th className="px-6 py-4 font-semibold">Status Update</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(o => {
                                const c = customers.find(x => x.CustomerID === o.CustomerID);
                                const status = o['OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)'];

                                return (
                                    <tr key={o.OrderID} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500 font-bold">{o.OrderID}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">{c?.CustomerName}</p>
                                            <p className="text-xs text-gray-500">{c?.CompanyName}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900 flex items-center gap-1"><Package size={14} className="text-gray-400" /> {o.ProductOrdered}</p>
                                            <p className="text-xs font-bold text-primary mt-0.5">{o.OrderQuantity}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-xs">
                                            <div><span className="font-bold text-gray-500">Ordered:</span> {new Date(o.OrderDate).toLocaleDateString()}</div>
                                            <div className="mt-1"><span className="font-bold text-gray-500">Dispatch:</span> {o.DispatchSchedule ? o.DispatchSchedule : 'TBD'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative inline-block w-36">
                                                <select
                                                    value={status}
                                                    onChange={(e) => handleStatusChange(o.OrderID, e.target.value)}
                                                    className={`appearance-none w-full px-3 py-1.5 pr-8 rounded-md text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary ${statusColors[status]}`}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Confirmed">Confirmed</option>
                                                    <option value="Dispatched">Dispatched</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                                <ChevronDown size={14} className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-current" />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/leads/${o.LeadID}`} className="text-primary font-bold hover:underline bg-blue-50 px-3 py-1.5 rounded border border-blue-100 transition-colors">View Link</Link>
                                                <button onClick={() => handleDeleteOrder(o.OrderID)} className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors" title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                                {/* Delete Order Modal */}
                                                {showDeleteModal && (
                                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                                                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                                                            <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
                                                                <AlertCircle size={18} className="text-red-600" />
                                                                <h2 className="text-base font-bold text-red-900">Delete {selectedOrderIds.length} order{selectedOrderIds.length > 1 ? 's' : ''}?</h2>
                                                            </div>
                                                            <div className="p-6">
                                                                <p className="text-sm text-gray-600">This action cannot be undone. The selected order(s) and all related payments will be permanently removed from the system.</p>
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
                            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">No orders found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}