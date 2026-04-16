import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getReminders, updateReminderStatus } from '../api/apiService';

const ReminderContext = createContext();

export const useReminders = () => useContext(ReminderContext);

export const ReminderProvider = ({ children }) => {
    const { user } = useAuth();
    const [reminders, setReminders] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchReminders = useCallback(async () => {
        if (!user || (!user.UserID && !user.Role)) return;
        try {
            const data = await getReminders(user.UserID);
            setReminders(data);
            setUnreadCount(data.length); // Assuming all fetched ones are pending/unread
        } catch (error) {
            console.error('Failed to fetch reminders:', error);
        }
    }, [user]);

    useEffect(() => {
        // Initial fetch if authenticated
        if (user) {
            fetchReminders();
        } else {
            setReminders([]);
            setUnreadCount(0);
        }

        // Auto-poll every 5 minutes
        const interval = setInterval(() => {
            if (user) fetchReminders();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [user, fetchReminders]);

    const markDismissed = async (id) => {
        try {
            await updateReminderStatus(id, 'Dismissed');
            setReminders(prev => prev.filter(r => r.ReminderID !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to dismiss reminder:', error);
            throw error; // Let the caller handle if needed
        }
    };

    return (
        <ReminderContext.Provider value={{ reminders, unreadCount, fetchReminders, markDismissed }}>
            {children}
        </ReminderContext.Provider>
    );
};
