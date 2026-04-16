/* Code.gs for CitadelCRM_DB */

function getDb() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  return handleRequest(e, 'GET');
}

function doPost(e) {
  return handleRequest(e, 'POST');
}

function handleRequest(e, method) {
  try {
    let params = {};
    if (method === 'POST') {
      if (e.postData && e.postData.contents) {
        params = JSON.parse(e.postData.contents);
      }
    } else {
      params = e.parameter;
    }

    let action = params.action;
    let result = { success: false, message: 'Unknown action' };
    
    switch (action) {
        case 'deleteCustomers': result = handleDeleteCustomers(params); break;
      case 'login': result = handleLogin(params); break;
      case 'changePassword': result = handleChangePassword(params); break;

      case 'getUsers': result = handleGetUsers(params); break;
      case 'createUser': result = handleCreateUser(params); break;
      case 'updateUser': result = handleUpdateUser(params); break;
      case 'deactivateUser': result = handleDeactivateUser(params); break;
      case 'resetPassword': result = handleResetPassword(params); break;
      case 'setupAccount': result = handleSetupAccount(params); break;

      case 'getCustomers': result = handleGetCustomers(params); break;
      case 'getCustomerById': result = handleGetCustomerById(params); break;
      case 'createCustomer': result = handleCreateCustomer(params); break;
      case 'updateCustomer': result = handleUpdateCustomer(params); break;

      case 'getLeads': result = handleGetLeads(params); break;
      case 'getLeadById': result = handleGetLeadById(params); break;
      case 'createLead': result = handleCreateLead(params); break;
      case 'updateLead': result = handleUpdateLead(params); break;
      case 'deleteLeads': result = handleDeleteLeads(params); break;
      case 'deleteAllLeads': result = handleDeleteAllLeads(params); break;

      case 'getInteractions': result = handleGetInteractions(params); break;
      case 'createInteraction': result = handleCreateInteraction(params); break;

      case 'getQuotations': result = handleGetQuotations(params); break;
      case 'createQuotation': result = handleCreateQuotation(params); break;
      case 'updateQuotation': result = handleUpdateQuotation(params); break;
      case 'approveQuotation': result = handleApproveQuotation(params); break;

      case 'getOrders': result = handleGetOrders(params); break;
      case 'createOrder': result = handleCreateOrder(params); break;
      case 'updateOrderStatus': result = handleUpdateOrderStatus(params); break;

      case 'getPayments': result = handleGetPayments(params); break;
      case 'createPayment': result = handleCreatePayment(params); break;
      case 'updatePayment': result = handleUpdatePayment(params); break;
      case 'approveCredit': result = handleApproveCredit(params); break;

      case 'getReminders': result = handleGetReminders(params); break;
      case 'updateReminderStatus': result = handleUpdateReminderStatus(params); break;
      case 'createReminder': result = handleCreateReminderAction(params); break;

      case 'getSettings': result = handleGetSettings(params); break;
      case 'updateSetting': result = handleUpdateSetting(params); break;

      case 'getDashboardStats': result = handleGetDashboardStats(params); break;

      case 'setupSheet': result = handleSetupSheet(params); break;

      default:
        result = { success: false, message: 'Invalid or missing action' };
    }
    return setCORSHeaders(ContentService.createTextOutput(JSON.stringify(result)));
  } catch (err) {
    return setCORSHeaders(ContentService.createTextOutput(JSON.stringify({ success: false, message: err.message, stack: err.stack })));
  }
}

function setCORSHeaders(output) {
  return output
    .setMimeType(ContentService.MimeType.JSON);
}

// ======================= HELPER FUNCTIONS =======================
function getSheetData(sheetName) {
  const sheet = getDb().getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function appendRow(sheetName, rowObject) {
  const sheet = getDb().getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  const headers = sheet.getDataRange().getValues()[0];
  const rowArray = headers.map(h => rowObject[h] !== undefined ? rowObject[h] : "");
  sheet.appendRow(rowArray);
}

function updateRow(sheetName, idColumn, idValue, updateObject) {
  const sheet = getDb().getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf(idColumn);
  if (idIndex === -1) throw new Error("ID Column not found");
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] == idValue) {
      for (const key in updateObject) {
        let colIndex = headers.indexOf(key);
        if (colIndex !== -1) {
          sheet.getRange(i + 1, colIndex + 1).setValue(updateObject[key]);
        }
      }
      return true;
    }
  }
  return false;
}

function deleteRows(sheetName, idColumn, idValues) {
  const sheet = getDb().getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf(idColumn);
  if (idIndex === -1) throw new Error("ID Column not found: " + idColumn);
  const idSet = new Set(idValues.map(String));
  // Collect row numbers to delete (bottom-up to avoid index shift)
  var rowsToDelete = [];
  for (var i = 1; i < data.length; i++) {
    if (idSet.has(String(data[i][idIndex]))) {
      rowsToDelete.push(i + 1); // sheet rows are 1-indexed
    }
  }
  // Delete from bottom to top
  for (var j = rowsToDelete.length - 1; j >= 0; j--) {
    sheet.deleteRow(rowsToDelete[j]);
  }
  return rowsToDelete.length;
}

