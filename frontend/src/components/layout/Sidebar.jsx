import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useReminders } from '../../context/ReminderContext';
import { LayoutDashboard, Users, Building2, FileText, ShoppingCart, CreditCard, Bell, Settings, UserCog, LogOut, X } from 'lucide-react';

export default function Sidebar({ isMobileMenuOpen, closeMobileMenu }) {
    const { user, isAdmin, isManager, isStaff, logout } = useAuth();
    const { unreadCount } = useReminders();

    const baseItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Staff', 'User'] },
        { name: 'Leads', path: '/leads', icon: Users, roles: ['Admin', 'Manager', 'Staff'] },
        { name: 'Customers', path: '/customers', icon: Building2, roles: ['Admin', 'Manager', 'Staff'] },
        { name: 'Quotations', path: '/quotations', icon: FileText, roles: ['Admin', 'Manager', 'Staff'] },
        { name: 'Orders', path: '/orders', icon: ShoppingCart, roles: ['Admin', 'Manager', 'Staff'] },
        { name: 'Payments', path: '/payments', icon: CreditCard, roles: ['Admin'] },
        { name: 'Reminders', path: '/reminders', icon: Bell, roles: ['Admin', 'Manager', 'Staff', 'User'], badge: unreadCount },
        { name: 'Settings', path: '/settings', icon: Settings, roles: ['Admin'] },
        { name: 'Users', path: '/users', icon: UserCog, roles: ['Admin'] }
    ];

    // Filter items based on user role
    const navItems = baseItems.filter(item => item.roles.includes(user?.Role));

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const activeClass = "bg-primary text-white";
    const inactiveClass = "text-gray-600 hover:bg-[#E3F2FD] hover:text-primary";

    const sidebarContent = (
        <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm w-64">
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-2">
                    <img src="/logo.jpg" alt="Logo" className="h-8 object-contain mix-blend-multiply" />
                    <span className="text-xl font-bold text-gray-800 tracking-tight whitespace-nowrap">Citadel CRM</span>
                </div>
                {closeMobileMenu && (
                    <button onClick={closeMobileMenu} className="md:hidden text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                )}
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={closeMobileMenu}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors font-medium text-sm ${isActive ? activeClass : inactiveClass
                            }`
                        }
                    >
                        <item.icon size={20} className="shrink-0" />
                        <span className="truncate">{item.name}</span>
                        {item.badge > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                                {item.badge > 99 ? '99+' : item.badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-200 shrink-0">
                <div className="flex items-center flex-row mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-primary font-bold shrink-0">
                        {getInitials(user?.FullName)}
                    </div>
                    <div className="ml-3 overflow-hidden">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.FullName || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate pb-0.5">
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] uppercase font-semibold">{user?.Role || 'Staff'}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center justify-center w-full gap-2 px-4 py-2 text-sm text-red-600 transition-colors bg-red-50 hover:bg-red-100 rounded-md font-medium"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white z-20 border-r border-gray-200 shadow-sm">
                {sidebarContent}
            </div>

            {/* Mobile Overlay */}
            <div
                className={`md:hidden fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={closeMobileMenu}
            />

            {/* Mobile Sidebar */}
            <div
                className={`md:hidden fixed inset-y-0 left-0 flex w-64 z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
                onClick={e => e.stopPropagation()}
            >
                {sidebarContent}
            </div>
        </>
    );
}