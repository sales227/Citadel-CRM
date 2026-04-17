// --- MOCK DATABASE (dev only — excluded from production builds via VITE_USE_MOCK) ---

function createInitialMockDB() {
    return {
        users: [
            { UserID: 'USR-001', FullName: 'Demo Admin', Email: 'demo@user.com', Phone: '0000000000', Role: 'Admin', IsActive: true },
            { UserID: 'USR-002', FullName: 'Rajesh Kumar', Email: 'manager1@citadel.com', Phone: '9876543211', Role: 'Manager', IsActive: true },
            { UserID: 'USR-003', FullName: 'Priya Singh', Email: 'manager2@citadel.com', Phone: '9876543212', Role: 'Manager', IsActive: true },
            { UserID: 'USR-004', FullName: 'Amit Patel', Email: 'user1@citadel.com', Phone: '9876543213', Role: 'User', IsActive: true },
            { UserID: 'USR-005', FullName: 'Neha Verma', Email: 'user2@citadel.com', Phone: '9876543214', Role: 'User', IsActive: true },
            { UserID: 'USR-006', FullName: 'Sanjay Gupta', Email: 'user3@citadel.com', Phone: '9876543215', Role: 'User', IsActive: true }
        ],
        customers: [
            { CustomerID: 'CUS-001', CustomerName: 'Ramesh Patel', Phone: '9876543210', Email: 'ramesh@construction.com', CompanyName: 'Om Builders', City: 'Mumbai', GSTNumber: '22AAAAA0000A1Z5', AssignedUserID: 'USR-002', CustomerType: 'Dealer' },
            { CustomerID: 'CUS-002', CustomerName: 'Suresh Kumar', Phone: '9876511111', Email: 'suresh@sk.com', CompanyName: 'SK Enterprises', City: 'Pune', GSTNumber: '', AssignedUserID: 'USR-001', CustomerType: 'Direct' },
            { CustomerID: 'CUS-101', CustomerName: 'Yash Agrawal', CompanyName: 'Agrawal construction', Phone: '9518789502', Email: '', City: '', GSTNumber: '', AssignedUserID: 'USR-001' },
            { CustomerID: 'CUS-102', CustomerName: 'Mohan Davale Bhukum', CompanyName: 'Mohan Davale Bhukum', Phone: '9822377073', Email: '', City: '', GSTNumber: '', AssignedUserID: 'USR-001' },
            { CustomerID: 'CUS-103', CustomerName: 'Corporate Village', CompanyName: 'Corporate Village', Phone: '8879651792', Email: '', City: '', GSTNumber: '', AssignedUserID: 'USR-001' },
            { CustomerID: 'CUS-104', CustomerName: 'Satish Bora', CompanyName: 'Satish Bora', Phone: '9028846649', Email: '', City: '', GSTNumber: '', AssignedUserID: 'USR-001' },
            { CustomerID: 'CUS-105', CustomerName: 'Vijay Zambare', CompanyName: 'Vijay Zambare', Phone: '9766677776', Email: '', City: '', GSTNumber: '', AssignedUserID: 'USR-002' },
            { CustomerID: 'CUS-106', CustomerName: 'Deepak Patil', CompanyName: '', Phone: '8691846715', Email: '', City: '', GSTNumber: '', AssignedUserID: 'USR-001' },
            { CustomerID: 'CUS-107', CustomerName: 'Sharad Patil Wankhede', CompanyName: '', Phone: '7385291520', Email: '', City: '', GSTNumber: '', AssignedUserID: 'USR-001' },
            { CustomerID: 'CUS-108', CustomerName: 'Mujib Shaikh', CompanyName: 'Apna Traders-Parbhani', Phone: '9423324801', Email: '', City: 'Parbhani', GSTNumber: '', AssignedUserID: 'USR-002' },
            { CustomerID: 'CUS-109', CustomerName: 'Praveen Talekar', CompanyName: '', Phone: '9869428526', Email: '', City: '', GSTNumber: '', AssignedUserID: 'USR-001' },
            { CustomerID: 'CUS-110', CustomerName: 'Shriram Tiles', CompanyName: 'Shriram Tiles', Phone: '9822250520', Email: '', City: '', GSTNumber: '', AssignedUserID: 'USR-001' },
            { CustomerID: 'CUS-111', CustomerName: 'Kiran Kolgaonkar', CompanyName: 'Lotus Developers-Mumbai', Phone: '8452804976', Email: '', City: 'Mumbai', GSTNumber: '', AssignedUserID: 'USR-002' },
            { CustomerID: 'CUS-112', CustomerName: 'Laxman Mane', CompanyName: 'Laxman Mane-Wadgaonsheri', Phone: '8888965791', Email: '', City: 'Wadgaonsheri', GSTNumber: '', AssignedUserID: 'USR-001' },
            { CustomerID: 'CUS-113', CustomerName: 'Amarjit Singh Kaka', CompanyName: '', Phone: '9892231294', Email: '', City: '', GSTNumber: '', AssignedUserID: 'USR-001' },
            { CustomerID: 'CUS-114', CustomerName: 'Rushi Baba', CompanyName: 'Rushi Baba-Sunrise', Phone: '9623776290', Email: '', City: '', GSTNumber: '', AssignedUserID: 'USR-002' },
            { CustomerID: 'CUS-115', CustomerName: 'Arief', CompanyName: 'Arief-Lonavala', Phone: '8698778866', Email: '', City: 'Lonavala', GSTNumber: '', AssignedUserID: 'USR-001' },
            { CustomerID: 'CUS-116', CustomerName: 'Chandrashekhar Lawate', CompanyName: 'Chandrashekhar Lawate-Thane', Phone: '9821047049', Email: '', City: 'Thane', GSTNumber: '', AssignedUserID: 'USR-001' },
            { CustomerID: 'CUS-117', CustomerName: 'D.N. Ahire', CompanyName: 'D.N. Ahire-Malegaon', Phone: '9850224485', Email: '', City: 'Malegaon', GSTNumber: '', AssignedUserID: 'USR-002' },
            { CustomerID: 'CUS-118', CustomerName: 'Anil A Batra', CompanyName: '', Phone: '8888060001', Email: '', City: '', GSTNumber: '', AssignedUserID: 'USR-001' },
            { CustomerID: 'CUS-119', CustomerName: 'Nandurbar Dealer', CompanyName: 'Nandurbar Dealer', Phone: '9595312191', Email: '', City: 'Nandurbar', GSTNumber: '', AssignedUserID: 'USR-001' }
        ],
        leads: [
            { LeadID: 'L-001', CustomerID: 'CUS-001', "LeadSource (Phone/Instagram/Facebook/Walk-in)": 'Phone', "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": 'AAC Blocks', "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": 'New', AssignedUserID: 'USR-001', CreatedAt: new Date().toISOString() },
            { LeadID: 'L-002', CustomerID: 'CUS-002', "LeadSource (Phone/Instagram/Facebook/Walk-in)": 'Facebook', "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": 'Kavach Plaster', "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": 'Negotiating', AssignedUserID: 'USR-001', CreatedAt: new Date(Date.now() - 3600000).toISOString() },
            { LeadID: 'L-101', CustomerID: 'CUS-101', "LeadSource (Phone/Instagram/Facebook/Walk-in)": 'Phone', "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": 'AAC Blocks', "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": 'New', AssignedUserID: 'USR-001', CreatedAt: '2025-12-01T10:00:00.000Z' },
            { LeadID: 'L-102', CustomerID: 'CUS-102', "LeadSource (Phone/Instagram/Facebook/Walk-in)": 'Walk-in', "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": 'Kavach Plaster', "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": 'Contacted', AssignedUserID: 'USR-001', CreatedAt: '2025-12-01T11:00:00.000Z' },
            { LeadID: 'L-103', CustomerID: 'CUS-103', "LeadSource (Phone/Instagram/Facebook/Walk-in)": 'Phone', "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": 'Citabond Mortar', "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": 'Negotiating', AssignedUserID: 'USR-001', CreatedAt: '2025-12-01T12:00:00.000Z' },
            { LeadID: 'L-104', CustomerID: 'CUS-104', "LeadSource (Phone/Instagram/Facebook/Walk-in)": 'Facebook', "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": 'AAC Blocks', "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": 'New', AssignedUserID: 'USR-001', CreatedAt: '2025-12-01T13:00:00.000Z' },
            { LeadID: 'L-105', CustomerID: 'CUS-105', "LeadSource (Phone/Instagram/Facebook/Walk-in)": 'Phone', "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": 'AAC Blocks', "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": 'Quoted', AssignedUserID: 'USR-002', CreatedAt: '2025-12-01T14:00:00.000Z' },
            { LeadID: 'L-106', CustomerID: 'CUS-106', "LeadSource (Phone/Instagram/Facebook/Walk-in)": 'Instagram', "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": 'Kavach Plaster', "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": 'Contacted', AssignedUserID: 'USR-001', CreatedAt: '2025-12-01T15:00:00.000Z' },
            { LeadID: 'L-107', CustomerID: 'CUS-107', "LeadSource (Phone/Instagram/Facebook/Walk-in)": 'Phone', "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": 'AAC Blocks', "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": 'New', AssignedUserID: 'USR-001', CreatedAt: '2025-12-01T16:00:00.000Z' },
            { LeadID: 'L-108', CustomerID: 'CUS-108', "LeadSource (Phone/Instagram/Facebook/Walk-in)": 'Phone', "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": 'Citabond Mortar', "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": 'Won', AssignedUserID: 'USR-002', CreatedAt: '2025-12-01T17:00:00.000Z' },
            { LeadID: 'L-109', CustomerID: 'CUS-109', "LeadSource (Phone/Instagram/Facebook/Walk-in)": 'Walk-in', "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": 'AAC Blocks', "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": 'New', AssignedUserID: 'USR-001', CreatedAt: '2025-12-01T18:00:00.000Z' },
            { LeadID: 'L-110', CustomerID: 'CUS-110', "LeadSource (Phone/Instagram/Facebook/Walk-in)": 'Phone', "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": 'Kavach Plaster', "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": 'Contacted', AssignedUserID: 'USR-001', CreatedAt: '2025-12-01T19:00:00.000Z' }
        ],
        interactions: [],
        quotations: [
            { QuotationID: 'Q-001', LeadID: 'L-002', CustomerID: 'CUS-002', TotalValue: 45000, QuotationDate: new Date().toISOString(), Status: 'Sent', NeedApproval: 'No' }
        ],
        orders: [
            {
                OrderID: 'ORD-001', LeadID: 'L-002', CustomerID: 'CUS-002',
                ProductOrdered: 'Kavach Plaster', OrderQuantity: '500 Bags',
                OrderDate: new Date().toISOString(),
                'OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)': 'Confirmed',
                'PaymentStatus (Pending/Partial/Paid)': 'Partial',
                'ThankyouEmailSent (Yes/No)': 'Yes',
                AssignedUserID: 'USR-001'
            }
        ],
        payments: [
            {
                PaymentID: 'PAY-001', OrderID: 'ORD-001', CustomerID: 'CUS-002',
                InvoiceNumber: 'INV-1001', TotalAmount: 45000, PaidAmount: 20000,
                OutstandingAmount: '25000.00',
                'PaymentStatus (Pending/Partial/Paid)': 'Partial',
                CreditPeriodDays: 30,
                'CreditApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)': 'NotRequired',
                AssignedUserID: 'USR-001',
                DueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
                CreatedAt: new Date().toISOString()
            }
        ],
        reminders: [
            {
                ReminderID: 'REM-001', Type: 'FollowUp',
                LeadID: 'L-001', CustomerID: 'CUS-001', AssignedUserID: 'USR-001',
                ReminderDate: new Date().toISOString(),
                ReminderMessage: 'Call Ramesh regarding new site.',
                'Status (Pending/Dismissed/Completed)': 'Pending', Status: 'Pending'
            },
            {
                ReminderID: 'REM-002', Type: 'Payment',
                LeadID: 'L-002', CustomerID: 'CUS-002', AssignedUserID: 'USR-001',
                ReminderDate: new Date(Date.now() - 86400000).toISOString(),
                ReminderMessage: 'Collect advance for INV-1001.',
                'Status (Pending/Dismissed/Completed)': 'Pending', Status: 'Pending'
            }
        ],
        settings: [
            { SettingKey: 'PriceApprovalThreshold', SettingValue: '3650' },
            { SettingKey: 'CreditApprovalThresholdDays', SettingValue: '45' },
            { SettingKey: 'AutoFollowUpEmailEnabled', SettingValue: 'true' },
            { SettingKey: 'CompanyName', SettingValue: 'Citadel' }
        ],
        stats: {
            newLeadsToday: 5,
            totalLeads: 12,
            quotationsSent: 15,
            ordersConfirmed: 24,
            pendingPayments: 6,
            overduePayments: 2,
            leadsBySource: [
                { source: 'Phone', count: 7 },
                { source: 'Facebook', count: 2 },
                { source: 'Walk-in', count: 2 },
                { source: 'Instagram', count: 1 }
            ],
            leadsByStatus: [
                { status: 'New', count: 5 },
                { status: 'Contacted', count: 3 },
                { status: 'Negotiating', count: 2 },
                { status: 'Quoted', count: 1 },
                { status: 'Won', count: 1 }
            ]
        }
    };
}

