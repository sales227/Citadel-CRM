import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for syncing data from backend
 * Provides a reusable sync interface with loading state and error handling
 */
export const useSyncData = () => {
    const [syncing, setSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    const syncData = useCallback(async (asyncFunctions = [], onSuccess = null) => {
        // asyncFunctions: array of async functions to call (e.g., [fetchLeads, fetchCustomers])
        if (!Array.isArray(asyncFunctions) || asyncFunctions.length === 0) {
            console.warn('useSyncData: No functions provided to sync');
            return;
        }

        setSyncing(true);
        try {
            await Promise.all(asyncFunctions.map(fn => fn()));
            setLastSyncTime(new Date());
            toast.success('Data synced successfully', {
                duration: 2000,
                icon: '🔄',
            });
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Failed to sync data:', error);
            toast.error('Failed to sync data', {
                duration: 2000,
                icon: '❌',
            });
        } finally {
            setSyncing(false);
        }
    }, []);

    // Format last sync time (e.g., "2 mins ago")
    const getLastSyncDisplay = useCallback(() => {
        if (!lastSyncTime) return 'Never synced';
        const seconds = Math.floor((new Date() - lastSyncTime) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return 'Synced earlier';
    }, [lastSyncTime]);

    return {
        syncing,
        lastSyncTime,
        getLastSyncDisplay,
        syncData
    };
};
