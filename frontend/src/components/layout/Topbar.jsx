import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReminders } from '../../context/ReminderContext';
import { Bell, Menu, X } from 'lucide-react';

export default function Topbar({ title, onMobileMenuToggle }) {
    const { user } = useAuth();
    const { reminders, unreadCount, markDismissed } = useReminders();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const pendingReminders = reminders
        .filter(r => r["Status (Pending/Dismissed/Completed)"] === 'Pending')
        .slice(0, 5);

    return (
        <header className="fixed top-0 right-0 left-0 md:left-64 h-16 bg-white border-b border-gray-200 z-10 shadow-sm flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
                <button
                    onClick={onMobileMenuToggle}
                    className="md:hidden p-2 -ml-2 text-gray-500 hover:text-primary rounded-md bg-gray-50"
                >
                    <Menu size={24} />
                </button>
                <h1 className="text-xl font-bold text-gray-800 truncate">{title}</h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="p-2 text-gray-500 hover:text-primary transition-colors relative rounded-full hover:bg-blue-50 focus:outline-none"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="text-sm font-bold text-gray-700">Notifications</h3>
                                <span className="text-xs font-semibold bg-blue-100 text-primary px-2 py-0.5 rounded-full">{unreadCount} pending</span>
                            </div>
                            <div className="max-h-[60vh] overflow-y-auto">
                                {pendingReminders.length > 0 ? (
                                    pendingReminders.map(rem => (
                                        <div key={rem.ReminderID} className="px-4 py-3 border-b border-gray-50 hover:bg-blue-50/50 group transition-colors">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex-1">
                                                    <p className="text-[11px] font-bold tracking-wider text-primary mb-1 uppercase">
                                                        {rem["Type (FollowUp/Payment/Dispatch/CrossSell/GoogleReview/Reference/Quotation)"]}
                                                    </p>
                                                    <p className="text-sm text-gray-800 leading-snug">{rem.ReminderMessage}</p>
                                                    <p className="text-xs text-gray-400 mt-1.5 font-medium">
                                                        {new Date(rem.CreatedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => markDismissed(rem.ReminderID)}
                                                    className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-50"
                                                    title="Dismiss"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center text-sm text-gray-500 flex flex-col items-center">
                                        <Bell size={32} className="text-gray-300 mb-2" />
                                        No pending reminders
                                    </div>
                                )}
                            </div>
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
                                <a href="/reminders" className="text-xs font-bold text-primary hover:text-blue-800 uppercase tracking-wide">
                                    View all reminders
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-[0_0_0_2px_white,0_0_0_4px_#dbeafe]">
                    {getInitials(user?.FullName)}
                </div>
            </div>
        </header>
    );
}