/**
 * Google Sheets Configuration and Utilities
 *
 * This module contains configuration for Google Sheets integration.
 * Currently uses Google Apps Script as the backend, which handles all Sheets operations.
 *
 * Future: Can be extended to use Google Sheets API directly if needed.
 */

// Current backend configuration (Google Apps Script)
export const GOOGLE_APPS_SCRIPT_CONFIG = {
    BASE_URL: import.meta.env.VITE_APPS_SCRIPT_URL,
    IS_CONFIGURED: !!(import.meta.env.VITE_APPS_SCRIPT_URL && !import.meta.env.VITE_APPS_SCRIPT_URL.includes('YOUR_'))
};

// Future: Google Sheets API configuration (placeholder for migration)
export const GOOGLE_SHEETS_API_CONFIG = {
    SHEET_ID: import.meta.env.VITE_GOOGLE_SHEET_ID,
    API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
    CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    CLIENT_SECRET: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
    IS_CONFIGURED: !!(
        import.meta.env.VITE_GOOGLE_SHEET_ID &&
        import.meta.env.VITE_GOOGLE_SHEETS_API_KEY
    )
};

// Sheet structure configuration
export const SHEET_STRUCTURE = {
    users: {
        sheetName: 'Users',
        headers: [
            'UserID',
            'FullName',
            'Email',
            'Phone',
            'Role',
            'IsActive',
            'CreatedAt',
            'LastLogin'
        ]
    },
    customers: {
        sheetName: 'Customers',
        headers: [
            'CustomerID',
            'CustomerName',
            'Phone',
            'Email',
            'CompanyName',
            'City',
            'GSTNumber',
            'AssignedUserID',
            'CreatedAt'
        ]
    },
    leads: {
        sheetName: 'Leads',
        headers: [
            'LeadID',
            'CustomerID',
            'LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)',
            'ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)',
            'LeadSource (Phone/Instagram/Facebook/Walk-in)',
            'AssignedUserID',
            'CreatedAt',
            'UpdatedAt'
        ]
    },
    quotations: {
        sheetName: 'Quotations',
        headers: [
            'QuotationID',
            'LeadID',
            'CustomerID',
            'TotalValue',
            'QuotationDate',
            'Status',
            'NeedApproval'
        ]
    },
    orders: {
        sheetName: 'Orders',
        headers: [
            'OrderID',
            'LeadID',
            'CustomerID',
            'ProductOrdered',
            'OrderQuantity',
            'OrderDate',
            'Status',
            'PaymentStatus',
            'AssignedUserID'
        ]
    },
    payments: {
        sheetName: 'Payments',
        headers: [
            'PaymentID',
            'OrderID',
            'CustomerID',
            'InvoiceNumber',
            'TotalAmount',
            'PaidAmount',
            'OutstandingAmount',
            'Status',
            'CreditApprovalRequired',
            'AssignedUserID',
            'DueDate'
        ]
    },
    settings: {
        sheetName: 'Settings',
        headers: [
            'SettingKey',
            'SettingValue',
            'Description',
            'LastUpdated'
        ]
    }
};

/**
 * Future: Helper functions for Sheets API integration
 * These are placeholders for when we integrate directly with Google Sheets API
 */

export const googleSheetsHelpers = {
    /**
     * Initialize Sheets API client
     * @returns {Promise<void>}
     */
    async initializeClient() {
        // TODO: Implement when migrating to Sheets API
        throw new Error('Google Sheets API integration not yet implemented. Using Google Apps Script backend.');
    },

    /**
     * Read data from a sheet
     * @param {string} sheetName - Name of the sheet to read from
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async readFromSheet(sheetName, options = {}) {
        // TODO: Implement direct Sheets API call
        throw new Error('Direct Sheets API read not yet implemented. Use apiCall() instead.');
    },

    /**
     * Write data to a sheet
     * @param {string} sheetName - Name of the sheet
     * @param {Array} data - Data to write
     * @returns {Promise<Object>}
     */
    async writeToSheet(sheetName, data) {
        // TODO: Implement direct Sheets API call
        throw new Error('Direct Sheets API write not yet implemented. Use apiCall() instead.');
    },

    /**
     * Sync local cache with sheet
     * @returns {Promise<void>}
     */
    async syncWithSheet() {
        // TODO: Implement bidirectional sync
        throw new Error('Sync not yet implemented. Use individual fetch/update calls.');
    }
};

export default {
    GOOGLE_APPS_SCRIPT_CONFIG,
    GOOGLE_SHEETS_API_CONFIG,
    SHEET_STRUCTURE,
    googleSheetsHelpers
};