// Persist mock DB in localStorage so data survives page refreshes
const STORAGE_KEY = 'citadel_mock_db_v1';

function loadMockDB() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch (e) { /* ignore parse errors */ }
    return null;
}

function saveMockDB() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DB));
    } catch (e) { /* ignore quota errors */ }
}

// Use globalThis for Vite HMR within a session, localStorage across refreshes
if (!globalThis.__CITADEL_MOCK_DB__) {
    globalThis.__CITADEL_MOCK_DB__ = loadMockDB() || createInitialMockDB();
}
let MOCK_DB = globalThis.__CITADEL_MOCK_DB__;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock passwords — dev only, never shipped in production bundle
const MOCK_PASSWORDS = {
    'demo@user.com': 'demo',
    'manager1@citadel.com': 'Manager@1234',
    'manager2@citadel.com': 'Manager@1234',
    'user1@citadel.com': 'User@1234',
    'user2@citadel.com': 'User@1234',
    'user3@citadel.com': 'User@1234'
};

const READ_ACTIONS = new Set(['login', 'getDashboardStats', 'getSettings', 'getUsers', 'getCustomers', 'getCustomerById', 'getLeads', 'getLeadById', 'getInteractions', 'getQuotations', 'getOrders', 'getPayments', 'getReminders']);

