import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSyncData } from '../hooks/useSyncData';
import {
    getDashboardStats,
    getAllQuotations,
    getPayments,
    getLeads,
    getCustomers,
    getUsers,
    getOrders,
    getReminders,
    approveQuotation,
    approveCredit
} from '../api/apiService';
import {
    UserPlus,
    Users,
    FileText,
    ShoppingCart,
    Clock,
    AlertCircle,
    Plus,
    MessageSquare,
    Bell,
    RefreshCw,
    Eye,
    CheckCircle,
    XCircle,
    ChevronRight,
    Building2
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

export default function DashboardPage() {
    const { user, isAdmin, isManager, isStaff, isUser } = useAuth();
    const { syncing, getLastSyncDisplay, syncData } = useSyncData();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [stats, setStats] = useState(null);
    const [followUps, setFollowUps] = useState([]);
    const [pendingQuotations, setPendingQuotations] = useState([]);
    const [pendingPaymentsApproval, setPendingPaymentsApproval] = useState([]);
    const [leads, setLeads] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch everything in parallel — all roles get their data; we filter client-side.
            const [
                dashboardStats,
                leadsList,
                customersList,
                usersList,
                quotationsList,
                paymentsList,
                ordersList,
                remindersList          // fetch inline — avoids context race condition on mount
            ] = await Promise.all([
                getDashboardStats(),
                getLeads(),
                getCustomers(),
                getUsers(),
                getAllQuotations(),     // all roles need quotation counts
                getPayments(),         // all roles need order/payment counts
                getOrders(),
                getReminders(isAdmin ? undefined : user?.UserID)
            ]);

            setStats(dashboardStats);

            // Build lookup maps once
            const cMap = {};
            customersList.forEach(c => { cMap[c.CustomerID] = c; });
            const lMap = {};
            leadsList.forEach(l => { lMap[l.LeadID] = l; });
            const uMap = {};
            usersList.forEach(u => { uMap[u.UserID] = u; });

            // Role-based filtering for counts shown in KPI cards
            const uid = user?.UserID;
            const filteredLeads     = isAdmin ? leadsList     : leadsList.filter(l => l.AssignedUserID === uid);
            const filteredCustomers = isAdmin ? customersList : customersList.filter(c => c.AssignedUserID === uid);
            const filteredOrders    = isAdmin ? ordersList    : ordersList.filter(o => o.AssignedUserID === uid);
            const filteredQuotations = isAdmin ? quotationsList : quotationsList.filter(q => q.AssignedUserID === uid || filteredLeads.some(l => l.LeadID === q.LeadID));

            setLeads(filteredLeads);
            setCustomers(filteredCustomers);
            setOrders(filteredOrders);
            setQuotations(filteredQuotations);

            // --- Follow-ups: FollowUp reminders fetched inline, not from stale context ---
            const pendingRems = remindersList
                .filter(r => {
                    const status = r.Status || r['Status (Pending/Dismissed/Completed)'];
                    const type   = r.Type;   // canonical short key used by all reminder records
                    return status === 'Pending' && type === 'FollowUp';
                })
                .slice(0, 10);

            const enrichedFollowUps = pendingRems.map(r => {
                const lead     = lMap[r.LeadID];
                const customer = lead ? cMap[lead.CustomerID] : (cMap[r.CustomerID] || null);
                const assignee = uMap[r.AssignedUserID];

                let daysSince = 0;
                const dateRef = lead?.UpdatedAt || lead?.CreatedAt;
                if (dateRef) {
                    daysSince = Math.floor((Date.now() - new Date(dateRef).getTime()) / (1000 * 3600 * 24));
                }

                return {
                    id:           r.ReminderID,
                    leadId:       r.LeadID,
                    customerName: customer?.CustomerName || 'Unknown',
                    product:      lead?.['ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)'] || 'Unknown',
                    daysSince,
                    assignedTo:   assignee?.FullName || 'Unassigned',
                    nextFollowUp: new Date(r.ReminderDate).toLocaleDateString()
                };
            });
            setFollowUps(enrichedFollowUps);

            // --- Admin-only: pending approval panels ---
            if (isAdmin) {
                const pQuos = quotationsList.filter(
                    q => q['ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'] === 'PendingApproval'
                );
                setPendingQuotations(pQuos.map(q => ({
                    id:           q.QuotationID,
                    customerName: cMap[q.CustomerID]?.CustomerName || 'Unknown',
                    product:      lMap[q.LeadID]?.['ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)'] || 'Unknown',
                    price:        q.QuotedPricePerUnit,
                    unit:         q.Unit
                })));

                const pPays = paymentsList.filter(
                    p => p['CreditApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'] === 'PendingApproval'
                );
                setPendingPaymentsApproval(pPays.map(p => ({
                    id:           p.PaymentID,
                    customerName: cMap[p.CustomerID]?.CustomerName || 'Unknown',
                    creditDays:   p.CreditPeriodDays,
                    amount:       p.TotalAmount
                })));
            }

        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    // After approving, re-fetch everything so KPI counts update immediately
    const handleApproveQuotation = async (id) => {
        try {
            await approveQuotation(id);
            await fetchDashboardData();
        } catch (e) {
            alert('Failed to approve quotation');
        }
    };

    const handleApproveCredit = async (id) => {
        try {
            await approveCredit(id);
            await fetchDashboardData();
        } catch (e) {
            alert('Failed to approve credit');
        }
    };

    const COLORS = {
        source: ['#0EA5E9', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444'],
        status: {
            'New':         '#9CA3AF',
            'Contacted':   '#0EA5E9',
            'Quoted':      '#8B5CF6',
            'Negotiating': '#F59E0B',
            'Won':         '#10B981',
            'Lost':        '#EF4444'
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-200 rounded-lg shadow-sm"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-gray-200 rounded-lg shadow-sm"></div>
                    <div className="h-80 bg-gray-200 rounded-lg shadow-sm"></div>
                </div>
                <div className="h-64 bg-gray-200 rounded-lg shadow-sm"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-red-100 max-w-lg mx-auto mt-12 text-center">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                    onClick={fetchDashboardData}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors"
                >
                    <RefreshCw size={18} />
                    Retry
                </button>
            </div>
        );
    }

    const KPICard = ({ title, value, icon: CardIcon, colorClass, bgClass, to }) => {
        const inner = (
            <div className={`p-6 rounded-xl shadow-sm border border-gray-100 bg-white relative overflow-hidden group ${to ? 'cursor-pointer hover:shadow-md hover:border-brand-200 transition-all' : ''}`}>
                <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
                    {CardIcon && <CardIcon size={64} className="-mt-4 -mr-4" />}
                </div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
                        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                    </div>
                    <div className={`p-3 rounded-lg ${bgClass} ${colorClass}`}>
                        {CardIcon && <CardIcon size={24} />}
                    </div>
                </div>
                {to && <p className="text-xs text-brand-600 font-semibold mt-3 relative z-10">Click to view →</p>}
            </div>
        );
        return to ? <Link to={to}>{inner}</Link> : inner;
    };

    return (
        <div className="space-y-8 pb-16 md:pb-0">

            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary to-blue-700 text-white p-6 rounded-xl shadow-md flex items-center justify-between">
                <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.FullName}!</h1>
                    <p className="text-blue-100">
                        {isAdmin && "You have full access to all features. Manage your team, approve quotations, and configure settings."}
                        {isManager && "Oversee your team's leads and customers. Monitor performance and track team activity."}
                        {isStaff && "Manage your leads and customers. Create quotations and track orders."}
                        {isUser && "View your leads and quotations. Check the status of your orders."}
                    </p>
                </div>
                <button
                    onClick={() => syncData([fetchDashboardData])}
                    disabled={syncing}
                    className="ml-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    title={`Refresh dashboard (${getLastSyncDisplay()})`}
                >
                    <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                    {syncing ? 'Syncing...' : 'Sync'}
                </button>
            </div>

            {/* KPI Cards row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isAdmin && (
                    <>
                        <KPICard title="New Leads Today"   value={stats?.newLeadsToday || 0}  icon={UserPlus}    colorClass="text-blue-600"   bgClass="bg-blue-50"   to="/leads?dateFilter=today" />
                        <KPICard title="Total Active Leads" value={stats?.totalLeads || 0}    icon={Users}       colorClass="text-sky-600"    bgClass="bg-sky-50"    to="/leads" />
                        <KPICard title="Pending Approvals" value={pendingQuotations.length + pendingPaymentsApproval.length} icon={FileText} colorClass="text-amber-600" bgClass="bg-amber-50" to="/leads?status=Quoted" />
                        <KPICard title="Orders Confirmed"  value={stats?.ordersConfirmed || 0} icon={ShoppingCart} colorClass="text-green-600" bgClass="bg-green-50" to="/orders" />
                        <KPICard title="Pending Payments"  value={stats?.pendingPayments || 0} icon={Clock}       colorClass="text-amber-600"  bgClass="bg-amber-50"  to="/payments?status=Pending" />
                        <KPICard title="Overdue Payments"  value={stats?.overduePayments || 0} icon={AlertCircle} colorClass="text-red-600"   bgClass="bg-red-50"    to="/payments?overdue=true" />
                    </>
                )}
                {isManager && (
                    <>
                        <KPICard title="Team Leads"         value={leads.length}    icon={Users}         colorClass="text-blue-600"   bgClass="bg-blue-50"   to="/leads" />
                        <KPICard title="Team Customers"     value={customers.length} icon={Building2}    colorClass="text-sky-600"    bgClass="bg-sky-50"    to="/customers" />
                        <KPICard title="Pending Quotations" value={quotations.filter(q => q['ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'] === 'PendingApproval').length} icon={FileText} colorClass="text-amber-600" bgClass="bg-amber-50" to="/leads?status=Quoted" />
                        <KPICard title="Total Orders"       value={orders.length}   icon={ShoppingCart}  colorClass="text-green-600"  bgClass="bg-green-50"  to="/orders" />
                        <KPICard title="Follow-ups Pending" value={followUps.length} icon={MessageSquare} colorClass="text-violet-600" bgClass="bg-violet-50" to="/reminders" />
                        <KPICard title="Team Performance"   value={leads.length > 0 ? Math.round((orders.length / leads.length) * 100) + '%' : '0%'} icon={CheckCircle} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
                    </>
                )}
                {isStaff && (
                    <>
                        <KPICard title="My Leads"           value={leads.length}     icon={UserPlus}      colorClass="text-blue-600"   bgClass="bg-blue-50"   to="/leads" />
                        <KPICard title="My Customers"       value={customers.length} icon={Users}         colorClass="text-sky-600"    bgClass="bg-sky-50"    to="/customers" />
                        <KPICard title="Pending Follow-ups" value={followUps.length} icon={MessageSquare} colorClass="text-violet-600" bgClass="bg-violet-50" to="/reminders" />
                        <KPICard title="Total Quotations"   value={quotations.length} icon={FileText}     colorClass="text-amber-600"  bgClass="bg-amber-50"  to="/leads" />
                        <KPICard title="This Month Orders"  value={orders.length}    icon={ShoppingCart}  colorClass="text-green-600"  bgClass="bg-green-50"  to="/orders" />
                        <KPICard title="Pending Approvals"  value={pendingQuotations.length} icon={Clock} colorClass="text-red-600"   bgClass="bg-red-50"    to="/leads?status=Quoted" />
                    </>
                )}
                {isUser && (
                    <>
                        <KPICard title="My Leads"   value={leads.length}      icon={UserPlus}     colorClass="text-blue-600"  bgClass="bg-blue-50"   to="/leads" />
                        <KPICard title="Quotations" value={quotations.length} icon={FileText}     colorClass="text-amber-600" bgClass="bg-amber-50"  to="/leads" />
                        <KPICard title="Orders"     value={orders.length}     icon={ShoppingCart} colorClass="text-green-600" bgClass="bg-green-50"  to="/orders" />
                    </>
                )}
            </div>

            {/* Charts Row - Admin only */}
            {isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[350px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Leads by Source</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats?.leadsBySource || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                            <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="count" fill="#1565C0" radius={[4, 4, 0, 0]} barSize={40}>
                                {(stats?.leadsBySource || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS.source[index % COLORS.source.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[350px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Leads by Status</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={stats?.leadsByStatus || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="count"
                                nameKey="status"
                            >
                                {(stats?.leadsByStatus || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS.status[entry.status] || '#9E9E9E'} />
                                ))}
                            </Pie>
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            )}

            {/* Pending Follow-ups */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Pending Follow-ups</h3>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Customer Name</th>
                                <th className="px-6 py-4 font-semibold">Product</th>
                                <th className="px-6 py-4 font-semibold">Days Since Last Contact</th>
                                <th className="px-6 py-4 font-semibold">Assigned To</th>
                                <th className="px-6 py-4 font-semibold">Next Follow-up</th>
                                <th className="px-6 py-4 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {followUps.length > 0 ? (
                                followUps.map((fu, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{fu.customerName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{fu.product}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${fu.daysSince > 3 ? 'bg-red-100 text-red-700' : 'bg-brand-100 text-brand-700'}`}>
                                                {fu.daysSince} days
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{fu.assignedTo}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{fu.nextFollowUp}</td>
                                        <td className="px-6 py-4 text-sm text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="text-primary hover:bg-blue-50 p-2 rounded-md transition-colors" title="Log Interaction">
                                                    <MessageSquare size={18} />
                                                </button>
                                                <Link to={`/leads/${fu.leadId}`} className="text-gray-500 hover:text-primary hover:bg-blue-50 p-2 rounded-md transition-colors" title="View Lead">
                                                    <Eye size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                                        No pending follow-ups right now. Great job!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {followUps.length > 0 ? (
                        followUps.map((fu, idx) => (
                            <div key={idx} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-base">{fu.customerName}</h4>
                                        <p className="text-sm text-gray-500">{fu.product}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${fu.daysSince > 3 ? 'bg-red-100 text-red-700' : 'bg-brand-100 text-brand-700'}`}>
                                        {fu.daysSince} days
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 flex justify-between">
                                    <span>Assigned: {fu.assignedTo}</span>
                                    <span className="font-medium">Due: {fu.nextFollowUp}</span>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button className="flex-1 flex justify-center items-center gap-2 bg-blue-50 text-primary py-2 rounded-lg text-sm font-bold">
                                        <MessageSquare size={16} /> Log Call
                                    </button>
                                    <Link to={`/leads/${fu.leadId}`} className="flex-1 flex justify-center items-center gap-2 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-bold">
                                        <Eye size={16} /> View
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-6 py-8 text-center text-sm text-gray-500">
                            No pending follow-ups right now. Great job!
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end">
                    <Link to="/reminders" className="text-sm font-bold text-primary flex items-center gap-1 hover:text-blue-800 transition-colors">
                        View All Reminders <ChevronRight size={16} />
                    </Link>
                </div>
            </div>

            {/* Admin Pending Approvals Panel */}
            {isAdmin && (pendingQuotations.length > 0 || pendingPaymentsApproval.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Quotations Pending */}
                    <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
                        <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center gap-2">
                            <AlertCircle size={20} className="text-amber-600" />
                            <h3 className="text-lg font-bold text-amber-700">Quotations Pending Approval</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {pendingQuotations.length > 0 ? (
                                pendingQuotations.map(q => (
                                    <div key={q.id} className="p-4 md:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-amber-50/40">
                                        <div>
                                            <h4 className="font-bold text-gray-900">{q.customerName}</h4>
                                            <p className="text-sm text-gray-600">{q.product}</p>
                                            <p className="text-sm font-medium mt-1 text-gray-800">₹{q.price} / {q.unit}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleApproveQuotation(q.id)} className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors">
                                                <CheckCircle size={16} /> Approve
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-6 text-center text-gray-500 text-sm">No quotations pending approval.</div>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {/* Mobile Floating Action Button (FAB) */}
            <div className="md:hidden fixed bottom-6 right-6 z-40 group">
                <button className="bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-800 transition-colors shadow-blue-500/30">
                    <Plus size={24} />
                </button>
                {/* Sub menu that appears on hover/click could go here */}
                <div className="absolute bottom-16 right-0 flex-col gap-3 hidden group-hover:flex pb-2">
                    <Link to="/leads" className="flex items-center justify-end gap-3 pointer-events-auto">
                        <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">New Lead</span>
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-primary shadow-md">
                            <UserPlus size={18} />
                        </div>
                    </Link>
                    <button className="flex items-center justify-end gap-3 pointer-events-auto">
                        <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">Log Interaction</span>
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-primary shadow-md">
                            <MessageSquare size={18} />
                        </div>
                    </button>
                    <Link to="/reminders" className="flex items-center justify-end gap-3 pointer-events-auto">
                        <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">Reminders</span>
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-primary shadow-md">
                            <Bell size={18} />
                        </div>
                    </Link>
                </div>
            </div>

        </div>
    );
}