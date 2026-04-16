import React, { useEffect, useState } from 'react';
import { useReminders } from '../../context/ReminderContext';
import { X, Bell } from 'lucide-react';

export default function NotificationPopup() {
    const { reminders, unreadCount, markDismissed } = useReminders();
    const [currentReminder, setCurrentReminder] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [seenReminders, setSeenReminders] = useState(new Set());

    const [touchStartY, setTouchStartY] = useState(null);

    useEffect(() => {
        if (unreadCount > 0 && reminders.length > 0) {
            const pendingReminders = reminders.filter(r => r["Status (Pending/Dismissed/Completed)"] === 'Pending');
            const newReminder = pendingReminders.find(r => !seenReminders.has(r.ReminderID));

            if (newReminder) {
                setCurrentReminder(newReminder);
                setIsVisible(true);
                setSeenReminders(prev => {
                    const updated = new Set(prev);
                    updated.add(newReminder.ReminderID);
                    return updated;
                });
            }
        }
    }, [reminders, unreadCount, seenReminders]);

    useEffect(() => {
        let timer;
        if (isVisible) {
            timer = setTimeout(() => {
                setIsVisible(false);
            }, 8000);
        }
        return () => clearTimeout(timer);
    }, [isVisible]);

    const handleTouchStart = (e) => {
        setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        if (touchStartY === null) return;
        const touchEndY = e.touches[0].clientY;
        const deltaY = touchEndY - touchStartY;

        if (deltaY > 50) { // swipe down threshold
            handleDismiss();
            setTouchStartY(null);
        }
    };

    const handleTouchEnd = () => {
        setTouchStartY(null);
    };

    const handleDismiss = () => {
        setIsVisible(false);
        markDismissed(currentReminder.ReminderID);
    };

    if (!isVisible || !currentReminder) return null;

    const type = currentReminder["Type (FollowUp/Payment/Dispatch/CrossSell/GoogleReview/Reference/Quotation)"];

    let borderColor = 'border-l-blue-500';
    let iconColor = 'text-blue-500';

    switch (type) {
        case 'FollowUp':     borderColor = 'border-l-primary';    iconColor = 'text-primary';    break;
        case 'Payment':      borderColor = 'border-l-blue-900';   iconColor = 'text-blue-900';   break;
        case 'Dispatch':     borderColor = 'border-l-blue-400';   iconColor = 'text-blue-400';   break;
        case 'CrossSell':    borderColor = 'border-l-blue-700';   iconColor = 'text-blue-700';   break;
        case 'GoogleReview': borderColor = 'border-l-blue-600';   iconColor = 'text-blue-600';   break;
        case 'Reference':    borderColor = 'border-l-blue-500';   iconColor = 'text-blue-500';   break;
        case 'Quotation':    borderColor = 'border-l-brand-800';  iconColor = 'text-brand-800';  break;
        default:             borderColor = 'border-l-primary';    iconColor = 'text-primary';    break;
    }

    return (
        <div
            className="fixed bottom-0 left-0 right-0 md:bottom-4 md:right-4 md:left-auto md:w-96 z-[60] transform transition-all duration-300 ease-in-out"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div className={`bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl border-t border-l border-r md:border-b border-gray-200 ${borderColor} border-l-[6px] md:border-l-4 p-5 md:p-4 flex items-start gap-4 rounded-t-2xl md:rounded-lg pb-8 md:pb-4`}>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 rounded-full md:hidden" />
                <div className={`mt-0.5 ${iconColor}`}>
                    <Bell size={20} />
                </div>
                <div className="flex-1 mt-1 md:mt-0">
                    <h4 className={`text-sm font-bold ${iconColor}`}>{type} Reminder</h4>
                    <p className="text-sm text-gray-700 mt-1 leading-snug">{currentReminder.ReminderMessage}</p>
                </div>
                <div className="flex flex-col gap-2 relative -top-1 -right-1 mt-1 md:mt-0">
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded md:p-1 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center transition-colors"
                        title="Dismiss"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}