function clearSheetData(sheetName) {
  const sheet = getDb().getSheetByName(sheetName);
  if (!sheet) throw new Error("Sheet not found: " + sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  return lastRow - 1;
}

function generateID(prefix) {
  return prefix + "_" + new Date().toISOString().replace(/[-:T.Z]/g, "") + "_" + Math.floor(Math.random() * 1000);
}

function hashPassword(plain) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, plain, Utilities.Charset.UTF_8);
  return rawHash.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
}

function sendEmail(to, subject, htmlBody) {
  MailApp.sendEmail({ to: to, subject: subject, htmlBody: htmlBody });
}

// sendThankYouEmail and sendThankYouPaymentEmail are defined in CrossSell.gs
// (richer HTML templates). Do NOT duplicate them here — GAS shares a single global namespace.

function logActivity(userID, action, entityType, entityID, details) {
  appendRow('ACTIVITY_LOGS', {
    LogID: generateID("LOG"),
    UserID: userID,
    Action: action,
    EntityType: entityType,
    EntityID: entityID,
    Details: details,
    Timestamp: new Date().toISOString()
  });
}

function getSettingsMap() {
  const data = getSheetData('SETTINGS');
  const map = {};
  data.forEach(d => map[d.SettingKey] = d.SettingValue);
  return map;
}

// ======================= ACTION HANDLERS =======================

// --- AUTH ---
function handleLogin(p) {
  const users = getSheetData('USERS');
  const hash = hashPassword(p.password);
  const user = users.find(u => u.Email === p.email && u.PasswordHash === hash);
  if (user) {
    if (user.IsActive !== true && user.IsActive !== 'true' && user.IsActive !== 'TRUE' && user.IsActive !== 1) {
      if(user.IsActive !== 'TRUE' && user.IsActive !== true) {
         // handle string or boolean differences from sheet
         if(String(user.IsActive).toLowerCase() !== 'true') return { success: false, message: "User is deactivated" };
      }
    }
    updateRow('USERS', 'UserID', user.UserID, { LastLogin: new Date().toISOString() });
    return { success: true, token: "token-" + user.UserID, user: { UserID: user.UserID, FullName: user.FullName, Role: user['Role'] } };
  }
  return { success: false, message: "Invalid credentials" };
}

function handleChangePassword(p) {
  const users = getSheetData('USERS');
  const user = users.find(u => u.UserID === p.userID);
  if (!user || user.PasswordHash !== hashPassword(p.oldPassword)) return { success: false, message: 'Invalid old password' };
  updateRow('USERS', 'UserID', p.userID, { PasswordHash: hashPassword(p.newPassword) });
  return { success: true, message: 'Password updated' };
}

// --- USERS ---
function handleGetUsers(p) {
  return { success: true, data: getSheetData('USERS') };
}

function handleCreateUser(p) {
  const u = {
    UserID: generateID("USR"),
    FullName: p.FullName,
    Email: p.Email,
    Phone: p.Phone,
    "Role": p.Role || 'Staff',
    PasswordHash: hashPassword(p.PasswordHash),
    IsActive: true,
    CreatedAt: new Date().toISOString(),
    LastLogin: ""
  };
  appendRow('USERS', u);
  return { success: true, data: u };
}

function handleUpdateUser(p) {
  updateRow('USERS', 'UserID', p.UserID, p.updates);
  return { success: true, message: 'User updated' };
}

function handleDeactivateUser(p) {
  updateRow('USERS', 'UserID', p.UserID, { IsActive: false });
  return { success: true, message: 'User deactivated' };
}

function handleResetPassword(p) {
  if (!p.UserID || !p.NewPassword) return { success: false, message: 'UserID and NewPassword are required' };
  if (p.NewPassword.length < 8) return { success: false, message: 'Password must be at least 8 characters' };
  updateRow('USERS', 'UserID', p.UserID, { PasswordHash: hashPassword(p.NewPassword) });
  return { success: true, message: 'Password reset successfully' };
}

// One-time account setup: allows changing email (only if current email is demo@user.com)
function handleSetupAccount(p) {
  if (!p.UserID || !p.NewEmail || !p.NewPassword) {
    return { success: false, message: 'UserID, NewEmail, and NewPassword are required' };
  }
  const users = getSheetData('USERS');
  const user = users.find(u => u.UserID === p.UserID);
  if (!user) return { success: false, message: 'User not found' };
  if (user.Email !== 'demo@user.com') {
    return { success: false, message: 'Account already set up. Email can no longer be changed.' };
  }
  if (p.NewPassword.length < 8) return { success: false, message: 'Password must be at least 8 characters' };
  // Check if new email is already taken
  const emailTaken = users.find(u => u.Email.toLowerCase() === p.NewEmail.toLowerCase() && u.UserID !== p.UserID);
  if (emailTaken) return { success: false, message: 'This email is already in use' };
  updateRow('USERS', 'UserID', p.UserID, {
    Email: p.NewEmail,
    FullName: p.FullName || user.FullName,
    Phone: p.Phone || user.Phone,
    PasswordHash: hashPassword(p.NewPassword)
  });
  return { success: true, message: 'Account setup complete. Use your new credentials to login.' };
}