export default async function handleMockAction(action, payload) {
    const result = await _handleMockAction(action, payload);
    if (!READ_ACTIONS.has(action)) saveMockDB();
    return result;
}

async function _handleMockAction(action, payload) {
    console.warn(`[Mock API] Intercepting ${action}`, payload);
    await delay(600);

    switch (action) {
        case 'login': {
            const user = MOCK_DB.users.find(u => u.Email === payload.email);
            if (user && MOCK_PASSWORDS[payload.email] === payload.password) {
                return { success: true, token: 'mock-token-' + user.UserID, user };
            }
            return { success: false, error: 'Invalid email or password' };
        }

        case 'getDashboardStats': {
            // Compute dynamically so new orders/leads are immediately reflected
            const today = new Date(); today.setHours(0, 0, 0, 0);

            const newLeadsToday = MOCK_DB.leads.filter(l => {
                const d = new Date(l.CreatedAt); d.setHours(0, 0, 0, 0);
                return d.getTime() === today.getTime();
            }).length;

            const statusCounts = {};
            const sourceCounts = {};
            for (const l of MOCK_DB.leads) {
                const s = l['LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)'] || 'New';
                statusCounts[s] = (statusCounts[s] || 0) + 1;
                const src = l['LeadSource (Phone/Instagram/Facebook/Walk-in)'] || 'Unknown';
                sourceCounts[src] = (sourceCounts[src] || 0) + 1;
            }

            // Helper: read canonical status key with fallback for legacy seed rows
            const orderStatus = (o) =>
                o['OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)'] || o.Status || '';
            const payStatus = (p) =>
                p['PaymentStatus (Pending/Partial/Paid)'] || p.Status || '';

            const pendingPayments = MOCK_DB.payments.filter(p => payStatus(p) !== 'Paid').length;
            const overduePayments = MOCK_DB.payments.filter(p => {
                const d = new Date(p.DueDate);
                return d < today && payStatus(p) !== 'Paid';
            }).length;

            // Revenue aggregates
            const totalRevenue = MOCK_DB.payments.reduce((s, p) => s + (parseFloat(p.PaidAmount) || 0), 0);
            const totalOutstanding = MOCK_DB.payments.reduce((s, p) => s + (parseFloat(p.OutstandingAmount) || 0), 0);

            return {
                newLeadsToday,
                totalLeads: MOCK_DB.leads.length,
                quotationsSent: MOCK_DB.quotations.length,
                ordersConfirmed: MOCK_DB.orders.filter(
                    o => orderStatus(o) !== 'Cancelled'
                ).length,
                pendingPayments,
                overduePayments,
                totalRevenue: totalRevenue.toFixed(2),
                totalOutstanding: totalOutstanding.toFixed(2),
                leadsBySource: Object.entries(sourceCounts).map(([source, count]) => ({ source, count })),
                leadsByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count }))
            };
        }

        case 'getSettings':
            return MOCK_DB.settings;

        case 'updateSetting': {
            const setIdx = MOCK_DB.settings.findIndex(s => s.SettingKey === payload.SettingKey);
            if (setIdx > -1) MOCK_DB.settings[setIdx].SettingValue = payload.SettingValue;
            else MOCK_DB.settings.push({ SettingKey: payload.SettingKey, SettingValue: payload.SettingValue });
            return { success: true };
        }

        case 'getUsers': return MOCK_DB.users;

        case 'createUser': {
            const newUser = {
                UserID: `USR-${Date.now()}`,
                FullName: payload.FullName,
                Email: payload.Email,
                Phone: payload.Phone || '',
                Role: payload.Role || 'Staff',
                IsActive: true
            };
            MOCK_DB.users.push(newUser);
            return { success: true, UserID: newUser.UserID };
        }

        case 'updateUser': {
            const userIdx = MOCK_DB.users.findIndex(u => u.UserID === payload.UserID);
            if (userIdx > -1) {
                if (payload.updates.FullName) MOCK_DB.users[userIdx].FullName = payload.updates.FullName;
                if (payload.updates.Phone) MOCK_DB.users[userIdx].Phone = payload.updates.Phone;
                if (payload.updates.Role) MOCK_DB.users[userIdx].Role = payload.updates.Role;
                if (payload.updates.PasswordHash) MOCK_DB.users[userIdx].PasswordHash = payload.updates.PasswordHash;
            }
            return { success: true };
        }

        case 'deactivateUser': {
            const userIdx2 = MOCK_DB.users.findIndex(u => u.UserID === payload.UserID);
            if (userIdx2 > -1) {
                MOCK_DB.users[userIdx2].IsActive = false;
            }
            return { success: true };
        }

        case 'getCustomers': return MOCK_DB.customers;
        case 'getCustomerById': {
            const cust = MOCK_DB.customers.find(c => c.CustomerID === payload.customerID);
            return cust || { success: false, message: 'Customer not found' };
        }
        case 'getLeads': return MOCK_DB.leads;
        case 'getLeadById': {
            const foundLead = MOCK_DB.leads.find(l => l.LeadID === payload.leadID);
            if (!foundLead) return { success: false, message: 'Lead not found' };
            const foundCust = MOCK_DB.customers.find(c => c.CustomerID === foundLead.CustomerID);
            return { lead: foundLead, customer: foundCust || null };
        }
        case 'getInteractions': return MOCK_DB.interactions.filter(i => i.LeadID === payload.LeadID);
        case 'getQuotations':
            // Filter by LeadID when provided (fixes "all leads see all quotations" bug)
            return payload.LeadID
                ? MOCK_DB.quotations.filter(q => q.LeadID === payload.LeadID)
                : MOCK_DB.quotations;
        case 'getOrders': return MOCK_DB.orders;
        case 'getPayments': return MOCK_DB.payments;
        case 'getReminders': {
            let rems = [...MOCK_DB.reminders];
            if (payload.AssignedUserID) rems = rems.filter(r => r.AssignedUserID === payload.AssignedUserID);
            if (payload.onlyPending) rems = rems.filter(r => {
                const s = r.Status || r['Status (Pending/Dismissed/Completed)'];
                return s !== 'Completed' && s !== 'Dismissed';
            });
            return rems;
        }

        case 'updateReminderStatus': {
            const rem = MOCK_DB.reminders.find(r => r.ReminderID === payload.ReminderID);
            if (rem) {
                rem["Status (Pending/Dismissed/Completed)"] = payload.Status;
                rem.Status = payload.Status;
            }
            return { success: true };
        }

        case 'updateLead': {
            const led = MOCK_DB.leads.find(l => l.LeadID === payload.LeadID);
            if (led) Object.assign(led, payload);
            return { success: true };
        }

        case 'updateOrderStatus': {
            const ord = MOCK_DB.orders.find(o => o.OrderID === payload.OrderID);
            if (ord) {
                // Fix: was setting wrong key `ord.Status`; must use the full column name
                ord['OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)'] = payload.Status;
            }
            return { success: true };
        }

        case 'updateOrder': {
            const ordIdx = MOCK_DB.orders.findIndex(o => o.OrderID === payload.OrderID);
            if (ordIdx > -1) Object.assign(MOCK_DB.orders[ordIdx], payload.updates);
            return { success: true };
        }

        case 'createQuotation': {
            const thresholdPrice = parseFloat(
                (MOCK_DB.settings.find(s => s.SettingKey === 'PriceApprovalThreshold') || {}).SettingValue || '3650'
            );
            const ppu = parseFloat(payload.QuotedPricePerUnit) || 0;
            const needsApproval = ppu > 0 && ppu < thresholdPrice;
            const newQuo = {
                QuotationID: `Q-${Date.now()}`,
                LeadID: payload.LeadID || '',
                CustomerID: payload.CustomerID || '',
                'QuotationAsked (Yes/No)': payload.QuotationAsked || 'Yes',
                'QuotationSent (Yes/No)': payload.QuotationSent || 'No',
                QuotationDate: payload.QuotationDate || new Date().toISOString(),
                QuotedPricePerUnit: ppu,
                QuotedPrice: parseFloat(payload.QuotedPrice) || 0,
                Unit: payload.Unit || 'Cubic Meters',
                Notes: payload.Notes || '',
                DriveFileURL: payload.DriveFileURL || '',
                'ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)': needsApproval ? 'PendingApproval' : 'NotRequired',
                TotalValue: parseFloat(payload.QuotedPrice) || 0,
                Status: 'Sent',
                NeedApproval: needsApproval ? 'Yes' : 'No'
            };
            MOCK_DB.quotations.push(newQuo);
            return { success: true, QuotationID: newQuo.QuotationID };
        }

        case 'updateQuotation': {
            const quoIdx = MOCK_DB.quotations.findIndex(q => q.QuotationID === payload.QuotationID);
            if (quoIdx > -1) {
                const updates = payload.updates || {};
                const thresholdPrice = parseFloat(
                    (MOCK_DB.settings.find(s => s.SettingKey === 'PriceApprovalThreshold') || {}).SettingValue || '3650'
                );
                Object.assign(MOCK_DB.quotations[quoIdx], updates);
                // Recalculate approval status when price changes
                const ppu = parseFloat(MOCK_DB.quotations[quoIdx].QuotedPricePerUnit) || 0;
                if (ppu > 0 && ppu < thresholdPrice) {
                    MOCK_DB.quotations[quoIdx]['ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'] = 'PendingApproval';
                } else if (ppu >= thresholdPrice) {
                    MOCK_DB.quotations[quoIdx]['ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'] = 'NotRequired';
                }
            }
            return { success: true };
        }

        case 'approveQuotation': {
            const qIdx = MOCK_DB.quotations.findIndex(q => q.QuotationID === payload.QuotationID);
            if (qIdx > -1) {
                MOCK_DB.quotations[qIdx]['ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'] = 'Approved';
            }
            return { success: true };
        }

        case 'deleteQuotations': {
            if (!payload.QuotationIDs || payload.QuotationIDs.length === 0) return { success: false };
            const ids = new Set(payload.QuotationIDs);
            MOCK_DB.quotations = MOCK_DB.quotations.filter(q => !ids.has(q.QuotationID));
            return { success: true };
        }

        case 'createOrder': {
            const items = payload.Items || [];
            const newOrd = {
                OrderID: `ORD-${Date.now()}`,
                LeadID: payload.LeadID || '',
                CustomerID: payload.CustomerID || '',
                QuotationID: payload.QuotationID || '',
                // Support both legacy single-product and new multi-product
                ProductOrdered: items.length > 0
                    ? items.map(i => i.product).join(', ')
                    : (payload.ProductOrdered || ''),
                Items: items,
                OrderQuantity: items.length > 0
                    ? items.map(i => `${i.quantity} ${i.unit}`).join(', ')
                    : (payload.OrderQuantity || ''),
                OrderDate: new Date().toISOString(),
                DispatchSchedule: payload.DispatchSchedule || '',
                DispatchDate: payload.DispatchDate || '',
                'OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)': 'Confirmed',
                'PaymentStatus (Pending/Partial/Paid)': 'Pending',
                AssignedUserID: payload.AssignedUserID || '',
                'ThankyouEmailSent (Yes/No)': 'No'
            };
            MOCK_DB.orders.unshift(newOrd);
            // Mark lead as Won when order is created
            const led2 = MOCK_DB.leads.find(l => l.LeadID === payload.LeadID);
            if (led2) {
                led2.OrderFlag = 'Y';
                led2['LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)'] = 'Won';
            }
            // Fire thank-you message (console stub — replace with real API in production)
            if (payload.sendThankYou !== false) {
                console.info('[Mock] Thank-you message triggered for CustomerID:', payload.CustomerID, '| OrderID:', newOrd.OrderID);
                newOrd['ThankyouEmailSent (Yes/No)'] = 'Yes';
            }
            return { success: true, OrderID: newOrd.OrderID };
        }

        case 'deleteOrders': {
            if (!payload.OrderIDs || payload.OrderIDs.length === 0) return { success: false };
            const ids = new Set(payload.OrderIDs);
            MOCK_DB.orders = MOCK_DB.orders.filter(o => !ids.has(o.OrderID));
            // Cascade: remove linked payments
            MOCK_DB.payments = MOCK_DB.payments.filter(p => !ids.has(p.OrderID));
            return { success: true };
        }

        case 'createPayment': {
            const paidAmt = parseFloat(payload.PaidAmount) || 0;
            const totalAmt = parseFloat(payload.TotalAmount) || 0;
            const outstandingAmt = Math.max(0, totalAmt - paidAmt);
            let payStatus = 'Pending';
            if (paidAmt >= totalAmt && totalAmt > 0) payStatus = 'Paid';
            else if (paidAmt > 0) payStatus = 'Partial';

            const creditDays = parseInt(payload.CreditPeriodDays) || 0;
            const thresholdDays = parseInt(
                (MOCK_DB.settings.find(s => s.SettingKey === 'CreditApprovalThresholdDays') || {}).SettingValue || '45'
            );
            const needsCreditApproval = creditDays > thresholdDays;

            const newPay = {
                PaymentID: `PAY-${Date.now()}`,
                OrderID: payload.OrderID || '',
                CustomerID: payload.CustomerID || '',
                InvoiceNumber: payload.InvoiceNumber || `INV-${Date.now()}`,
                TotalAmount: totalAmt,
                PaidAmount: paidAmt,
                OutstandingAmount: outstandingAmt.toFixed(2),
                'PaymentStatus (Pending/Partial/Paid)': payStatus,
                CreditPeriodDays: creditDays,
                'CreditApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)': needsCreditApproval ? 'PendingApproval' : 'NotRequired',
                DueDate: payload.DueDate || new Date(Date.now() + creditDays * 86400000).toISOString(),
                AssignedUserID: payload.AssignedUserID || '',
                CreatedAt: new Date().toISOString()
            };
            MOCK_DB.payments.unshift(newPay);

            // Sync order payment status
            const linkedOrd = MOCK_DB.orders.find(o => o.OrderID === payload.OrderID);
            if (linkedOrd) linkedOrd['PaymentStatus (Pending/Partial/Paid)'] = payStatus;

            return { success: true, PaymentID: newPay.PaymentID };
        }

        case 'updatePayment': {
            const payIdx = MOCK_DB.payments.findIndex(p => p.PaymentID === payload.PaymentID);
            if (payIdx > -1) {
                const updates = payload.updates || {};
                Object.assign(MOCK_DB.payments[payIdx], updates);

                // Recalculate outstanding and status after every update
                const p = MOCK_DB.payments[payIdx];
                const total = parseFloat(p.TotalAmount) || 0;
                const paid = parseFloat(p.PaidAmount) || 0;
                p.OutstandingAmount = Math.max(0, total - paid).toFixed(2);

                if (paid >= total && total > 0) {
                    p['PaymentStatus (Pending/Partial/Paid)'] = 'Paid';
                } else if (paid > 0) {
                    p['PaymentStatus (Pending/Partial/Paid)'] = 'Partial';
                } else {
                    p['PaymentStatus (Pending/Partial/Paid)'] = 'Pending';
                }

                // Sync linked order payment status
                const linkedOrd2 = MOCK_DB.orders.find(o => o.OrderID === p.OrderID);
                if (linkedOrd2) linkedOrd2['PaymentStatus (Pending/Partial/Paid)'] = p['PaymentStatus (Pending/Partial/Paid)'];
            }
            return { success: true };
        }

        case 'deletePayments': {
            if (!payload.PaymentIDs || payload.PaymentIDs.length === 0) return { success: false };
            const ids = new Set(payload.PaymentIDs);
            MOCK_DB.payments = MOCK_DB.payments.filter(p => !ids.has(p.PaymentID));
            return { success: true };
        }

        case 'approveCredit': {
            const payIdx2 = MOCK_DB.payments.findIndex(p => p.PaymentID === payload.PaymentID);
            if (payIdx2 > -1) {
                MOCK_DB.payments[payIdx2]['CreditApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)'] = 'Approved';
            }
            return { success: true };
        }

        case 'deleteCustomers': {
            if (!payload.CustomerIDs || payload.CustomerIDs.length === 0) return { success: false };
            const ids = new Set(payload.CustomerIDs);
            MOCK_DB.customers = MOCK_DB.customers.filter(c => !ids.has(c.CustomerID));
            return { success: true };
        }

        case 'createReminder': {
            const newRem = {
                ReminderID: `REM-${Date.now()}`,
                Type: payload.Type || 'FollowUp',
                LeadID: payload.LeadID || '',
                CustomerID: payload.CustomerID || '',
                AssignedUserID: payload.AssignedUserID || '',
                ReminderDate: payload.ReminderDate || new Date().toISOString(),
                ReminderMessage: payload.ReminderMessage || '',
                'Status (Pending/Dismissed/Completed)': 'Pending',
                Status: 'Pending'
            };
            MOCK_DB.reminders.push(newRem);
            return { success: true, ReminderID: newRem.ReminderID };
        }

        case 'changePassword': {
            const u = MOCK_DB.users.find(u => u.UserID === payload.userID);
            if (!u) return { success: false, message: 'User not found' };
            if (MOCK_PASSWORDS[u.Email] !== payload.oldPassword) return { success: false, message: 'Incorrect current password' };
            MOCK_PASSWORDS[u.Email] = payload.newPassword;
            return { success: true };
        }

        case 'createLead': {
            let mockCustID = payload.CustomerID;
            if (!mockCustID && payload.CustomerData) {
                mockCustID = `CUS-${Date.now()}`;
                MOCK_DB.customers.unshift({ CustomerID: mockCustID, ...payload.CustomerData });
            }
            const leadStatus = payload.ImportedStatus || 'New';
            const newLead = {
                LeadID: `L-${Date.now()}`,
                CustomerID: mockCustID,
                CreatedAt: payload.ImportedDate || new Date().toISOString(),
                "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": leadStatus,
                "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": payload.ProductRequired || '',
                "LeadSource (Phone/Instagram/Facebook/Walk-in)": payload.LeadSource || '',
                AssignedUserID: payload.AssignedUserID || '',
                ContactPerson: payload.ContactPerson || '',
                Region: payload.Region || '',
                Remark1: payload.Remark1 || '',
                Remark2: payload.Remark2 || '',
                OrderFlag: payload.OrderFlag || 'N',
                OrderValue: payload.OrderValue || '',
                PaymentStatus: payload.PaymentStatus || '',
                AdName: payload.AdName || '',
                CampaignName: payload.CampaignName || '',
                QuantityRequired: payload.QuantityRequired || '',
                RequirementTimeline: payload.RequirementTimeline || ''
            };
            MOCK_DB.leads.unshift(newLead);
            return { success: true, LeadID: newLead.LeadID, CustomerID: mockCustID };
        }

        case 'createCustomer': {
            const newCust = { CustomerID: `CUS-${Date.now()}`, ...payload };
            MOCK_DB.customers.unshift(newCust);
            return { success: true };
        }

        case 'updateCustomer': {
            const custIdx = MOCK_DB.customers.findIndex(c => c.CustomerID === payload.CustomerID);
            if (custIdx > -1) Object.assign(MOCK_DB.customers[custIdx], payload.updates);
            return { success: true };
        }

        case 'deleteLeads': {
            if (!payload.LeadIDs || payload.LeadIDs.length === 0) {
                return { success: false, message: 'LeadIDs array is required' };
            }
            const idSet = new Set(payload.LeadIDs);
            const before = MOCK_DB.leads.length;
            MOCK_DB.leads = MOCK_DB.leads.filter(l => !idSet.has(l.LeadID));
            MOCK_DB.interactions = MOCK_DB.interactions.filter(i => !idSet.has(i.LeadID));
            const count = before - MOCK_DB.leads.length;
            return { success: true, message: `${count} lead(s) deleted`, count };
        }

        case 'deleteAllLeads': {
            const count = MOCK_DB.leads.length;
            MOCK_DB.leads = [];
            MOCK_DB.interactions = [];
            return { success: true, message: `All ${count} lead(s) deleted`, count };
        }

        case 'createInteraction': {
            const newInt = {
                InteractionID: `INT-${Date.now()}`,
                LeadID: payload.LeadID,
                CustomerID: payload.CustomerID,
                InteractionDate: new Date().toISOString(),
                'Type (Call/Email/Visit/WhatsApp)': payload.Type || 'Call',
                'Feedback (Call not received/Spoke with customer/Details shared/Waiting for approval/Other)': payload.Feedback || '',
                Remark1: payload.Remark1 || '',
                Remark2: payload.Remark2 || '',
                NextFollowUpDate: payload.NextFollowUpDate || '',
                CreatedByUserID: payload.CreatedByUserID || ''
            };
            MOCK_DB.interactions.push(newInt);
            return { success: true, InteractionID: newInt.InteractionID };
        }

        default:
            return { success: true };
    }
}
