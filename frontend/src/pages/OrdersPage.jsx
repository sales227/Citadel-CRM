import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOrders, getCustomers, getLeads, createOrder, updateOrder, updateOrderStatus, deleteOrders } from '../api/apiService';
import { PRODUCTS } from '../utils/constants';
import { ShoppingCart, CheckCircle2, ChevronDown, Package, Trash2, AlertCircle, Plus, Pencil, X, PlusCircle, MinusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const UNITS = ['Cubic Meters', 'Tons', 'Bags'];
const emptyItem = () => ({ product: '', quantity: '', unit: 'Cubic Meters' });

export default function OrdersPage() {
    const { user, isAdmin } = useAuth();
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] = useState('All');

    // Delete modal state
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Create modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ CustomerID: '', LeadID: '', DispatchSchedule: '' });
    const [createItems, setCreateItems] = useState([emptyItem()]);
    const [creating, setCreating] = useState(false);
    const [createErrors, setCreateErrors] = useState({});
    const [duplicateWarning, setDuplicateWarning] = useState('');

    // Edit modal state
    const [editingOrder, setEditingOrder] = useState(null);
    const [editForm, setEditForm] = useState({ DispatchSchedule: '' });
    const [editItems, setEditItems] = useState([emptyItem()]);
    const [updating, setUpdating] = useState(false);

    // Toast
    const [toastMessage, setToastMessage] = useState('');
    const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [oRes, cRes, lRes] = await Promise.all([getOrders(), getCustomers(), getLeads()]);
            if (!isAdmin) {
                setOrders(oRes.filter(o => o.AssignedUserID === user?.UserID));
            } else {
                setOrders(oRes);
            }
            setCustomers(cRes);
            setLeads(lRes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

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
            showToast('Order deleted successfully');
        } catch (e) {
            alert("Delete failed: " + (e.message || "Unknown error"));
        } finally {
            setDeleting(false);
        }
    };

    const statusColors = {
        'Pending':    'bg-amber-100  text-amber-700   border-amber-200',
        'Confirmed':  'bg-sky-100    text-sky-700     border-sky-200',
        'Dispatched': 'bg-violet-100 text-violet-700  border-violet-200',
        'Delivered':  'bg-green-100  text-green-700   border-green-200',
        'Cancelled':  'bg-red-100    text-red-600     border-red-200'
    };

    const handleStatusChange = async (oId, newStatus) => {
        try {
            await updateOrderStatus(oId, newStatus);
            setOrders(orders.map(o => o.OrderID === oId
                ? { ...o, 'OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)': newStatus }
                : o
            ));
        } catch (e) {
            alert("Failed to update status");
        }
    };

    // ─── Create Order ────────────────────────────────────────────────────────────
    const openCreateModal = () => {
        setCreateForm({ CustomerID: '', LeadID: '', DispatchSchedule: '' });
        setCreateItems([emptyItem()]);
        setCreateErrors({});
        setDuplicateWarning('');
        setShowCreateModal(true);
    };

    const customerLeads = leads.filter(l => l.CustomerID === createForm.CustomerID);

    const checkDuplicate = (custID, items) => {
        if (!custID) { setDuplicateWarning(''); return; }
        const products = items.map(i => i.product).filter(Boolean);
        if (products.length === 0) { setDuplicateWarning(''); return; }
        const existing = orders.find(o =>
            o.CustomerID === custID &&
            o['OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)'] !== 'Cancelled' &&
            products.some(p => (o.ProductOrdered || '').includes(p))
        );
        if (existing) {
            const cust = customers.find(c => c.CustomerID === custID);
            setDuplicateWarning(`Warning: ${cust?.CustomerName || 'This customer'} already has an active order (${existing.OrderID}) for similar products.`);
        } else {
            setDuplicateWarning('');
        }
    };

    const updateCreateItem = (idx, field, val) => {
        const updated = createItems.map((item, i) => i === idx ? { ...item, [field]: val } : item);
        setCreateItems(updated);
        if (field === 'product') checkDuplicate(createForm.CustomerID, updated);
    };

    const validateCreate = () => {
        const errs = {};
        if (!createForm.CustomerID) errs.CustomerID = 'Select a customer';
        const valid = createItems.filter(i => i.product && i.quantity);
        if (valid.length === 0) errs.items = 'Add at least one product with quantity';
        setCreateErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleCreateOrder = async () => {
        if (!validateCreate()) return;
        setCreating(true);
        try {
            const validItems = createItems
                .filter(i => i.product && i.quantity)
                .map(i => ({ product: i.product, quantity: parseFloat(i.quantity), unit: i.unit }));
            await createOrder({
                CustomerID: createForm.CustomerID,
                LeadID: createForm.LeadID || '',
                Items: validItems,
                ProductOrdered: validItems.map(i => i.product).join(', '),
                OrderQuantity: validItems.map(i => `${i.quantity} ${i.unit}`).join(', '),
                DispatchSchedule: createForm.DispatchSchedule,
                AssignedUserID: user?.UserID
            });
            showToast('Order created successfully');
            setShowCreateModal(false);
            fetchData();
        } catch (e) {
            alert("Error creating order: " + (e.message || "Unknown error"));
        } finally {
            setCreating(false);
        }
    };

    // ─── Edit Order ──────────────────────────────────────────────────────────────
    const openEditModal = (order) => {
        const existingItems = order.Items && order.Items.length > 0
            ? order.Items.map(i => ({ product: i.product || '', quantity: String(i.quantity || ''), unit: i.unit || 'Cubic Meters' }))
            : [{
                product: order.ProductOrdered || '',
                quantity: (order.OrderQuantity || '').split(' ')[0] || '',
                unit: (order.OrderQuantity || '').split(' ').slice(1).join(' ') || 'Cubic Meters'
            }];
        setEditItems(existingItems);
        setEditForm({ DispatchSchedule: order.DispatchSchedule || '' });
        setEditingOrder(order);
    };

    const updateEditItem = (idx, field, val) => {
        setEditItems(editItems.map((item, i) => i === idx ? { ...item, [field]: val } : item));
    };

    const handleUpdateOrder = async () => {
        setUpdating(true);
        try {
            const validItems = editItems
                .filter(i => i.product && i.quantity)
                .map(i => ({ product: i.product, quantity: parseFloat(i.quantity), unit: i.unit }));
            const updates = {
                Items: validItems,
                ProductOrdered: validItems.map(i => i.product).join(', '),
                OrderQuantity: validItems.map(i => `${i.quantity} ${i.unit}`).join(', '),
                DispatchSchedule: editForm.DispatchSchedule
            };
            await updateOrder(editingOrder.OrderID, updates);
            setOrders(orders.map(o => o.OrderID === editingOrder.OrderID ? { ...o, ...updates } : o));
            showToast('Order updated successfully');
            setEditingOrder(null);
        } catch (e) {
            alert("Error updating order: " + (e.message || "Unknown error"));
        } finally {
            setUpdating(false);
        }
    };

    const filtered = orders.filter(o =>
        statusFilter === 'All' || o['OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)'] === statusFilter
    );

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading orders...</div>;

    return (
        <div className="space-y-6">

            {/* Toast */}
            {toastMessage && (
                <div className="fixed top-20 right-4 z-50 bg-green-50 text-green-800 border border-green-200 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="font-medium text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><ShoppingCart className="text-primary" /> Orders Management</h2>
                <div className="flex gap-2 items-center flex-wrap">
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-sm font-bold focus:ring-primary focus:border-primary">
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                    <button onClick={openCreateModal} className="flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors">
                        <Plus size={18} /> New Order
                    </button>
                </div>
            </div>

            {/* Table */}
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
                                            <div className="mt-1"><span className="font-bold text-gray-500">Dispatch:</span> {o.DispatchSchedule || 'TBD'}</div>
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
                                                <button onClick={() => openEditModal(o)} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded transition-colors" title="Edit Order"><Pencil size={16} /></button>
                                                {o.LeadID && (
                                                    <Link to={`/leads/${o.LeadID}`} className="text-primary font-bold hover:underline bg-blue-50 px-3 py-1.5 rounded border border-blue-100 transition-colors">View Lead</Link>
                                                )}
                                                <button onClick={() => handleDeleteOrder(o.OrderID)} className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors" title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No orders found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
                            <AlertCircle size={18} className="text-red-600" />
                            <h2 className="text-base font-bold text-red-900">Delete order?</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600">This action cannot be undone. The order and all related payments will be permanently removed.</p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
                            <button type="button" onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold">Cancel</button>
                            <button type="button" onClick={handleDeleteSelected} disabled={deleting} className="px-6 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700 shadow-sm flex items-center gap-2 disabled:opacity-50">
                                <Trash2 size={16} /> {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Order Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ShoppingCart size={20} className="text-primary" /> New Order</h2>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            {duplicateWarning && (
                                <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    {duplicateWarning}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Customer *</label>
                                <select
                                    value={createForm.CustomerID}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setCreateForm(f => ({ ...f, CustomerID: val, LeadID: '' }));
                                        checkDuplicate(val, createItems);
                                    }}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary ${createErrors.CustomerID ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Select customer...</option>
                                    {customers.map(c => (
                                        <option key={c.CustomerID} value={c.CustomerID}>
                                            {c.CustomerName}{c.CompanyName ? ` (${c.CompanyName})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {createErrors.CustomerID && <p className="text-xs text-red-500 mt-1">{createErrors.CustomerID}</p>}
                            </div>

                            {createForm.CustomerID && customerLeads.length > 0 && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Link to Lead (Optional)</label>
                                    <select
                                        value={createForm.LeadID}
                                        onChange={e => setCreateForm(f => ({ ...f, LeadID: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">No linked lead</option>
                                        {customerLeads.map(l => (
                                            <option key={l.LeadID} value={l.LeadID}>
                                                {l.LeadID} — {l['ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)']}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-bold text-gray-700">Products *</label>
                                    <button type="button" onClick={() => setCreateItems(it => [...it, emptyItem()])} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                                        <PlusCircle size={14} /> Add Product
                                    </button>
                                </div>
                                {createErrors.items && <p className="text-xs text-red-500 mb-2">{createErrors.items}</p>}
                                <div className="space-y-2">
                                    {createItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <select
                                                value={item.product}
                                                onChange={e => updateCreateItem(idx, 'product', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                                            >
                                                <option value="">Select product...</option>
                                                {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => updateCreateItem(idx, 'quantity', e.target.value)}
                                                placeholder="Qty"
                                                min="1"
                                                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                                            />
                                            <select
                                                value={item.unit}
                                                onChange={e => updateCreateItem(idx, 'unit', e.target.value)}
                                                className="w-28 px-2 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:ring-primary focus:border-primary"
                                            >
                                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                            {createItems.length > 1 && (
                                                <button type="button" onClick={() => setCreateItems(it => it.filter((_, i) => i !== idx))} className="p-1.5 text-red-400 hover:text-red-600">
                                                    <MinusCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Dispatch Schedule Date</label>
                                <input
                                    type="date"
                                    value={createForm.DispatchSchedule}
                                    onChange={e => setCreateForm(f => ({ ...f, DispatchSchedule: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2 sticky bottom-0">
                            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold">Cancel</button>
                            <button type="button" onClick={handleCreateOrder} disabled={creating} className="px-6 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2 disabled:opacity-50">
                                <CheckCircle2 size={16} /> {creating ? 'Creating...' : 'Create Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Order Modal */}
            {editingOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-in zoom-in-95 flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Pencil size={18} className="text-primary" /> Edit Order
                                <span className="text-sm font-mono text-gray-400 ml-1">{editingOrder.OrderID}</span>
                            </h2>
                            <button type="button" onClick={() => setEditingOrder(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-bold text-gray-700">Products</label>
                                    <button type="button" onClick={() => setEditItems(it => [...it, emptyItem()])} className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                                        <PlusCircle size={14} /> Add Product
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {editItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <select
                                                value={item.product}
                                                onChange={e => updateEditItem(idx, 'product', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                                            >
                                                <option value="">Select product...</option>
                                                {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => updateEditItem(idx, 'quantity', e.target.value)}
                                                placeholder="Qty"
                                                min="1"
                                                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                                            />
                                            <select
                                                value={item.unit}
                                                onChange={e => updateEditItem(idx, 'unit', e.target.value)}
                                                className="w-28 px-2 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 focus:ring-primary focus:border-primary"
                                            >
                                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                            {editItems.length > 1 && (
                                                <button type="button" onClick={() => setEditItems(it => it.filter((_, i) => i !== idx))} className="p-1.5 text-red-400 hover:text-red-600">
                                                    <MinusCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Dispatch Schedule Date</label>
                                <input
                                    type="date"
                                    value={editForm.DispatchSchedule}
                                    onChange={e => setEditForm(f => ({ ...f, DispatchSchedule: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2 sticky bottom-0">
                            <button type="button" onClick={() => setEditingOrder(null)} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold">Cancel</button>
                            <button type="button" onClick={handleUpdateOrder} disabled={updating} className="px-6 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-blue-700 shadow-sm flex items-center gap-2 disabled:opacity-50">
                                <CheckCircle2 size={16} /> {updating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