// --- CUSTOMERS ---
function handleGetCustomers(p) {
  let custs = getSheetData('CUSTOMERS');
  if (p.staffID) custs = custs.filter(c => c.AssignedUserID === p.staffID);
  return { success: true, data: custs };
}

function handleGetCustomerById(p) {
  const c = getSheetData('CUSTOMERS').find(c => c.CustomerID == p.customerID);
  return { success: !!c, data: c };
}

function handleCreateCustomer(p) {
  const c = {
    CustomerID: generateID("CUS"),
    CustomerName: p.CustomerName,
    Phone: p.Phone,
    Email: p.Email,
    CompanyName: p.CompanyName,
    City: p.City,
    GSTNumber: p.GSTNumber,
    AssignedUserID: p.AssignedUserID,
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString()
  };
  appendRow('CUSTOMERS', c);
  return { success: true, data: c };
}

// --- DELETE CUSTOMER(S) ---
function handleDeleteCustomers(p) {
  if (!p.CustomerIDs || !Array.isArray(p.CustomerIDs) || p.CustomerIDs.length === 0) {
    return { success: false, message: 'CustomerIDs array is required' };
  }
  // Cascade delete: leads, quotations, orders, payments for these customers
  var leadIDs = getSheetData('LEADS').filter(l => p.CustomerIDs.includes(l.CustomerID)).map(l => l.LeadID);
  var quotationIDs = getSheetData('QUOTATIONS').filter(q => p.CustomerIDs.includes(q.CustomerID)).map(q => q.QuotationID);
  var orderIDs = getSheetData('ORDERS').filter(o => p.CustomerIDs.includes(o.CustomerID)).map(o => o.OrderID);
  var paymentIDs = getSheetData('PAYMENTS').filter(pay => p.CustomerIDs.includes(pay.CustomerID)).map(pay => pay.PaymentID);

  deleteRows('LEADS', 'LeadID', leadIDs);
  deleteRows('QUOTATIONS', 'QuotationID', quotationIDs);
  deleteRows('ORDERS', 'OrderID', orderIDs);
  deleteRows('PAYMENTS', 'PaymentID', paymentIDs);

  var count = deleteRows('CUSTOMERS', 'CustomerID', p.CustomerIDs);
  if (p.logUserID) logActivity(p.logUserID, "DELETE", "CUSTOMERS", p.CustomerIDs.join(','), count + ' customers deleted (cascade)');
  return { success: true, message: count + ' customer(s) deleted', count: count };
}

function handleUpdateCustomer(p) {
  p.updates.UpdatedAt = new Date().toISOString();
  updateRow('CUSTOMERS', 'CustomerID', p.CustomerID, p.updates);
  return { success: true, message: 'Customer updated' };
}

// --- LEADS ---
function handleGetLeads(p) {
  let leads = getSheetData('LEADS');
  if (p.status) leads = leads.filter(l => l['LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)'] === p.status);
  if (p.assignedUser) leads = leads.filter(l => l.AssignedUserID === p.assignedUser);
  return { success: true, data: leads };
}

function handleGetLeadById(p) {
  const l = getSheetData('LEADS').find(x => x.LeadID === p.leadID);
  if (!l) return { success: false, message: 'Not found' };
  const c = getSheetData('CUSTOMERS').find(x => x.CustomerID === l.CustomerID);
  return { success: true, data: { lead: l, customer: c } };
}

function handleCreateLead(p) {
  let customerID = p.CustomerID;
  if (!customerID && p.CustomerData) {
     let cRes = handleCreateCustomer({ ...p.CustomerData, AssignedUserID: p.AssignedUserID });
     customerID = cRes.data.CustomerID;
  }
  const importedStatus = p.ImportedStatus || "New";
  const l = {
    LeadID: generateID("LD"),
    CustomerID: customerID,
    "LeadSource (Phone/Instagram/Facebook/Walk-in)": p.LeadSource,
    AdName: p.AdName || '',
    CampaignName: p.CampaignName || '',
    "ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)": p.ProductRequired,
    QuantityRequired: p.QuantityRequired,
    RequirementTimeline: p.RequirementTimeline,
    "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": importedStatus,
    AssignedUserID: p.AssignedUserID,
    ContactPerson: p.ContactPerson || '',
    Region: p.Region || '',
    Remark1: p.Remark1 || '',
    Remark2: p.Remark2 || '',
    OrderFlag: p.OrderFlag || 'N',
    OrderValue: p.OrderValue || '',
    PaymentStatus: p.PaymentStatus || '',
    CreatedAt: p.ImportedDate || new Date().toISOString(),
    UpdatedAt: new Date().toISOString()
  };
  appendRow('LEADS', l);
  
  // Create follow-up reminder based on configurable days
  const followUpDays = parseInt(getSettingsMap().FollowUpDays) || 3;
  let t = new Date(); t.setDate(t.getDate() + followUpDays);
  appendRow('REMINDERS', {
    ReminderID: generateID("REM"),
    "Type (FollowUp/Payment/Dispatch/CrossSell/GoogleReview/Reference/Quotation)": "FollowUp",
    LeadID: l.LeadID, OrderID: "", PaymentID: "", CustomerID: customerID,
    AssignedUserID: p.AssignedUserID,
    ReminderDate: t.toISOString(),
    ReminderMessage: "Initial " + followUpDays + "-day follow up for lead",
    "Status (Pending/Dismissed/Completed)": "Pending",
    CreatedAt: new Date().toISOString()
  });

  return { success: true, data: l };
}

