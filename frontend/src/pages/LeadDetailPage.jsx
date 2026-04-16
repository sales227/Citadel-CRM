import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getLeadById, getInteractions, getQuotations, getOrders, getPayments,
    getSettings, getUsers, createInteraction, updateLead,
    createQuotation, updateQuotation, approveQuotation,
    createOrder, updateOrderStatus,
    createPayment, updatePayment, approveCredit
} from '../api/apiService';
import {
    ArrowLeft, Phone, Mail, MapPin, Building2, Calendar, FileText,
    Clock, CheckCircle2, ChevronDown, User, MessageSquare, Download, Upload, X, ShoppingCart
} from 'lucide-react';

export default function LeadDetailPage() {
    const { id } = useParams(); // leadId
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Data
    const [lead, setLead] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [interactions, setInteractions] = useState([]);
    const [quotation, setQuotation] = useState(null);
    const [order, setOrder] = useState(null);
    const [payment, setPayment] = useState(null);
    const [settings, setSettings] = useState({});
    const [users, setUsers] = useState([]);

    // UI State
    const [activeTab, setActiveTab] = useState('interactions');
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Modals
    const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [
                leadRes,
                intRes,
                quoRes,
                ordRes,
                payRes,
                setRes,
                usrRes
            ] = await Promise.all([
                getLeadById(id),
                getInteractions(id),
                getQuotations(id),
                getOrders(),
                getPayments(),
                getSettings(),
                getUsers()
            ]);

            if (!leadRes.lead) throw new Error("Lead not found");

            setLead(leadRes.lead);
            setCustomer(leadRes.customer);
            setInteractions(intRes.sort((a, b) => new Date(b.InteractionDate) - new Date(a.InteractionDate)));

            const matchQuo = quoRes.length > 0 ? quoRes[0] : null; // Assume 1 active quotation per lead
            setQuotation(matchQuo);

            const matchOrd = ordRes.find(o => o.LeadID === id);
            setOrder(matchOrd);

            if (matchOrd) {
                const matchPay = payRes.find(p => p.OrderID === matchOrd.OrderID);
                setPayment(matchPay);
            }

            setSettings(setRes);
            setUsers(usrRes);

        } catch (err) {
            console.error(err);
            setError('Failed to load lead details.');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 3000);
    };

    const handleStatusChange = async (newStatus) => {
        setStatusUpdating(true);
        try {
            await updateLead(id, { "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": newStatus, logUserID: user?.UserID });
            setLead({ ...lead, "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": newStatus });
            showToast(`Status updated to ${newStatus}`);
        } catch (e) {
            alert("Failed to update status");
        } finally {
            setStatusUpdating(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'New':         return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'Contacted':   return 'bg-brand-100 text-brand-800 border-brand-200';
            case 'Quoted':      return 'bg-brand-200 text-brand-900 border-brand-300';
            case 'Negotiating': return 'bg-blue-200 text-blue-900 border-blue-300';
            case 'Won':         return 'bg-primary text-white border-primary';
            case 'Lost':        return 'bg-gray-200 text-gray-600 border-gray-300';
            default:            return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // --- Interaction Form ---
    const [intForm, setIntForm] = useState({ Type: 'Call', Feedback: '', Remark1: '', Remark2: '', NextFollowUpDate: '' });
    const handleIntSubmit = async (e) => {
        e.preventDefault();
        if (!intForm.Feedback) return alert('Feedback is required');
        try {
            await createInteraction({
                ...intForm,
                LeadID: id,
                CustomerID: customer.CustomerID,
                CreatedByUserID: user?.UserID
            });
            setIsInteractionModalOpen(false);
            setIntForm({ Type: 'Call', Feedback: '', Remark1: '', Remark2: '', NextFollowUpDate: '' });
            showToast('Interaction logged successfully');
            const renewed = await getInteractions(id);
            setInteractions(renewed.sort((a, b) => new Date(b.InteractionDate) - new Date(a.InteractionDate)));
        } catch (e) {
            alert('Failed to log interaction');
        }
    };

    // --- Quotation Form ---
    const thresholdPrice = parseFloat(settings.PriceApprovalThreshold) || 3650;
    const [quoForm, setQuoForm] = useState(quotation ? {
        QuotationAsked: quotation['QuotationAsked (Yes/No)'],
        QuotationSent: quotation['QuotationSent (Yes/No)'],
        QuotationDate: quotation.QuotationDate ? quotation.QuotationDate.split('T')[0] : '',
        QuotedPricePerUnit: quotation.QuotedPricePerUnit,
        TotalQuotedPrice: quotation.QuotedPrice,
        Unit: quotation.Unit || 'Cubic Meters',
        Notes: quotation.Notes,
        DriveFileURL: quotation.DriveFileURL
    } : {
        QuotationAsked: 'Yes', QuotationSent: 'No', QuotationDate: new Date().toISOString().split('T')[0],
        QuotedPricePerUnit: '', TotalQuotedPrice: '', Unit: 'Cubic Meters', Notes: '', DriveFileURL: ''
    });
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (quotation) {
            setQuoForm({
                QuotationAsked: quotation['QuotationAsked (Yes/No)'],
                QuotationSent: quotation['QuotationSent (Yes/No)'],
                QuotationDate: quotation.QuotationDate ? quotation.QuotationDate.split('T')[0] : '',
                QuotedPricePerUnit: quotation.QuotedPricePerUnit,
                TotalQuotedPrice: quotation.QuotedPrice,
                Unit: quotation.Unit || 'Cubic Meters',
                Notes: quotation.Notes,
                DriveFileURL: quotation.DriveFileURL
            });
        }
    }, [quotation]);

    const handleQuoSubmit = async (e) => {
        e.preventDefault();
        try {
            if (quotation) {
                await updateQuotation(quotation.QuotationID, {
                    "QuotationAsked (Yes/No)": quoForm.QuotationAsked,
                    "QuotationSent (Yes/No)": quoForm.QuotationSent,
                    QuotedPricePerUnit: quoForm.QuotedPricePerUnit,
                    QuotedPrice: quoForm.TotalQuotedPrice,
                    Unit: quoForm.Unit,
                    Notes: quoForm.Notes,
                    DriveFileURL: quoForm.DriveFileURL
                });
                showToast('Quotation updated');
            } else {
                await createQuotation({
                    LeadID: id,
                    CustomerID: customer.CustomerID,
                    QuotationAsked: quoForm.QuotationAsked,
                    QuotationSent: quoForm.QuotationSent,
                    QuotedPricePerUnit: quoForm.QuotedPricePerUnit,
                    QuotedPrice: quoForm.TotalQuotedPrice,
                    Unit: quoForm.Unit,
                    Notes: quoForm.Notes,
                    DriveFileURL: quoForm.DriveFileURL
                });
                showToast('Quotation created');
            }
            const refreshed = await getQuotations(id);
            if (refreshed.length > 0) setQuotation(refreshed[0]);
        } catch (e) {
            alert("Error saving quotation");
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadProgress(10);
        // Simulate upload
        const interval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setUploadProgress(100);
                        setQuoForm(f => ({ ...f, DriveFileURL: `https://drive.google.com/fake-url/${file.name}` }));
                        setTimeout(() => setUploadProgress(0), 1000);
                    }, 500);
                    return prev;
                }
                return prev + 20;
            });
        }, 300);
    };

    // --- Order Form (multi-product cart) ---
    const PRODUCTS_LIST = ['AAC Blocks', 'Citabond Mortar', 'Kavach Plaster'];
    const UNITS_LIST = ['Cubic Meters', 'Tons', 'Bags'];
    const emptyItem = () => ({ product: '', quantity: '', unit: 'Cubic Meters' });

    const [ordItems, setOrdItems] = useState([emptyItem()]);
    const [ordDispatch, setOrdDispatch] = useState('');

    const addOrdItem = () => setOrdItems(prev => [...prev, emptyItem()]);
    const removeOrdItem = (idx) => setOrdItems(prev => prev.filter((_, i) => i !== idx));
    const updateOrdItem = (idx, field, val) =>
        setOrdItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));

    const handleOrdSubmit = async (e) => {
        e.preventDefault();
        const validItems = ordItems.filter(i => i.product && i.quantity);
        if (validItems.length === 0) { alert('Add at least one product with a quantity.'); return; }
        try {
            await createOrder({
                LeadID: id,
                CustomerID: customer.CustomerID,
                QuotationID: quotation ? quotation.QuotationID : '',
                Items: validItems,
                // Legacy single-product fields kept for backwards compatibility
                ProductOrdered: validItems.map(i => i.product).join(', '),
                OrderQuantity: validItems.map(i => `${i.quantity} ${i.unit}`).join(', '),
                DispatchSchedule: ordDispatch,
                DispatchDate: ordDispatch,
                AssignedUserID: lead.AssignedUserID,
                sendThankYou: true
            });
            showToast('Order created & Thank You message sent!');
            setIsOrderModalOpen(false);
            setOrdItems([emptyItem()]);
            setOrdDispatch('');
            fetchData();
        } catch (err) {
            alert('Failed to create order');
        }
    };

    // --- Payment Form ---
    const thresholdDays = parseInt(settings.CreditApprovalThresholdDays) || 45;
    const [payForm, setPayForm] = useState({
        InvoiceNumber: '', TotalAmount: quotation ? quotation.QuotedPrice : '', PaidAmount: '0',
        PaymentStatus: 'Pending', CreditPeriodDays: '0'
    });
    const derivedOutstanding = (parseFloat(payForm.TotalAmount || 0) - parseFloat(payForm.PaidAmount || 0)).toFixed(2);
    const derivedDueDate = new Date(order ? order.OrderDate : Date.now());
    if (payForm.CreditPeriodDays) derivedDueDate.setDate(derivedDueDate.getDate() + parseInt(payForm.CreditPeriodDays));

    const handlePaySubmit = async (e) => {
        e.preventDefault();
        try {
            await createPayment({
                OrderID: order.OrderID,
                CustomerID: customer.CustomerID,
                InvoiceNumber: payForm.InvoiceNumber,
                TotalAmount: payForm.TotalAmount,
                PaidAmount: payForm.PaidAmount,
                CreditPeriodDays: payForm.CreditPeriodDays,
                DueDate: derivedDueDate.toISOString().split('T')[0]
            });
            showToast('Payment recorded!');
            setIsPaymentModalOpen(false);
            fetchData();
        } catch (e) {
            alert("Failed to record payment");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading lead details...</div>;
    if (error || !lead) return <div className="p-8 text-center text-red-500">{error || "Lead not found"}</div>;

    const assignedUser = users.find(u => u.UserID === lead.AssignedUserID);

    return (
        <div className="space-y-6 pb-12">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-20 right-4 z-50 bg-green-50 text-green-800 border border-green-200 px-4 py-3 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="font-medium text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                <div className="h-2 bg-primary w-full"></div>
                <div className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <Link to="/leads" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors bg-gray-50 px-3 py-1.5 rounded-md">
                            <ArrowLeft size={16} /> Back to Leads
                        </Link>

                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-gray-500">Status:</span>
                            <div className="relative">
                                <select
                                    value={lead['LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)']}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    disabled={statusUpdating}
                                    className={`appearance-none px-4 py-2 pr-8 rounded-full text-sm font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${getStatusColor(lead['LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)'])} ${statusUpdating ? 'opacity-50' : ''}`}
                                >
                                    <option value="New">New</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Quoted">Quoted</option>
                                    <option value="Negotiating">Negotiating</option>
                                    <option value="Won">Won</option>
                                    <option value="Lost">Lost</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-current pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{customer?.CustomerName}</h1>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 text-gray-600">
                                {customer?.CompanyName && (
                                    <div className="flex items-center gap-2"><Building2 size={18} className="text-primary" /> <span className="font-medium">{customer.CompanyName}</span></div>
                                )}
                                <a href={`tel:${customer?.Phone}`} className="flex items-center gap-2 hover:text-primary transition-colors font-medium">
                                    <Phone size={18} className="text-primary" /> {customer?.Phone}
                                </a>
                                {customer?.Email && (
                                    <a href={`mailto:${customer?.Email}`} className="flex items-center gap-2 hover:text-primary transition-colors font-medium">
                                        <Mail size={18} className="text-primary" /> {customer.Email}
                                    </a>
                                )}
                                {customer?.City && (
                                    <div className="flex items-center gap-2"><MapPin size={18} className="text-primary" /> <span className="font-medium">{customer.City}</span></div>
                                )}
                                {customer?.GSTNumber && (
                                    <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded border border-gray-200 text-xs font-mono font-bold tracking-wider">
                                        GST: {customer.GSTNumber}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 flex flex-col justify-center space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 font-medium">Assigned To</span>
                                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm">
                                    <User size={14} className="text-primary" />
                                    <span className="text-sm font-bold text-gray-800">{assignedUser?.FullName || 'Unassigned'}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 font-medium flex items-center gap-1"><Calendar size={14} /> Created</span>
                                <span className="font-bold text-gray-800">{new Date(lead.CreatedAt).toLocaleDateString()}</span>
                            </div>
                            {lead.ContactPerson && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Contact Person</span>
                                    <span className="font-bold text-gray-800">{lead.ContactPerson}</span>
                                </div>
                            )}
                            {lead.Region && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 font-medium">PMC/PCMC</span>
                                    <span className="font-bold text-gray-800">{lead.Region}</span>
                                </div>
                            )}
                            {lead.OrderFlag === 'Y' && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Order</span>
                                    <span className="font-bold text-primary bg-brand-50 px-2 py-0.5 rounded border border-brand-200 text-xs">
                                        YES {lead.OrderValue ? `— ₹${lead.OrderValue}` : ''}
                                    </span>
                                </div>
                            )}
                            {lead.PaymentStatus && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500 font-medium">Payment</span>
                                    <span className="font-bold text-gray-800">{lead.PaymentStatus}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Layout */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50/50 hide-scrollbar">
                    {[
                        { id: 'interactions', label: 'Interactions', icon: MessageSquare },
                        { id: 'quotation', label: 'Quotation', icon: FileText },
                        { id: 'order', label: 'Order', icon: CheckCircle2 },
                        { id: 'payment', label: 'Payment', icon: Clock },
                        { id: 'documents', label: 'Documents', icon: Download }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary text-primary bg-white'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 md:p-8 min-h-[400px]">

                    {/* TAB 1: INTERACTIONS */}
                    {activeTab === 'interactions' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-lg font-bold text-gray-800">Timeline</h3>
                                <button onClick={() => setIsInteractionModalOpen(true)} className="flex items-center gap-2 bg-blue-50 text-primary border border-blue-200 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors">
                                    <MessageSquare size={16} /> Log Interaction
                                </button>
                            </div>

                            {interactions.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <MessageSquare size={32} className="mx-auto text-gray-300 mb-3" />
                                    <p>No interactions yet. Log your first interaction.</p>
                                </div>
                            ) : (
                                <div className="relative border-l-2 border-blue-100 ml-4 space-y-8 pb-4">
                                    {interactions.map((int, i) => (
                                        <div key={int.InteractionID} className="relative pl-8 group">
                                            <div className="absolute -left-[17px] bg-white border-4 border-blue-100 w-8 h-8 rounded-full flex items-center justify-center text-primary group-hover:border-primary transition-colors">
                                                <MessageSquare size={14} />
                                            </div>
                                            <div className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                                <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold font-mono">
                                                            {new Date(int.InteractionDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </span>
                                                        <span className="text-sm font-bold text-primary uppercase tracking-wider">{int['Type (Call/Email/Visit/WhatsApp)']}</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                                                        {int['Feedback (Call not received/Spoke with customer/Details shared/Waiting for approval/Other)']}
                                                    </p>
                                                </div>
                                                {int.Remark1 && <p className="text-sm text-gray-700 leading-relaxed mb-1">{int.Remark1}</p>}
                                                {int.Remark2 && <p className="text-sm text-gray-500 italic leading-relaxed">{int.Remark2}</p>}

                                                <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap justify-between items-center gap-4 text-xs">
                                                    {int.NextFollowUpDate ? (
                                                        <span className="flex items-center gap-1.5 font-bold text-primary bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100">
                                                            <Calendar size={14} /> Next Follow-up: {new Date(int.NextFollowUpDate).toLocaleDateString()}
                                                        </span>
                                                    ) : <span className="text-gray-400">No follow-up scheduled</span>}

                                                    <div className="text-gray-400 flex items-center gap-1.5 font-medium">
                                                        <User size={14} /> Logged by: {users.find(u => u.UserID === int.CreatedByUserID)?.FullName || int.CreatedByUserID}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: QUOTATION */}
                    {activeTab === 'quotation' && (
                        <div className="animate-in fade-in duration-300 max-w-3xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-800">{quotation ? 'Quotation Details' : 'Generate Quotation'}</h3>
                                {quotation && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide
                    ${quotation['ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'] === 'PendingApproval' ? 'bg-brand-100 text-brand-800 border-brand-200' :
                                            quotation['ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'] === 'Approved' ? 'bg-primary text-white border-primary' :
                                                quotation['ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'] === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                        }`}>
                                        Status: {quotation['ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)']}
                                    </span>
                                )}
                            </div>

                            <form onSubmit={handleQuoSubmit} className="space-y-6">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Quotation Asked?</label>
                                        <div className="flex gap-2">
                                            {['Yes', 'No'].map(opt => (
                                                <button type="button" key={opt} onClick={() => setQuoForm({ ...quoForm, QuotationAsked: opt })} className={`flex-1 py-2 rounded font-bold text-sm border transition-colors ${quoForm.QuotationAsked === opt ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {quoForm.QuotationAsked === 'Yes' && (
                                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Quotation Sent?</label>
                                            <div className="flex gap-2">
                                                {['Yes', 'No'].map(opt => (
                                                    <button type="button" key={opt} onClick={() => setQuoForm({ ...quoForm, QuotationSent: opt })} className={`flex-1 py-2 rounded font-bold text-sm border transition-colors ${quoForm.QuotationSent === opt ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                                        <input type="date" value={quoForm.QuotationDate} onChange={e => setQuoForm({ ...quoForm, QuotationDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Price Per Unit (₹)</label>
                                        <input type="number" step="0.01" value={quoForm.QuotedPricePerUnit} onChange={e => setQuoForm({ ...quoForm, QuotedPricePerUnit: e.target.value })} className={`w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary ${parseFloat(quoForm.QuotedPricePerUnit) < thresholdPrice ? 'border-blue-400 bg-brand-50' : 'border-gray-300'}`} placeholder="e.g. 3500" />
                                        {parseFloat(quoForm.QuotedPricePerUnit) < thresholdPrice && (
                                            <p className="text-xs text-primary font-bold mt-1">Requires Admin Approval (&lt; ₹{thresholdPrice})</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Total Price (₹)</label>
                                        <div className="flex">
                                            <input type="number" step="0.01" value={quoForm.TotalQuotedPrice} onChange={e => setQuoForm({ ...quoForm, TotalQuotedPrice: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:ring-primary focus:border-primary z-10" />
                                            <select value={quoForm.Unit} onChange={e => setQuoForm({ ...quoForm, Unit: e.target.value })} className="px-2 border border-gray-300 border-l-0 rounded-r-md bg-gray-50 text-sm">
                                                <option value="Cubic Meters">m³</option>
                                                <option value="Tons">Tons</option>
                                                <option value="Bags">Bags</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Upload Quotation PDF</label>
                                    <div className="flex items-center gap-4">
                                        <input type="file" id="quoFile" onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx" />
                                        <label htmlFor="quoFile" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                                            <Upload size={16} /> Choose File
                                        </label>
                                        {uploadProgress > 0 && uploadProgress < 100 && (
                                            <div className="w-48 bg-gray-200 rounded-full h-2.5">
                                                <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                            </div>
                                        )}
                                        {quoForm.DriveFileURL && (
                                            <a href={quoForm.DriveFileURL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-bold text-primary hover:underline bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">
                                                <FileText size={16} /> View Uploaded File
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
                                    <textarea value={quoForm.Notes} onChange={e => setQuoForm({ ...quoForm, Notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary h-24 resize-none"></textarea>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <button type="submit" className="bg-primary text-white font-bold px-6 py-2.5 rounded-lg shadow-sm hover:bg-blue-800 transition-colors flex items-center gap-2">
                                        <CheckCircle2 size={18} /> {quotation ? 'Update Quotation' : 'Save Quotation'}
                                    </button>

                                    {isAdmin && quotation && quotation['ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'] === 'PendingApproval' && (
                                        <div className="flex gap-2">
                                            <button type="button" onClick={async () => { await approveQuotation(quotation.QuotationID); fetchData(); showToast('Approved!'); }} className="bg-brand-100 text-brand-800 px-4 py-2 rounded font-bold hover:bg-brand-200 transition-colors">Approve</button>
                                            <button type="button" className="bg-red-100 text-red-800 px-4 py-2 rounded font-bold hover:bg-red-200 transition-colors">Reject</button>
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 3: ORDER */}
                    {activeTab === 'order' && (
                        <div className="animate-in fade-in duration-300 max-w-3xl">
                            {!order ? (
                                <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <CheckCircle2 size={48} className="mx-auto text-primary mb-4" />
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to close the deal?</h3>
                                    <p className="text-gray-500 mb-6">Convert this lead into a confirmed order.</p>
                                    <button onClick={() => setIsOrderModalOpen(true)} className="bg-primary text-white font-bold px-6 py-3 rounded-lg shadow flex items-center gap-2 mx-auto hover:bg-blue-800 transition-colors">
                                        <ShoppingCart size={20} /> Convert to Order
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-brand-200 overflow-hidden shadow-sm">
                                    <div className="bg-brand-50 px-6 py-4 border-b border-brand-100 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-primary">Order Placed</h3>
                                            <p className="text-sm font-mono text-brand-700 mt-0.5">ID: {order.OrderID}</p>
                                        </div>
                                        <span className="bg-primary text-white font-bold px-3 py-1 rounded-full text-sm shadow-sm uppercase tracking-wide flex items-center gap-1.5">
                                            {order['OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)']}
                                        </span>
                                    </div>

                                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                                        <div className="sm:col-span-2">
                                            <p className="text-sm text-gray-500 font-medium mb-2">Products Ordered</p>
                                            {order.Items && order.Items.length > 0 ? (
                                                <div className="space-y-1">
                                                    {order.Items.map((item, i) => (
                                                        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded px-3 py-1.5 border border-gray-100">
                                                            <span className="font-bold text-gray-900 text-sm">{item.product}</span>
                                                            <span className="text-primary font-bold text-sm">{item.quantity} {item.unit === 'Cubic Meters' ? 'm³' : item.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="font-bold text-gray-900 text-lg">{order.ProductOrdered} — {order.OrderQuantity}</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium mb-1">Order Date</p>
                                            <p className="font-bold text-gray-900">{new Date(order.OrderDate).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium mb-1">Dispatch Scheduled</p>
                                            <p className="font-bold text-gray-900">{order.DispatchSchedule || 'Not scheduled'}</p>
                                        </div>
                                        <div className="sm:col-span-2 pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-700">Thank You Email:</span>
                                                {order['ThankyouEmailSent (Yes/No)'] === 'Yes' ? (
                                                    <span className="flex items-center gap-1 bg-brand-100 text-brand-800 text-xs font-bold px-2 py-0.5 rounded"><CheckCircle2 size={12} /> Sent</span>
                                                ) : (
                                                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded">Not Sent</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-gray-700">Update Status:</span>
                                                <select
                                                    value={order['OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)']}
                                                    onChange={async (e) => {
                                                        await updateOrderStatus(order.OrderID, e.target.value);
                                                        showToast('Order status updated');
                                                        fetchData();
                                                    }}
                                                    className="px-3 py-1.5 border border-brand-300 rounded font-bold text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="Confirmed">Confirmed</option>
                                                    <option value="Dispatched">Dispatched</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: PAYMENT */}
                    {activeTab === 'payment' && (
                        <div className="animate-in fade-in duration-300 max-w-3xl">
                            {!order ? (
                                <div className="p-6 bg-gray-50 text-center rounded-lg border border-gray-200">
                                    <p className="text-gray-500 font-medium">An order must be created before recording payments.</p>
                                </div>
                            ) : !payment ? (
                                <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Clock size={48} className="mx-auto text-blue-500 mb-4" />
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Record Payment</h3>
                                    <button onClick={() => setIsPaymentModalOpen(true)} className="bg-primary text-white font-bold px-6 py-3 rounded-lg shadow mt-4 hover:bg-blue-800 transition-colors">
                                        Add Payment Details
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border relative overflow-hidden shadow-sm">
                                    {payment['PaymentStatus (Pending/Partial/Paid)'] === 'Paid' && (
                                        <div className="absolute top-8 right-8 rotate-12 pointer-events-none opacity-20">
                                            <div className="border-4 border-green-600 text-green-600 text-4xl font-black uppercase tracking-widest px-6 py-2 rounded-lg">PAID</div>
                                        </div>
                                    )}
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">Payment Summary</h3>
                                            <p className="text-sm font-mono text-gray-500 mt-0.5">Inv: {payment.InvoiceNumber}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide border
                      ${payment['PaymentStatus (Pending/Partial/Paid)'] === 'Paid' ? 'bg-primary text-white border-primary' :
                                                payment['PaymentStatus (Pending/Partial/Paid)'] === 'Partial' ? 'bg-brand-100 text-brand-800 border-brand-300' :
                                                    'bg-red-100 text-red-800 border-red-300'}`}>
                                            {payment['PaymentStatus (Pending/Partial/Paid)']}
                                        </span>
                                    </div>

                                    <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Amount</p>
                                            <p className="font-bold text-gray-900 text-2xl">₹{payment.TotalAmount}</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Paid Amount</p>
                                            <p className="font-bold text-brand-700 text-2xl">₹{payment.PaidAmount}</p>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                            <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">Outstanding</p>
                                            <p className="font-bold text-red-700 text-2xl">₹{payment.OutstandingAmount}</p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500 font-medium mb-1">Due Date</p>
                                            <p className="font-bold text-gray-900">{new Date(payment.DueDate).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium mb-1">Credit Period</p>
                                            <p className="font-bold text-gray-900">{payment.CreditPeriodDays} Days</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 font-medium mb-1">Credit Approval</p>
                                            <span className={`text-xs font-bold px-2 py-1 rounded inline-block mt-0.5 ${payment['CreditApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'] === 'PendingApproval' ? 'bg-brand-100 text-brand-800' : 'bg-gray-100 text-gray-600'}`}>
                                                {payment['CreditApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)']}
                                            </span>
                                        </div>
                                    </div>

                                    {payment['PaymentStatus (Pending/Partial/Paid)'] !== 'Paid' && (
                                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                            <button onClick={async () => {
                                                await updatePayment(payment.PaymentID, { PaidAmount: payment.TotalAmount });
                                                showToast('Marked as fully paid'); fetchData();
                                            }} className="bg-primary text-white font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-blue-800 transition-colors">
                                                Mark as Fully Paid
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 5: DOCUMENTS */}
                    {activeTab === 'documents' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-800">Files & Documents</h3>
                                <button className="flex items-center gap-2 bg-gray-100 text-gray-700 font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300">
                                    <Upload size={16} /> Upload Document
                                </button>
                            </div>

                            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                                {quotation && quotation.DriveFileURL ? (
                                    <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-red-50 text-red-500 rounded flex items-center justify-center shrink-0">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">Quotation_Document.pdf</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Uploaded {new Date(quotation.UpdatedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <a href={quotation.DriveFileURL} target="_blank" rel="noreferrer" className="text-primary hover:bg-blue-50 p-2 rounded transition-colors" title="Download">
                                            <Download size={20} />
                                        </a>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-gray-500 text-sm">No documents attached to this lead yet.</div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Log Interaction Modal */}
            {isInteractionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <form onSubmit={handleIntSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-base font-bold text-gray-800">Log Interaction</h2>
                            <button type="button" onClick={() => setIsInteractionModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Type *</label>
                                <select value={intForm.Type} onChange={e => setIntForm({ ...intForm, Type: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary">
                                    <option value="Call">Call</option>
                                    <option value="Email">Email</option>
                                    <option value="Visit">Visit</option>
                                    <option value="WhatsApp">WhatsApp</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Feedback *</label>
                                <select value={intForm.Feedback} onChange={e => setIntForm({ ...intForm, Feedback: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" required>
                                    <option value="">Select Option</option>
                                    <option value="Call not received">Call not received</option>
                                    <option value="Spoke with customer">Spoke with customer</option>
                                    <option value="Product details shared">Product details shared</option>
                                    <option value="Waiting for approval">Waiting for approval</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Remark 1</label><textarea value={intForm.Remark1} onChange={e => setIntForm({ ...intForm, Remark1: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded h-16 resize-none" /></div>
                            <div><label className="block text-sm font-bold text-gray-700 mb-1">Remark 2</label><textarea value={intForm.Remark2} onChange={e => setIntForm({ ...intForm, Remark2: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded h-16 resize-none" /></div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Next Follow-up</label>
                                <input type="date" value={intForm.NextFollowUpDate} onChange={e => setIntForm({ ...intForm, NextFollowUpDate: e.target.value })} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary" />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsInteractionModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold hover:bg-gray-100">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-blue-800 shadow-sm">Save Log</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Convert to Order Modal — multi-product cart */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <form onSubmit={handleOrdSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-brand-100 flex justify-between items-center bg-brand-50 sticky top-0">
                            <h2 className="text-base font-bold text-primary flex items-center gap-2"><ShoppingCart size={18} /> Convert to Order</h2>
                            <button type="button" onClick={() => setIsOrderModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-xs text-gray-500 font-medium">Add one or more products to this order.</p>

                            {/* Product rows */}
                            <div className="space-y-3">
                                {ordItems.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-end p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex-1 min-w-0">
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Product *</label>
                                            <select
                                                value={item.product}
                                                onChange={e => updateOrdItem(idx, 'product', e.target.value)}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-primary focus:border-primary bg-white"
                                                required
                                            >
                                                <option value="">Select...</option>
                                                {PRODUCTS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div className="w-24 shrink-0">
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Qty *</label>
                                            <input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                value={item.quantity}
                                                onChange={e => updateOrdItem(idx, 'quantity', e.target.value)}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-primary focus:border-primary"
                                                required
                                            />
                                        </div>
                                        <div className="w-24 shrink-0">
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Unit</label>
                                            <select
                                                value={item.unit}
                                                onChange={e => updateOrdItem(idx, 'unit', e.target.value)}
                                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-primary focus:border-primary bg-white"
                                            >
                                                {UNITS_LIST.map(u => <option key={u} value={u}>{u === 'Cubic Meters' ? 'm³' : u}</option>)}
                                            </select>
                                        </div>
                                        {ordItems.length > 1 && (
                                            <button type="button" onClick={() => removeOrdItem(idx)} className="mb-0.5 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0" title="Remove">
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button type="button" onClick={addOrdItem} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                                + Add another product
                            </button>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Dispatch Scheduled</label>
                                <input
                                    type="date"
                                    value={ordDispatch}
                                    onChange={e => setOrdDispatch(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded">
                                A Thank You message will be sent automatically upon order confirmation.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 sticky bottom-0">
                            <button type="button" onClick={() => setIsOrderModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-blue-800 shadow-sm flex items-center gap-2"><CheckCircle2 size={16} /> Confirm Order</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Record Payment Modal */}
            {isPaymentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <form onSubmit={handlePaySubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2"><Clock size={18} className="text-blue-500" /> Record Payment</h2>
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4 border-b-4 border-blue-500">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Invoice Number *</label>
                                <input type="text" required value={payForm.InvoiceNumber} onChange={e => setPayForm({ ...payForm, InvoiceNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" placeholder="INV-2026-001" />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Total Amount (₹) *</label>
                                    <input type="number" step="0.01" required value={payForm.TotalAmount} onChange={e => setPayForm({ ...payForm, TotalAmount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Paid Amount (₹)</label>
                                    <input type="number" step="0.01" value={payForm.PaidAmount} onChange={e => setPayForm({ ...payForm, PaidAmount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded" />
                                </div>
                            </div>
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex justify-between items-center">
                                <span className="text-sm font-bold text-red-900">Outstanding Amount:</span>
                                <span className="text-lg font-black text-red-700">₹{derivedOutstanding}</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Credit Days</label>
                                    <input type="number" value={payForm.CreditPeriodDays} onChange={e => setPayForm({ ...payForm, CreditPeriodDays: e.target.value })} className={`w-full px-3 py-2 border rounded ${parseInt(payForm.CreditPeriodDays) > thresholdDays ? 'border-blue-400 bg-brand-50' : 'border-gray-300'}`} />
                                    {parseInt(payForm.CreditPeriodDays) > thresholdDays && (
                                        <p className="text-[10px] text-primary font-bold mt-1 leading-tight">Requires Admin Approval (&gt; {thresholdDays} Days)</p>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Calculated Due Date</label>
                                    <div className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600 rounded font-mono text-sm">
                                        {derivedDueDate.toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded text-sm font-bold">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-primary text-white rounded text-sm font-bold hover:bg-blue-800 shadow-sm">Save Payment</button>
                        </div>
                    </form>
                </div>
            )}

        </div>
    );
}