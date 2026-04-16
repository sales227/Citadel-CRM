import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReminders } from '../context/ReminderContext';
import { Link } from 'react-router-dom';
import { apiCall, getCustomers, updateReminderStatus } from '../api/apiService';
import { Bell, CheckCircle2, XCircle, PhoneCall, CalendarClock, MessageSquare, Truck, PackageCheck, AlertTriangle } from 'lucide-react';

export default function RemindersPage() {
    const { user, isAdmin } = useAuth();
    const { fetchReminders } = useReminders();
    const [allReminders, setAllReminders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('Today');
    const [typeFilter, setTypeFilter] = useState('All');

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // In a real app we might fetch all past ones too, using a separate endpoint if needed.
            // But we will use apiCall direct to getReminders to ensure we just fetch raw data on mount.
            const params = isAdmin ? {} : { staffID: user?.UserID };
            const [rRes, cRes] = await Promise.all([
                apiCall('getReminders', params),
                getCustomers()
            ]);
            setAllReminders(rRes);
            setCustomers(cRes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = async (rId) => {
        try {
            // Use the apiService export which sends correct uppercase keys { ReminderID, Status }
            await updateReminderStatus(rId, 'Completed');
            setAllReminders(prev => prev.map(r =>
                r.ReminderID === rId
                    ? { ...r, Status: 'Completed', 'Status (Pending/Dismissed/Completed)': 'Completed' }
                    : r
            ));
            fetchReminders();
        } catch (e) {
            alert("Failed to mark complete");
        }
    };

    const handleDismiss = async (rId) => {
        try {
            await updateReminderStatus(rId, 'Dismissed');
            setAllReminders(prev => prev.map(r =>
                r.ReminderID === rId
                    ? { ...r, Status: 'Dismissed', 'Status (Pending/Dismissed/Completed)': 'Dismissed' }
                    : r
            ));
            fetchReminders();
        } catch (e) {
            alert("Failed to dismiss");
        }
    };

    const getTypeStyle = (type) => {
        switch (type) {
            case 'FollowUp':     return { icon: PhoneCall,    color: 'text-primary',    border: 'border-l-primary' };
            case 'Payment':      return { icon: AlertTriangle, color: 'text-blue-900',  border: 'border-l-blue-900' };
            case 'Dispatch':     return { icon: Truck,         color: 'text-blue-400',  border: 'border-l-blue-400' };
            case 'CrossSell':    return { icon: PackageCheck,  color: 'text-blue-600',  border: 'border-l-blue-600' };
            case 'GoogleReview': return { icon: Bell,          color: 'text-blue-500',  border: 'border-l-blue-500' };
            case 'Reference':    return { icon: Bell,          color: 'text-brand-700', border: 'border-l-brand-700' };
            case 'Quotation':    return { icon: Bell,          color: 'text-brand-800', border: 'border-l-brand-800' };
            default:             return { icon: Bell,          color: 'text-brand-600', border: 'border-l-brand-600' };
        }
    };

    const filteredReminders = allReminders.filter(r => {
        if (typeFilter !== 'All' && r.Type !== typeFilter) return false;

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const rDate = new Date(r.ReminderDate); rDate.setHours(0, 0, 0, 0);

        const effectiveStatus = r.Status || r['Status (Pending/Dismissed/Completed)'];
        const isCompleted = effectiveStatus === 'Completed' || effectiveStatus === 'Dismissed';

        if (activeTab === 'Today') {
            return !isCompleted && rDate.getTime() === today.getTime();
        } else if (activeTab === 'Upcoming') {
            return !isCompleted && rDate > today;
        } else if (activeTab === 'Overdue') {
            return !isCompleted && rDate < today;
        } else if (activeTab === 'Completed') {
            return isCompleted;
        }
        return true;
    });

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
            loadData().finally(() => setIsRefreshing(false));
        }
    };

    return (
        <div
            className="space-y-6 pb-12 min-h-[50vh]"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
        >
            {isRefreshing && (
                <div className="flex justify-center py-4 absolute top-0 left-0 right-0 z-10 bg-white shadow-sm border-b animate-in slide-in-from-top-full">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-primary font-bold text-sm">Refreshing...</span>
                </div>
            )}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto hide-scrollbar pb-2 sm:pb-0 z-10">
                    {['Today', 'Upcoming', 'Overdue', 'Completed'].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${activeTab === t ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {t}
                            {t === 'Overdue' && allReminders.some(r => r.Status === 'Pending' && new Date(r.ReminderDate).getTime() < new Date().setHours(0, 0, 0, 0)) && (
                                <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="z-10 w-full sm:w-auto">
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold bg-white focus:ring-primary focus:border-primary">
                        <option value="All">All Types</option>
                        <option value="FollowUp">FollowUp</option>
                        <option value="Payment">Payment</option>
                        <option value="Dispatch">Dispatch</option>
                        <option value="CrossSell">CrossSell</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-gray-500 animate-pulse">Loading reminders...</div>
            ) : filteredReminders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 flex flex-col items-center justify-center text-center">
                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                        <CalendarClock size={48} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No {activeTab.toLowerCase()} reminders</h3>
                    <p className="text-gray-500">You're all caught up for {activeTab.toLowerCase()}!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReminders.map(r => {
                        const style = getTypeStyle(r.Type);
                        const rDate = new Date(r.ReminderDate);
                        const isOverdue = rDate.getTime() < new Date().setHours(0, 0, 0, 0) && r.Status === 'Pending';
                        const Icon = style.icon;

                        return (
                            <div key={r.ReminderID} className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all hover:shadow-md border-l-[6px] ${style.border}`}>
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <Icon size={16} className={style.color} />
                                            <span className={`text-xs font-black uppercase tracking-wider ${style.color}`}>{r.Type}</span>
                                        </div>
                                        {isOverdue && activeTab !== 'Overdue' && (
                                            <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-red-100">Overdue</span>
                                        )}
                                    </div>

                                    <p className="text-sm font-bold text-gray-900 leading-tight mb-2 pr-4">{r.ReminderMessage}</p>

                                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-4">
                                        <CalendarClock size={14} className={isOverdue ? 'text-red-400' : 'text-gray-400'} />
                                        <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                                            {rDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                    </p>
                                </div>

                                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                    {r.Status === 'Pending' ? (
                                        <>
                                            <button onClick={() => handleMarkComplete(r.ReminderID)} className="flex-1 bg-white border border-gray-300 text-gray-700 text-xs font-bold py-1.5 rounded flex justify-center items-center gap-1 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors">
                                                <CheckCircle2 size={14} /> Complete
                                            </button>
                                            <button onClick={() => handleDismiss(r.ReminderID)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors" title="Dismiss">
                                                <XCircle size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={14} /> {r.Status}</span>
                                    )}
                                    {r.AssignedUserID && (
                                        <Link to={`/leads`} className="text-xs font-bold text-primary hover:underline ml-auto">Search Lead →</Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}