function handleUpdateLead(p) {
  p.updates.UpdatedAt = new Date().toISOString();
  updateRow('LEADS', 'LeadID', p.LeadID, p.updates);
  if (p.logUserID) logActivity(p.logUserID, "UPDATE", "LEAD", p.LeadID, JSON.stringify(p.updates));
  return { success: true, message: 'Lead updated' };
}

function handleDeleteLeads(p) {
  if (!p.LeadIDs || !Array.isArray(p.LeadIDs) || p.LeadIDs.length === 0) {
    return { success: false, message: 'LeadIDs array is required' };
  }
  // Cascade delete: quotations, orders, payments, interactions for these leads
  var quotationIDs = getSheetData('QUOTATIONS').filter(q => p.LeadIDs.includes(q.LeadID)).map(q => q.QuotationID);
  var orderIDs = getSheetData('ORDERS').filter(o => p.LeadIDs.includes(o.LeadID)).map(o => o.OrderID);
  var paymentIDs = getSheetData('PAYMENTS').filter(pay => orderIDs.includes(pay.OrderID)).map(pay => pay.PaymentID);
  var interactionIDs = getSheetData('INTERACTIONS').filter(i => p.LeadIDs.includes(i.LeadID)).map(i => i.InteractionID);

  deleteRows('QUOTATIONS', 'QuotationID', quotationIDs);
  deleteRows('ORDERS', 'OrderID', orderIDs);
  deleteRows('PAYMENTS', 'PaymentID', paymentIDs);
  deleteRows('INTERACTIONS', 'InteractionID', interactionIDs);

  var count = deleteRows('LEADS', 'LeadID', p.LeadIDs);
  if (p.logUserID) logActivity(p.logUserID, "DELETE", "LEADS", p.LeadIDs.join(','), count + ' leads deleted (cascade)');
  return { success: true, message: count + ' lead(s) deleted (cascade)', count: count };
}

function handleDeleteAllLeads(p) {
  var count = clearSheetData('LEADS');
  if (p.logUserID) logActivity(p.logUserID, "DELETE_ALL", "LEADS", "", count + ' leads deleted');
  return { success: true, message: 'All ' + count + ' lead(s) deleted', count: count };
}

// --- INTERACTIONS ---
function handleGetInteractions(p) {
  let res = getSheetData('INTERACTIONS').filter(i => i.LeadID === p.LeadID);
  return { success: true, data: res };
}

function handleCreateInteraction(p) {
  const i = {
    InteractionID: generateID("INT"),
    LeadID: p.LeadID,
    CustomerID: p.CustomerID,
    InteractionDate: new Date().toISOString(),
    "Type (Call/Email/Visit/WhatsApp)": p.Type,
    "Feedback (Call not received/Spoke with customer/Details shared/Waiting for approval/Other)": p.Feedback,
    Remark1: p.Remark1 || '',
    Remark2: p.Remark2 || '',
    NextFollowUpDate: p.NextFollowUpDate || '',
    "FollowUpStatus (Pending/Completed)": p.NextFollowUpDate ? "Pending" : "Completed",
    CreatedByUserID: p.CreatedByUserID,
    CreatedAt: new Date().toISOString()
  };
  appendRow('INTERACTIONS', i);

  if (p.NextFollowUpDate) {
    appendRow('REMINDERS', {
      ReminderID: generateID("REM"),
      "Type (FollowUp/Payment/Dispatch/CrossSell/GoogleReview/Reference/Quotation)": "FollowUp",
      LeadID: p.LeadID, OrderID: "", PaymentID: "", CustomerID: p.CustomerID,
      AssignedUserID: p.CreatedByUserID,
      ReminderDate: p.NextFollowUpDate,
      ReminderMessage: "Scheduled follow-up from interaction",
      "Status (Pending/Dismissed/Completed)": "Pending",
      CreatedAt: new Date().toISOString()
    });
  }
  return { success: true, data: i };
}

// --- QUOTATIONS ---
function handleGetQuotations(p) {
  let res = getSheetData('QUOTATIONS');
  if (p.LeadID) res = res.filter(x => x.LeadID === p.LeadID);
  if (p.CustomerID) res = res.filter(x => x.CustomerID === p.CustomerID);
  return { success: true, data: res };
}

