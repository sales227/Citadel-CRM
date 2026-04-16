import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCustomerById, getLeads, getOrders, getPayments, getInteractions, updateCustomer } from '../api/apiService';
import { ArrowLeft, Edit2, CheckCircle2, Phone, Mail, MapPin, Building2, Package, Clock, CreditCard, Receipt, MessagesSquare } from 'lucide-react';

export default function CustomerDetailPage() {
    const { customerId } = useParams();
    const { user, isAdmin } = useAuth();

    const [customer, setCustomer] = useState(null);
    const [leads, setLeads] = useState([]);
    const [orders, setOrders] = useState([]);
    const [payments, setPayments] = useState([]);
    const [interactionCount, setInteractionCount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customerId]);

    const fetchData = async () => {
        try {
            const [cRes, lRes, oRes, pRes] = await Promise.all([
                getCustomerById(customerId),
                getLeads(isAdmin ? {} : { assignedUser: user?.UserID }),
                getOrders(),
                getPayments()
            ]);

            setCustomer(cRes);
            setEditForm(cRes);

            const custLeads = lRes.filter(l => l.CustomerID === customerId);
            setLeads(custLeads);

            const custOrders = oRes.filter(o => o.CustomerID === customerId);
            setOrders(custOrders);

            setPayments(pRes.filter(p => p.CustomerID === customerId));

            // Fetch interactions for leads to get count
            let iCount = 0;
            for (const lead of custLeads) {
                try {
                    const ints = await getInteractions(lead.LeadID);
                    iCount += ints.length;
                } catch (e) { }
            }
            setInteractionCount(iCount);

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

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await updateCustomer(customerId, editForm);
            setCustomer(editForm);
            setEditing(false);
            showToast('Customer updated successfully');
        } catch (e) {
            alert("Failed to update");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading profile...</div>;
    if (!customer) return <div className="p-8 text-center text-red-500">Customer not found.</div>;

    const totalBilled = payments.reduce((sum, p) => sum + parseFloat(p.TotalAmount || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.PaidAmount || 0), 0);
    const outstanding = (totalBilled - totalPaid).toFixed(2);

    return (
        <div className="space-y-6 pb-12">
            {toastMessage && (
                <div className="fixed top-20 right-4 z-50 bg-green-50 text-green-800 border border-green-200 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="font-medium text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Header Profile */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                <div className="h-2 bg-primary w-full"></div>
                <div className="p-6 md:p-8">
                    <Link to="/customers" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors bg-gray-50 px-3 py-1.5 rounded-md mb-6">
                        <ArrowLeft size={16} /> Back to Customers
                    </Link>

                    {editing ? (
                        <form onSubmit={handleUpdate} className="space-y-4 max-w-2xl bg-gray-50 p-6 rounded-lg border border-gray-100">
                            <h3 className="font-bold text-gray-900 border-b pb-2 mb-4">Edit Profile</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-gray-500 block">Name</label><input required type="text" value={editForm.CustomerName} onChange={e => setEditForm({ ...editForm, CustomerName: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:ring-primary focus:border-primary" /></div>
                                <div><label className="text-xs font-bold text-gray-500 block">Phone</label><input required type="text" value={editForm.Phone} onChange={e => setEditForm({ ...editForm, Phone: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:ring-primary focus:border-primary" /></div>
                                <div><label className="text-xs font-bold text-gray-500 block">Email</label><input type="email" value={editForm.Email} onChange={e => setEditForm({ ...editForm, Email: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:ring-primary focus:border-primary" /></div>
                                <div><label className="text-xs font-bold text-gray-500 block">Company</label><input type="text" value={editForm.CompanyName} onChange={e => setEditForm({ ...editForm, CompanyName: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:ring-primary focus:border-primary" /></div>
                                <div><label className="text-xs font-bold text-gray-500 block">City</label><input type="text" value={editForm.City} onChange={e => setEditForm({ ...editForm, City: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:ring-primary focus:border-primary" /></div>
                                <div><label className="text-xs font-bold text-gray-500 block">GST Number</label><input type="text" value={editForm.GSTNumber || ''} onChange={e => setEditForm({ ...editForm, GSTNumber: e.target.value })} className="w-full border rounded px-3 py-2 text-sm focus:ring-primary focus:border-primary uppercase" /></div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 block">Customer Type</label>
                                    <select value={editForm.CustomerType || ''} onChange={e => setEditForm({ ...editForm, CustomerType: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-primary focus:border-primary bg-white">
                                        <option value="">Select Type</option>
                                        <option value="Direct">Direct</option>
                                        <option value="Dealer">Dealer</option>
                                        <option value="Contractor">Contractor</option>
                                        <option value="Builder">Builder</option>
                                        <option value="Architect">Architect</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 border rounded font-bold text-sm bg-white hover:bg-gray-100 text-gray-600">Cancel</button>
                                <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-white rounded font-bold text-sm hover:bg-blue-800">Save Changes</button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                    {customer.CustomerName}
                                    {(isAdmin || user?.UserID === customer.AssignedUserID) && (
                                        <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-primary transition-colors bg-gray-50 p-2 rounded-full border border-gray-100" title="Edit Profile"><Edit2 size={16} /></button>
                                    )}
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 text-gray-600">
                                    {customer.CompanyName && <div className="flex items-center gap-2"><Building2 size={18} className="text-gray-400" /> <span className="font-medium">{customer.CompanyName}</span></div>}
                                    <a href={`tel:${customer.Phone}`} className="flex items-center gap-2 hover:text-primary transition-colors font-medium"><Phone size={18} className="text-primary" /> {customer.Phone}</a>
                                    {customer.Email && <a href={`mailto:${customer.Email}`} className="flex items-center gap-2 hover:text-primary transition-colors font-medium"><Mail size={18} className="text-primary" /> {customer.Email}</a>}
                                    {customer.City && <div className="flex items-center gap-2"><MapPin size={18} className="text-gray-400" /> <span className="font-medium">{customer.City}</span></div>}
                                    {customer.GSTNumber && <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded border border-gray-200 text-xs font-mono font-bold tracking-wider text-gray-500">GST: {customer.GSTNumber}</div>}
                                    {customer.CustomerType && <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded border border-blue-100 text-xs font-bold text-blue-700">{customer.CustomerType}</div>}
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                                <div className="text-center px-4 border-r border-gray-200">
                                    <p className="text-3xl font-black text-primary mb-1">{leads.length}</p>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Leads</p>
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-3xl font-black text-green-600 mb-1">{orders.length}</p>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Orders</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Col - Stats */}
                <div className="space-y-6 lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-gray-700">
                            <MessagesSquare size={32} className="text-indigo-500 bg-indigo-50 p-1.5 rounded-lg" />
                            <div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Interactions</p><p className="font-black text-2xl">{interactionCount}</p></div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100"><h3 className="font-bold text-gray-800">Financial Summary</h3></div>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100">
                                <span className="text-sm font-bold text-gray-500 flex items-center gap-2"><Receipt size={16} /> Total Billed</span>
                                <span className="font-bold text-gray-900">₹{totalBilled.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-green-50 p-3 rounded border border-green-100">
                                <span className="text-sm font-bold text-green-700 flex items-center gap-2"><CheckCircle2 size={16} /> Total Paid</span>
                                <span className="font-bold text-green-700">₹{totalPaid.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-red-50 p-3 rounded border border-red-100">
                                <span className="text-sm font-bold text-red-700 flex items-center gap-2"><Clock size={16} /> Outstanding</span>
                                <span className="font-bold text-red-700 text-lg">₹{outstanding}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col - Lists */}
                <div className="space-y-6 lg:col-span-2">

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Leads Pipeline</h3>
                            <Link to={`/leads?customer=${customerId}`} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">View All <ArrowLeft className="rotate-180" size={14} /></Link>
                        </div>
                        {leads.length === 0 ? <div className="p-6 text-center text-sm text-gray-500">No leads associated with this customer.</div> : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase"><tr><th className="px-6 py-3">Product</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Created</th><th className="px-6 py-3 text-right">Action</th></tr></thead>
                                <tbody className="divide-y divide-gray-100">
                                    {leads.map(l => (
                                        <tr key={l.LeadID} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 font-medium text-gray-900">{l['ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)']}</td>
                                            <td className="px-6 py-3"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-700 border">{l['LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)']}</span></td>
                                            <td className="px-6 py-3 text-gray-500">{new Date(l.CreatedAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-3 text-right"><Link to={`/leads/${l.LeadID}`} className="text-primary font-bold hover:underline">View</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">Order History</h3>
                        </div>
                        {orders.length === 0 ? <div className="p-6 text-center text-sm text-gray-500">No confirmed orders yet.</div> : (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50/50 text-xs text-gray-500 uppercase"><tr><th className="px-6 py-3">Order ID</th><th className="px-6 py-3">Product & Qty</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Status</th></tr></thead>
                                <tbody className="divide-y divide-gray-100">
                                    {orders.map(o => (
                                        <tr key={o.OrderID} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 font-mono text-xs text-gray-500">{o.OrderID}</td>
                                            <td className="px-6 py-3 font-medium text-gray-900">{o.ProductOrdered} <span className="text-gray-400 block text-xs">{o.OrderQuantity}</span></td>
                                            <td className="px-6 py-3 text-gray-500">{new Date(o.OrderDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-3"><span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-200">{o['OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)']}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}