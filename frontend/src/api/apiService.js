const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Lazy-loaded mock handler — only imported in dev when VITE_USE_MOCK=true
let mockHandler = null;
if (USE_MOCK) {
    import('./mockApiService').then(m => { mockHandler = m.default; });
}

export async function apiCall(action, payload = {}) {
    // --- DEV MOCK MODE (only available when VITE_USE_MOCK=true) ---
    if (USE_MOCK) {
        // Wait for lazy import to resolve on first call
        if (!mockHandler) {
            const m = await import('./mockApiService');
            mockHandler = m.default;
        }
        return mockHandler(action, payload);
    }

    // --- REAL API CALLS ---
    if (!APPS_SCRIPT_URL) {
        throw new Error('VITE_APPS_SCRIPT_URL is not configured. Set it in your .env file or enable VITE_USE_MOCK=true for development.');
    }

    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({ action, ...payload }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // For login we return data directly (google script returns {success, token, user})
        if (action === 'login') return data;

        if (!data.success && typeof data.success !== 'undefined') {
            throw new Error(data.message || data.error || "API request failed");
        }

        return data.data !== undefined ? data.data : data;
    } catch (err) {
        console.error(`API Error [${action}]: `, err);
        throw err;
    }
}

// Auth
export const login = (email, password) => apiCall('login', { email, password }).then(res => ({ token: res.token, user: res.user, ...res }));
export const changePassword = (userID, oldPassword, newPassword) => apiCall('changePassword', { userID, oldPassword, newPassword });

// Users
export const getUsers = () => apiCall('getUsers');
export const createUser = (data) => apiCall('createUser', data);
export const updateUser = (id, data) => apiCall('updateUser', { UserID: id, updates: data });
export const deactivateUser = (id) => apiCall('deactivateUser', { UserID: id });

// Customers
export const getCustomers = (filters = {}) => apiCall('getCustomers', filters);
export const getCustomerById = (id) => apiCall('getCustomerById', { customerID: id });
export const createCustomer = (data) => apiCall('createCustomer', data);
export const updateCustomer = (id, data) => apiCall('updateCustomer', { CustomerID: id, updates: data });

// Delete Customers (cascade)
export const deleteCustomers = (customerIDs, logUserID) => apiCall('deleteCustomers', { CustomerIDs: customerIDs, logUserID });

// Leads
export const getLeads = (filters = {}) => apiCall('getLeads', filters);
export const getLeadById = (id) => apiCall('getLeadById', { leadID: id });
export const createLead = (data) => apiCall('createLead', data);
export const updateLead = (id, data) => apiCall('updateLead', { LeadID: id, ...data });
export const deleteLeads = (leadIDs, logUserID) => apiCall('deleteLeads', { LeadIDs: leadIDs, logUserID });
export const deleteAllLeads = (logUserID) => apiCall('deleteAllLeads', { logUserID });

// Interactions
export const getInteractions = (leadId) => apiCall('getInteractions', { LeadID: leadId });
export const createInteraction = (data) => apiCall('createInteraction', data);

// Quotations
export const getQuotations = (leadId) => apiCall('getQuotations', { LeadID: leadId });
// Fetch all quotations (no lead filter) — used by Dashboard and admin views
export const getAllQuotations = () => apiCall('getQuotations', {});
export const createQuotation = (data) => apiCall('createQuotation', data);
export const updateQuotation = (id, data) => apiCall('updateQuotation', { QuotationID: id, updates: data });
export const approveQuotation = (id) => apiCall('approveQuotation', { QuotationID: id });

// Delete Quotations (cascade)
export const deleteQuotations = (quotationIDs, logUserID) => apiCall('deleteQuotations', { QuotationIDs: quotationIDs, logUserID });

// Orders
export const getOrders = (filters = {}) => apiCall('getOrders', filters);
export const createOrder = (data) => apiCall('createOrder', data);
export const updateOrderStatus = (id, status) => apiCall('updateOrderStatus', { OrderID: id, Status: status });
export const updateOrder = (id, data) => apiCall('updateOrder', { OrderID: id, updates: data });

// Delete Orders (cascade)
export const deleteOrders = (orderIDs, logUserID) => apiCall('deleteOrders', { OrderIDs: orderIDs, logUserID });

// Payments
export const getPayments = (filters = {}) => apiCall('getPayments', filters);
export const createPayment = (data) => apiCall('createPayment', data);
export const updatePayment = (id, data) => apiCall('updatePayment', { PaymentID: id, updates: data });
export const approveCredit = (id) => apiCall('approveCredit', { PaymentID: id });
export const deletePayments = (paymentIDs, logUserID) => apiCall('deletePayments', { PaymentIDs: paymentIDs, logUserID });

// Reminders
export const getReminders = (userId) => apiCall('getReminders', { AssignedUserID: userId, onlyPending: true });
export const updateReminderStatus = (id, status) => apiCall('updateReminderStatus', { ReminderID: id, Status: status });
export const createReminder = (data) => apiCall('createReminder', data);

// Dashboard
export const getDashboardStats = () => apiCall('getDashboardStats');

// Settings
export const getSettings = () => apiCall('getSettings');
export const updateSetting = (key, value) => apiCall('updateSetting', { SettingKey: key, SettingValue: value });