function handleCreateQuotation(p) {
  const settings = getSettingsMap();
  const threshold = parseFloat(settings.PriceApprovalThreshold) || 3650;
  const ppu = parseFloat(p.QuotedPricePerUnit);
  let approval = "NotRequired";
  if (ppu < threshold) approval = "PendingApproval"; // Typically, if price is lower than threshold, needs approval

  const q = {
    QuotationID: generateID("QUO"),
    LeadID: p.LeadID, CustomerID: p.CustomerID,
    "QuotationAsked (Yes/No)": p.QuotationAsked || "Yes",
    "QuotationSent (Yes/No)": p.QuotationSent || "Yes",
    QuotationDate: new Date().toISOString(),
    QuotedPrice: p.QuotedPrice,
    QuotedPricePerUnit: p.QuotedPricePerUnit,
    Unit: p.Unit,
    DriveFileURL: p.DriveFileURL || '',
    Notes: p.Notes || '',
    "ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)": approval,
    ApprovedByUserID: "",
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString()
  };
  appendRow('QUOTATIONS', q);
  
  if (approval === "PendingApproval" && settings.AdminEmail && String(settings.AutoFollowUpEmailEnabled).toLowerCase() === 'true') {
     sendEmail(settings.AdminEmail, "Quotation Approval Required", `Quotation ${q.QuotationID} needs approval.`);
  }
  return { success: true, data: q };
}

function handleUpdateQuotation(p) {
  p.updates.UpdatedAt = new Date().toISOString();
  updateRow('QUOTATIONS', 'QuotationID', p.QuotationID, p.updates);
  return { success: true };
}

// --- DELETE QUOTATION(S) ---
function handleDeleteQuotations(p) {
  if (!p.QuotationIDs || !Array.isArray(p.QuotationIDs) || p.QuotationIDs.length === 0) {
    return { success: false, message: 'QuotationIDs array is required' };
  }
  // Cascade delete: orders, payments for these quotations
  var orderIDs = getSheetData('ORDERS').filter(o => p.QuotationIDs.includes(o.QuotationID)).map(o => o.OrderID);
  var paymentIDs = getSheetData('PAYMENTS').filter(pay => orderIDs.includes(pay.OrderID)).map(pay => pay.PaymentID);

  deleteRows('ORDERS', 'OrderID', orderIDs);
  deleteRows('PAYMENTS', 'PaymentID', paymentIDs);

  var count = deleteRows('QUOTATIONS', 'QuotationID', p.QuotationIDs);
  if (p.logUserID) logActivity(p.logUserID, "DELETE", "QUOTATIONS", p.QuotationIDs.join(','), count + ' quotations deleted (cascade)');
  return { success: true, message: count + ' quotation(s) deleted', count: count };
}

function handleApproveQuotation(p) {
  updateRow('QUOTATIONS', 'QuotationID', p.QuotationID, {
    "ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)": "Approved",
    ApprovedByUserID: p.AdminID,
    UpdatedAt: new Date().toISOString()
  });
  return { success: true };
}

// --- ORDERS ---
function handleGetOrders(p) {
  let res = getSheetData('ORDERS');
  return { success: true, data: res };
}

function handleCreateOrder(p) {
  const o = {
    OrderID: generateID("ORD"),
    LeadID: p.LeadID, CustomerID: p.CustomerID, QuotationID: p.QuotationID || '',
    ProductOrdered: p.ProductOrdered,
    OrderQuantity: p.OrderQuantity,
    OrderDate: new Date().toISOString(),
    "OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)": "Confirmed",
    DispatchDate: p.DispatchDate || '',
    DispatchSchedule: p.DispatchSchedule || '',
    "ThankyouEmailSent (Yes/No)": "No",
    AssignedUserID: p.AssignedUserID,
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString()
  };
  appendRow('ORDERS', o);
  updateRow('LEADS', 'LeadID', p.LeadID, { "LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)": "Won", UpdatedAt: new Date().toISOString() });
  
  const c = getSheetData('CUSTOMERS').find(x => x.CustomerID === p.CustomerID);
  const rmUser = getSheetData('USERS').find(x => x.UserID === p.AssignedUserID);
  if (c && c.Email && String(getSettingsMap().AutoFollowUpEmailEnabled).toLowerCase() === 'true') {
    sendThankYouEmail(o, c, rmUser);
    updateRow('ORDERS', 'OrderID', o.OrderID, { "ThankyouEmailSent (Yes/No)": "Yes" });
  }

  // Generate cross-sell reminders for products the customer didn't order
  if (c) generateCrossSellReminders(o, c, p.AssignedUserID);

  if (p.DispatchDate) {
    appendRow('REMINDERS', {
      ReminderID: generateID("REM"),
      "Type (FollowUp/Payment/Dispatch/CrossSell/GoogleReview/Reference/Quotation)": "Dispatch",
      LeadID: p.LeadID, OrderID: o.OrderID, PaymentID: "", CustomerID: p.CustomerID,
      AssignedUserID: p.AssignedUserID,
      ReminderDate: p.DispatchDate,
      ReminderMessage: "Scheduled dispatch for order",
      "Status (Pending/Dismissed/Completed)": "Pending",
      CreatedAt: new Date().toISOString()
    });
  }
  return { success: true, data: o };
}

