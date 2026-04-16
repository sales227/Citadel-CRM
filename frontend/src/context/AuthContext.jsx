import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin } from '../api/apiService';
import { ROLE_PERMISSIONS, hasPermission as checkPermission, canAccessPage as checkCanAccessPage } from '../utils/permissions';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // On mount: restore session from localStorage
        const savedSession = localStorage.getItem('citadel_user');
        if (savedSession) {
            try {
                const parsedSession = JSON.parse(savedSession);
                setUser(parsedSession);
            } catch (e) {
                console.error('Failed to parse saved session', e);
                localStorage.removeItem('citadel_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await apiLogin(email, password);

            if (!response.success) {
                throw new Error(response.error || "Login failed");
            }

            const userData = {
                token: response.token,
                UserID: response.user.UserID,
                FullName: response.user.FullName,
                Email: response.user.Email,
                Role: response.user.Role
            };

            setUser(userData);
            localStorage.setItem('citadel_user', JSON.stringify(userData));
            return userData;
        } catch (error) {
            console.error('Login failed', error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('citadel_user');
    };

    const isAdmin = user?.Role === 'Admin';
    const isManager = user?.Role === 'Manager';
    const isStaff = user?.Role === 'Staff';
    const isUser = user?.Role === 'User';

    const hasPermission = (permission) => checkPermission(user?.Role, permission);
    const canAccessPage = (page) => checkCanAccessPage(user?.Role, page);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAdmin,
                isManager,
                isStaff,
                isUser,
                hasPermission,
                canAccessPage,
                permissions: ROLE_PERMISSIONS[user?.Role] || []
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

