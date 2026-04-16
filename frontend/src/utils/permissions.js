// Role-Based Access Control Permissions

export const PERMISSIONS = {
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  CHANGE_SETTINGS: 'change_settings',
  VIEW_ALL_LEADS: 'view_all_leads',
  EDIT_ANY_LEAD: 'edit_any_lead',
  DELETE_LEAD: 'delete_lead',
  VIEW_ALL_CUSTOMERS: 'view_all_customers',
  VIEW_ALL_PAYMENTS: 'view_all_payments',
  APPROVE_QUOTATION: 'approve_quotation',
  APPROVE_CREDIT: 'approve_credit',
  VIEW_REPORTS: 'view_reports',
  EXPORT_DATA: 'export_data',
  REASSIGN_LEADS: 'reassign_leads',

  // Staff permissions
  CREATE_LEAD: 'create_lead',
  EDIT_OWN_LEAD: 'edit_own_lead',
  CREATE_CUSTOMER: 'create_customer',
  EDIT_OWN_CUSTOMER: 'edit_own_customer',
  CREATE_QUOTATION: 'create_quotation',
  CREATE_INTERACTION: 'create_interaction',
  CREATE_REMINDER: 'create_reminder',
  VIEW_OWN_REMINDERS: 'view_own_reminders',
  CREATE_ORDER: 'create_order'
};

export const ROLE_PERMISSIONS = {
  Admin: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.CHANGE_SETTINGS,
    PERMISSIONS.VIEW_ALL_LEADS,
    PERMISSIONS.EDIT_ANY_LEAD,
    PERMISSIONS.DELETE_LEAD,
    PERMISSIONS.VIEW_ALL_CUSTOMERS,
    PERMISSIONS.VIEW_ALL_PAYMENTS,
    PERMISSIONS.APPROVE_QUOTATION,
    PERMISSIONS.APPROVE_CREDIT,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.REASSIGN_LEADS,
    PERMISSIONS.CREATE_LEAD,
    PERMISSIONS.EDIT_OWN_LEAD,
    PERMISSIONS.CREATE_CUSTOMER,
    PERMISSIONS.EDIT_OWN_CUSTOMER,
    PERMISSIONS.CREATE_QUOTATION,
    PERMISSIONS.CREATE_INTERACTION,
    PERMISSIONS.CREATE_REMINDER,
    PERMISSIONS.VIEW_OWN_REMINDERS,
    PERMISSIONS.CREATE_ORDER
  ],
  Manager: [
    PERMISSIONS.VIEW_ALL_LEADS,
    PERMISSIONS.EDIT_ANY_LEAD,
    PERMISSIONS.VIEW_ALL_CUSTOMERS,
    PERMISSIONS.EDIT_OWN_LEAD,
    PERMISSIONS.CREATE_LEAD,
    PERMISSIONS.CREATE_CUSTOMER,
    PERMISSIONS.EDIT_OWN_CUSTOMER,
    PERMISSIONS.CREATE_QUOTATION,
    PERMISSIONS.CREATE_INTERACTION,
    PERMISSIONS.CREATE_REMINDER,
    PERMISSIONS.VIEW_OWN_REMINDERS,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.VIEW_REPORTS
  ],
  Staff: [
    PERMISSIONS.CREATE_LEAD,
    PERMISSIONS.EDIT_OWN_LEAD,
    PERMISSIONS.CREATE_CUSTOMER,
    PERMISSIONS.EDIT_OWN_CUSTOMER,
    PERMISSIONS.CREATE_QUOTATION,
    PERMISSIONS.CREATE_INTERACTION,
    PERMISSIONS.CREATE_REMINDER,
    PERMISSIONS.VIEW_OWN_REMINDERS,
    PERMISSIONS.CREATE_ORDER
  ],
  User: []
};

export const hasPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

export const canAccessPage = (userRole, page) => {
  const pageAccess = {
    dashboard: ['Admin', 'Manager', 'Staff', 'User'],
    leads: ['Admin', 'Manager', 'Staff'],
    customers: ['Admin', 'Manager', 'Staff'],
    quotations: ['Admin', 'Manager', 'Staff'],
    orders: ['Admin', 'Manager', 'Staff'],
    payments: ['Admin'],
    reminders: ['Admin', 'Manager', 'Staff', 'User'],
    settings: ['Admin'],
    users: ['Admin']
  };
  return pageAccess[page]?.includes(userRole) || false;
};

export const getVisibleLeads = (leads, user) => {
  if (user.Role === 'Admin') return leads;
  if (user.Role === 'Manager') return leads;  // Managers see all leads
  if (user.Role === 'Staff') {
    return leads.filter(lead => lead.AssignedUserID === user.UserID);
  }
  return [];
};

export const getVisibleCustomers = (customers, user) => {
  if (user.Role === 'Admin') return customers;
  if (user.Role === 'Manager') return customers;  // Managers see all customers
  if (user.Role === 'Staff') {
    return customers.filter(cust => cust.AssignedUserID === user.UserID);
  }
  return [];
};

export const getVisiblePayments = (payments, user) => {
  if (user.Role === 'Admin') return payments;
  return [];
};