function handleUpdateOrderStatus(p) {
  updateRow('ORDERS', 'OrderID', p.OrderID, {
    "OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)": p.Status,
    UpdatedAt: new Date().toISOString()
  });
  if (p.logUserID) logActivity(p.logUserID, "UPDATE", "ORDER", p.OrderID, "Status changed to " + p.Status);
  return { success: true };
}

// --- DELETE ORDER(S) ---
function handleDeleteOrders(p) {
  if (!p.OrderIDs || !Array.isArray(p.OrderIDs) || p.OrderIDs.length === 0) {
    return { success: false, message: 'OrderIDs array is required' };
  }
  // Cascade delete: payments for these orders
  var paymentIDs = getSheetData('PAYMENTS').filter(pay => p.OrderIDs.includes(pay.OrderID)).map(pay => pay.PaymentID);
  deleteRows('PAYMENTS', 'PaymentID', paymentIDs);

  var count = deleteRows('ORDERS', 'OrderID', p.OrderIDs);
  if (p.logUserID) logActivity(p.logUserID, "DELETE", "ORDERS", p.OrderIDs.join(','), count + ' orders deleted (cascade)');
  return { success: true, message: count + ' order(s) deleted', count: count };
}

// --- PAYMENTS ---
function handleGetPayments(p) {
  return { success: true, data: getSheetData('PAYMENTS') };
}

function handleCreatePayment(p) {
  const settings = getSettingsMap();
  const cThresh = parseInt(settings.CreditApprovalThresholdDays) || 45;
  let approval = "NotRequired";
  if (p.CreditPeriodDays && parseInt(p.CreditPeriodDays) > cThresh) {
    approval = "PendingApproval";
  }

  const pay = {
    PaymentID: generateID("PAY"),
    OrderID: p.OrderID, CustomerID: p.CustomerID, InvoiceNumber: p.InvoiceNumber || '',
    TotalAmount: p.TotalAmount, PaidAmount: p.PaidAmount,
    OutstandingAmount: p.TotalAmount - p.PaidAmount,
    "PaymentStatus (Pending/Partial/Paid)": p.PaidAmount >= p.TotalAmount ? "Paid" : (p.PaidAmount > 0 ? "Partial" : "Pending"),
    CreditPeriodDays: p.CreditPeriodDays || 0,
    DueDate: p.DueDate || '',
    PaymentReceivedDate: p.PaidAmount > 0 ? new Date().toISOString() : '',
    "CreditApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)": approval,
    ApprovedByUserID: "",
    "ThankyouSent (Yes/No)": "No",
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString()
  };
  appendRow('PAYMENTS', pay);
  return { success: true, data: pay };
}

function handleUpdatePayment(p) {
  p.updates.UpdatedAt = new Date().toISOString();
  if (p.updates.PaidAmount !== undefined && p.updates.TotalAmount !== undefined) {
      p.updates.OutstandingAmount = p.updates.TotalAmount - p.updates.PaidAmount;
      p.updates["PaymentStatus (Pending/Partial/Paid)"] = p.updates.OutstandingAmount <= 0 ? "Paid" : (p.updates.PaidAmount > 0 ? "Partial" : "Pending");
  }

  updateRow('PAYMENTS', 'PaymentID', p.PaymentID, p.updates);

  if (p.updates["PaymentStatus (Pending/Partial/Paid)"] === "Paid") {
     const pay = getSheetData('PAYMENTS').find(x => x.PaymentID === p.PaymentID);
     const cust = getSheetData('CUSTOMERS').find(x => x.CustomerID === pay.CustomerID);
     if (cust && cust.Email && String(getSettingsMap().AutoFollowUpEmailEnabled).toLowerCase() === 'true' && pay["ThankyouSent (Yes/No)"] !== "Yes") {
       sendThankYouPaymentEmail(pay, cust);
       updateRow('PAYMENTS', 'PaymentID', p.PaymentID, { "ThankyouSent (Yes/No)": "Yes" });
     }
     // Generate post-sale reminders (reference request + Google review)
     if (cust) {
       const order = getSheetData('ORDERS').find(x => x.OrderID === pay.OrderID);
       generatePostSaleReminders(pay, cust, order ? order.AssignedUserID : '');
     }
  }
  return { success: true };
}

function handleApproveCredit(p) {
  updateRow('PAYMENTS', 'PaymentID', p.PaymentID, {
    "CreditApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)": "Approved",
    ApprovedByUserID: p.AdminID,
    UpdatedAt: new Date().toISOString()
  });
  return { success: true };
}

// --- REMINDERS ---
function handleGetReminders(p) {
  let rems = getSheetData('REMINDERS');
  if (p.AssignedUserID) rems = rems.filter(r => r.AssignedUserID === p.AssignedUserID);
  if (p.onlyPending === true) rems = rems.filter(r => r["Status (Pending/Dismissed/Completed)"] === "Pending");
  return { success: true, data: rems };
}

function handleUpdateReminderStatus(p) {
  updateRow('REMINDERS', 'ReminderID', p.ReminderID, { "Status (Pending/Dismissed/Completed)": p.Status });
  return { success: true };
}

