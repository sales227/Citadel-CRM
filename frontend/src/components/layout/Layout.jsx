import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import NotificationPopup from '../common/NotificationPopup';

export default function Layout({ title: propTitle, children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    let title = propTitle;
    if (!title) {
        const path = location.pathname.split('/')[1];
        title = path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard';
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            <Sidebar
                isMobileMenuOpen={isMobileMenuOpen}
                closeMobileMenu={() => setIsMobileMenuOpen(false)}
            />

            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <Topbar
                    title={title}
                    onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 mt-16 md:ml-64 relative bg-gray-50/50">
                    <div className="max-w-7xl mx-auto pb-12">
                        {children || <Outlet />}
                    </div>
                </main>
            </div>

            <NotificationPopup />
        </div>
    );
}