function handleCreateReminderAction(p) {
  const r = {
    ReminderID: generateID("REM"),
    "Type (FollowUp/Payment/Dispatch/CrossSell/GoogleReview/Reference/Quotation)": p.Type,
    LeadID: p.LeadID || '', OrderID: p.OrderID || '', PaymentID: p.PaymentID || '', CustomerID: p.CustomerID || '',
    AssignedUserID: p.AssignedUserID,
    ReminderDate: p.ReminderDate,
    ReminderMessage: p.ReminderMessage || '',
    "Status (Pending/Dismissed/Completed)": "Pending",
    CreatedAt: new Date().toISOString()
  };
  appendRow('REMINDERS', r);
  return { success: true, data: r };
}

// --- SETTINGS ---
function handleGetSettings(p) {
  return { success: true, data: getSettingsMap() };
}

function handleUpdateSetting(p) {
  updateRow('SETTINGS', 'SettingKey', p.SettingKey, { SettingValue: p.SettingValue, UpdatedByUserID: p.AdminID, UpdatedAt: new Date().toISOString() });
  return { success: true };
}

// --- DASHBOARD ---
function handleGetDashboardStats(p) {
  const leads = getSheetData('LEADS');
  const orders = getSheetData('ORDERS');
  const payments = getSheetData('PAYMENTS');
  const reminders = getSheetData('REMINDERS');
  const quotations = getSheetData('QUOTATIONS');

  const todayStr = new Date().toISOString().split('T')[0];

  const stat = {
    totalLeads: leads.length,
    newLeadsToday: leads.filter(l => l.CreatedAt && l.CreatedAt.startsWith(todayStr)).length,
    pendingFollowUps: reminders.filter(r => r["Status (Pending/Dismissed/Completed)"] === "Pending" && r["Type (FollowUp/Payment/Dispatch/CrossSell/GoogleReview/Reference/Quotation)"] === "FollowUp").length,
    quotationsSent: quotations.filter(q => q["QuotationSent (Yes/No)"] === "Yes").length,
    ordersConfirmed: orders.filter(o => o["OrderStatus (Pending/Confirmed/Dispatched/Delivered/Cancelled)"] === "Confirmed").length,
    pendingPayments: payments.filter(py => py["PaymentStatus (Pending/Partial/Paid)"] === "Pending").length,
    overduePayments: payments.filter(py => py["PaymentStatus (Pending/Partial/Paid)"] !== "Paid" && py.DueDate && py.DueDate < new Date().toISOString()).length,
  };

  const sources = {};
  leads.forEach(l => {
    let s = l["LeadSource (Phone/Instagram/Facebook/Walk-in)"];
    sources[s] = (sources[s] || 0) + 1;
  });
  stat.leadsBySource = Object.keys(sources).map(k => ({ source: k, count: sources[k] }));

  const statuses = {};
  leads.forEach(l => {
    let s = l["LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)"];
    statuses[s] = (statuses[s] || 0) + 1;
  });
  stat.leadsByStatus = Object.keys(statuses).map(k => ({ status: k, count: statuses[k] }));

  return { success: true, data: stat };
}

// --- SHEET SETUP ---
// Creates all required tabs, column headers (bold + bordered), and default settings.
// Renames the default Sheet1 to USERS, then creates remaining tabs.
// Safe to run multiple times — skips tabs and settings that already exist.
function handleSetupSheet(p) {
  try {
    setupSheetStructure();
    createDefaultAdmin();
    return { success: true, message: 'Google Sheet setup complete — all tabs, headers, and default settings created.' };
  } catch (err) {
    return { success: false, message: 'Setup failed: ' + err.message };
  }
}

function setupSheetStructure() {
  var ss = getDb();

  var schema = {
    'USERS': ['UserID', 'FullName', 'Email', 'Phone', 'Role', 'PasswordHash', 'IsActive', 'CreatedAt', 'LastLogin'],
    'CUSTOMERS': ['CustomerID', 'CustomerName', 'Phone', 'Email', 'CompanyName', 'City', 'GSTNumber', 'AssignedUserID', 'CreatedAt'],
    'LEADS': ['LeadID', 'CustomerID', 'LeadSource (Phone/Instagram/Facebook/Walk-in)', 'ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)', 'LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)', 'AssignedUserID', 'CreatedAt', 'UpdatedAt'],
    'INTERACTIONS': ['InteractionID', 'LeadID', 'CustomerID', 'InteractionDate', 'Feedback (Call not received/Spoke with customer/Details shared/Waiting for approval/Other)', 'Notes', 'NextFollowUpDate', 'FollowUpStatus (Pending/Completed)', 'CreatedByUserID', 'CreatedAt'],
    'QUOTATIONS': ['QuotationID', 'LeadID', 'CustomerID', 'QuotedPricePerUnit', 'Quantity', 'TotalValue', 'QuotationDate', 'ApprovalStatus (NotRequired/PendingApproval/Approved/Rejected)', 'ApprovedByUserID', 'CreatedAt'],
    'ORDERS': ['OrderID', 'LeadID', 'CustomerID', 'ProductOrdered', 'OrderQuantity', 'OrderDate', 'DispatchDate', 'Status', 'ThankyouEmailSent (Yes/No)', 'AssignedUserID', 'CreatedAt'],
    'PAYMENTS': ['PaymentID', 'OrderID', 'CustomerID', 'InvoiceNumber', 'TotalAmount', 'PaidAmount', 'OutstandingAmount', 'PaymentStatus (Pending/Partial/Paid)', 'CreditPeriodDays', 'CreditApproval (NotRequired/PendingApproval/Approved)', 'DueDate', 'ThankyouSent (Yes/No)', 'AssignedUserID', 'CreatedAt'],
    'REMINDERS': ['ReminderID', 'Type (FollowUp/Payment/Dispatch/CrossSell/GoogleReview/Reference/Quotation)', 'LeadID', 'OrderID', 'PaymentID', 'CustomerID', 'AssignedUserID', 'ReminderDate', 'ReminderMessage', 'Status (Pending/Dismissed/Completed)', 'CreatedAt'],
    'SETTINGS': ['SettingKey', 'SettingValue', 'UpdatedByUserID', 'UpdatedAt'],
    'ACTIVITY_LOGS': ['LogID', 'Action', 'UserID', 'Details', 'Timestamp']
  };

  var tabNames = Object.keys(schema);
  var isFirstTab = true;

  tabNames.forEach(function(tabName) {
    var sheet = ss.getSheetByName(tabName);

    if (!sheet) {
      if (isFirstTab) {
        // Rename the default "Sheet1" to the first tab instead of creating a new one
        var firstSheet = ss.getSheets()[0];
        if (firstSheet && tabNames.indexOf(firstSheet.getName()) === -1) {
          firstSheet.setName(tabName);
          sheet = firstSheet;
        } else {
          sheet = ss.insertSheet(tabName);
        }
        isFirstTab = false;
      } else {
        sheet = ss.insertSheet(tabName);
      }
    } else {
      isFirstTab = false;
    }

    var headers = schema[tabName];
    var existingData = sheet.getDataRange().getValues();

    // Only write headers if Row 1 is empty or doesn't match
    if (existingData.length === 0 || String(existingData[0][0]).trim() === '' || existingData[0][0] !== headers[0]) {
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);

      // Bold headers with gray background
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f3f4f6');
      headerRange.setFontSize(10);

      // Borders around each header cell
      headerRange.setBorder(true, true, true, true, true, true,
        '#d1d5db', SpreadsheetApp.BorderStyle.SOLID);

      // Freeze header row so it stays visible while scrolling
      sheet.setFrozenRows(1);

      // Auto-resize columns to fit header text
      for (var c = 1; c <= headers.length; c++) {
        sheet.autoResizeColumn(c);
      }
    }
  });

  // --- Seed default SETTINGS rows (skip any that already exist) ---
  var settingsSheet = ss.getSheetByName('SETTINGS');
  var settingsData = settingsSheet.getDataRange().getValues();
  var existingKeys = settingsData.slice(1).map(function(row) { return String(row[0]); });

  var defaults = [
    ['PriceApprovalThreshold', '3650'],
    ['CreditApprovalThresholdDays', '45'],
    ['AutoFollowUpEmailEnabled', 'true'],
    ['CompanyName', 'Citadel'],
    ['AdminEmail', 'admin@citadel.com'],
    ['CompanyPhone', '9657965747'],
    ['FollowUpDays', '3'],
    ['FollowUpEmailResendDays', '2'],
    ['PaymentDueLookaheadDays', '3'],
    ['CrossSellDelayDays', '7'],
    ['ReferenceRequestDelayDays', '2'],
    ['GoogleReviewDelayDays', '3']
  ];

  var now = new Date().toISOString();
  defaults.forEach(function(d) {
    if (existingKeys.indexOf(d[0]) === -1) {
      settingsSheet.appendRow([d[0], d[1], 'SYSTEM', now]);
    }
  });

  // Apply borders to all settings data rows
  var totalRows = settingsSheet.getLastRow();
  if (totalRows > 1) {
    var cols = settingsSheet.getDataRange().getValues()[0].length;
    var dataRange = settingsSheet.getRange(2, 1, totalRows - 1, cols);
    dataRange.setBorder(true, true, true, true, true, true,
      '#e5e7eb', SpreadsheetApp.BorderStyle.SOLID);
  }
}

// --- SEEDER ---
// Creates a demo admin account on first setup.
// Login with demo@user.com / demo — then change email & password in Users page (one-time setup).
function createDefaultAdmin() {
  const users = getSheetData('USERS');
  if (users.length > 0) {
    Logger.log("Users already exist — skipping demo account creation.");
    return;
  }
  appendRow('USERS', {
    UserID: generateID("USR"),
    FullName: "Demo Admin",
    Email: "demo@user.com",
    Phone: "0000000000",
    "Role": "Admin",
    PasswordHash: hashPassword("demo"),
    IsActive: true,
    CreatedAt: new Date().toISOString(),
    LastLogin: ""
  });
  Logger.log("Created demo admin: demo@user.com / demo");
}
