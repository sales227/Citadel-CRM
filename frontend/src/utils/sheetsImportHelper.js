/**
 * Multi-Sheet Lead Import Helper
 * Handles extraction of lead data from multiple sheets in a Google Sheets export
 * Supports monthly sheets (January, February, etc.) and other data formats
 */
import * as XLSX from 'xlsx';

// Common month names to detect monthly sheets
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

// Core columns used for lead sheet detection (need 3+ of these 7 to qualify)
const CORE_COLUMNS = new Set(['Customer', 'Phone', 'Product', 'Source', 'Status', 'Assigned', 'Created']);

// Column aliases — maps our internal field name to possible spreadsheet header names.
// List most-specific (multi-word) aliases FIRST; single-word aliases last as fallback.
const COLUMN_ALIASES = {
  // Core fields
  'Customer':       ['Customer/Lead Name', 'Customer Name', 'Lead Name', 'Client Name', 'Customer', 'Name'],
  'Phone':          ['Contact Details', 'Phone Number', 'Mobile Number', 'Mobile No', 'Phone No',
                     'Contact No', 'Contact Number', 'Phone', 'Mobile'],
  'Product':        ['Product Required', 'Product Name', 'Product Enquiry', 'Product', 'Item'],
  'Source':         ['Lead Source', 'Enquiry Source', 'Reference Source', 'Source', 'Origin'],
  'Status':         ['Lead Status', 'Enquiry Status', 'Current Status', 'Status', 'Stage'],
  'Assigned':       ['Lead given to', 'Assigned To', 'Assigned Staff', 'Sales Person',
                     'Relationship Manager', 'RM Name', 'Assigned', 'Staff', 'Owner', 'Manager', 'RM'],
  'Created':        ['Created/Ref', 'Enquiry Date', 'Entry Date', 'Created At', 'Date of Enquiry',
                     'Created', 'Date', 'Ref'],
  // Optional additional fields
  'ContactPerson':  ['Name of Contact Person', 'Contact Person Name', 'Contact Person', 'Person Name'],
  'Email':          ['Email Address', 'EMAIL ID', 'Email ID', 'Email ID / Address', 'Email', 'E-mail'],
  'City':           ['City / Location', 'Location', 'City', 'Area', 'Town'],
  'Region':         ['PMC/PCMC', 'Region', 'Zone', 'Territory'],
  'Remark1':        ['Remarks 1', 'Remarks1', 'Remark 1', 'Remark1', 'Remarks', 'Notes'],
  'Remark2':        ['Remarks 2', 'Remarks2', 'Remark 2', 'Remark2', 'Additional Notes'],
  'OrderFlag':      ['ORDER (Y/NO)', 'Order Placed', 'Order Flag', 'Order', 'Ordered'],
  'OrderValue':     ['ORDER VALUE', 'Order Amount', 'Order Value'],
  'PaymentStatus':  ['PAYMENT STATUS', 'Payment Status', 'Payment Stage']
};

/**
 * Check whether a spreadsheet header cell matches a given list of aliases.
 * Rules:
 *   - Single-word aliases: only EXACT match (prevents "Contact" from matching "Contact Details")
 *   - Multi-word aliases  : header must contain or equal the alias (flexible for variations)
 * @param {string} header   - Normalised (lowercase + trimmed) header value
 * @param {string[]} alternates
 * @returns {boolean}
 */
function matchesAlias(header, alternates) {
  for (const alt of alternates) {
    const a = alt.toLowerCase().trim();
    // Always accept an exact match
    if (a === header) return true;
    // For multi-word aliases only: accept if the header contains the alias phrase
    // (e.g. "contact details" contains "contact details" ✓;
    //  "payment status" does NOT contain "lead status" ✓)
    const isMultiWord = a.split(/\s+/).length >= 2;
    if (isMultiWord && header.includes(a)) return true;
  }
  return false;
}

/**
 * Check if a sheet name looks like a monthly sheet
 * @param {string} sheetName
 * @returns {boolean}
 */
export function isMonthlySheet(sheetName) {
  const lower = String(sheetName).toLowerCase().trim();
  return MONTH_NAMES.some(month => lower.includes(month));
}

/**
 * Find column indices that match known lead data fields.
 * Returns a colMap if at least 3 core columns are found, otherwise null.
 * @param {string[]} headerRow
 * @returns {Object|null}
 */
export function detectLeadColumns(headerRow) {
  if (!headerRow || !Array.isArray(headerRow)) return null;

  const colMap = {};
  let coreMatchCount = 0;

  for (const [fieldName, alternates] of Object.entries(COLUMN_ALIASES)) {
    for (let colIdx = 0; colIdx < headerRow.length; colIdx++) {
      const header = String(headerRow[colIdx]).toLowerCase().trim();
      if (matchesAlias(header, alternates)) {
        colMap[fieldName] = colIdx;
        if (CORE_COLUMNS.has(fieldName)) coreMatchCount++;
        break;
      }
    }
  }

  // Must have both Customer AND Phone, plus at least one other core column
  const hasMinFields = colMap.Customer !== undefined && colMap.Phone !== undefined;
  return (hasMinFields && coreMatchCount >= 3) ? colMap : null;
}

/**
 * Extract lead data from a single sheet using column map.
 * @param {Array<Array>} rows - Sheet rows from XLSX (2D array)
 * @param {Object} colMap - Column index mapping from detectLeadColumns
 * @param {string} sheetName
 * @param {Array} existingUsers - List of existing users for assignment matching
 * @returns {Array} Array of lead objects
 */
export function extractLeadsFromSheet(rows, colMap, sheetName, existingUsers = []) {
  const leads = [];
  const processedPhones = new Set();

  const dataRows = rows.slice(1); // Skip header row

  for (const row of dataRows) {
    try {
      if (!row || row.every(cell => String(cell).trim() === '')) continue;

      const getVal = (fieldName) => {
        const idx = colMap[fieldName];
        if (idx === undefined || idx >= row.length) return '';
        return String(row[idx] ?? '').trim();
      };

      const customerName  = getVal('Customer');
      const phone         = getVal('Phone');
      const product       = getVal('Product');
      const source        = getVal('Source');
      const status        = getVal('Status');
      const assignedTo    = getVal('Assigned');
      const createdDate   = getVal('Created');

      // Skip rows without customer name
      if (!customerName) continue;

      // Normalize phone: strip non-digits, then strip leading +91 country code
      let digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
        digitsOnly = digitsOnly.slice(2); // +91XXXXXXXXXX → XXXXXXXXXX
      } else if (digitsOnly.length === 13 && digitsOnly.startsWith('091')) {
        digitsOnly = digitsOnly.slice(3); // 091XXXXXXXXXX → XXXXXXXXXX
      }
      if (digitsOnly.length < 10) continue;

      // Skip duplicate phone numbers within this batch
      if (processedPhones.has(digitsOnly)) continue;
      processedPhones.add(digitsOnly);

      // Map status to CRM statuses
      const statusMap = {
        'new': 'New', 'contacted': 'Contacted', 'quoted': 'Quoted',
        'negotiating': 'Negotiating', 'won': 'Won', 'lost': 'Lost',
        'follow up': 'Contacted', 'followup': 'Contacted', 'follow-up': 'Contacted',
        'closed': 'Won', 'converted': 'Won', 'not interested': 'Lost',
        'pending': 'New', 'in progress': 'Negotiating', 'hot': 'Negotiating',
        'warm': 'Contacted', 'cold': 'New'
      };
      const mappedStatus = statusMap[status.toLowerCase()] || 'New';

      // Parse date — handles Excel serial numbers and date strings
      let parsedDate = '';
      if (createdDate) {
        const rawDate = row[colMap['Created']];
        if (typeof rawDate === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          parsedDate = new Date(excelEpoch.getTime() + rawDate * 86400000).toISOString();
        } else {
          const d = new Date(createdDate);
          parsedDate = isNaN(d.getTime()) ? '' : d.toISOString();
        }
      }

      // Match assigned user by name
      let assignedUserID = '';
      if (assignedTo) {
        const matchedUser = existingUsers.find(u =>
          u.FullName.toLowerCase().trim() === assignedTo.toLowerCase()
        );
        if (matchedUser) assignedUserID = matchedUser.UserID;
      }

      // Normalize lead source — exact key lookup, then partial fallback
      const sourceMap = {
        'phone': 'Phone', 'call': 'Phone', 'calling': 'Phone', 'tele': 'Phone',
        'instagram': 'Instagram', 'insta': 'Instagram', 'ig': 'Instagram',
        'facebook': 'Facebook', 'fb': 'Facebook', 'meta': 'Facebook',
        'walk-in': 'Walk-in', 'walkin': 'Walk-in', 'walk in': 'Walk-in', 'direct': 'Walk-in',
        'whatsapp': 'Phone', 'whats app': 'Phone', 'wp': 'Phone',
        'reference': 'Phone', 'referral': 'Phone', 'ref': 'Phone',
        'google': 'Phone', 'website': 'Phone', 'online': 'Phone'
      };
      const sourceLower = source.toLowerCase().trim();
      const mappedSource = sourceMap[sourceLower]
        || Object.entries(sourceMap).find(([k]) => sourceLower.includes(k))?.[1]
        || (source || 'Phone');

      // Normalize product — exact key, then partial substring match
      const productEntries = [
        [['aac blocks', 'aac block', 'aac', 'blocks'], 'AAC Blocks'],
        [['citabond mortar', 'citabond', 'mortar', 'cement mortar'], 'Citabond Mortar'],
        [['kavach plaster', 'kavach', 'plaster', 'wall plaster'], 'Kavach Plaster']
      ];
      const productLower = product.toLowerCase().trim();
      let mappedProduct = 'AAC Blocks'; // default
      if (productLower) {
        const found = productEntries.find(([keys]) =>
          keys.some(k => productLower === k || productLower.includes(k))
        );
        mappedProduct = found ? found[1] : (product || 'AAC Blocks');
      }

      // Optional fields
      const orderFlagRaw = getVal('OrderFlag');
      const isOrder = ['y', 'yes'].includes(orderFlagRaw.toLowerCase());

      leads.push({
        _dedupeKey: digitsOnly,
        _sourceSheet: sheetName,

        CustomerName:   customerName,
        Phone:          digitsOnly,
        Email:          getVal('Email'),
        CompanyName:    '',
        City:           getVal('City'),
        GSTNumber:      '',
        ContactPerson:  getVal('ContactPerson'),
        Region:         getVal('Region'),
        LeadSource:     mappedSource,
        ProductRequired: mappedProduct,
        Status:         mappedStatus,
        AssignedUserID: assignedUserID,
        CreatedDate:    parsedDate,
        Remark1:        getVal('Remark1') || `Imported from ${sheetName}`,
        Remark2:        getVal('Remark2'),
        OrderFlag:      isOrder ? 'Y' : 'N',
        OrderValue:     getVal('OrderValue'),
        PaymentStatus:  getVal('PaymentStatus')
      });
    } catch (err) {
      console.error('Error processing row in sheet', sheetName, err);
    }
  }

  return leads;
}

/**
 * Remove duplicate leads based on phone number.
 * @param {Array} allLeads - All leads extracted from all sheets
 * @param {Set<string>} existingPhones - Set of phone digit strings already in the system
 * @returns {Array} Deduplicated leads (metadata keys stripped)
 */
export function deduplicateLeads(allLeads, existingPhones = new Set()) {
  const seen = new Set(existingPhones);
  const deduped = [];

  for (const lead of allLeads) {
    const phone = String(lead._dedupeKey || lead.Phone || '').trim();
    if (!phone || !seen.has(phone)) {
      if (phone) seen.add(phone);
      const { _dedupeKey, _sourceSheet, ...cleanLead } = lead;
      deduped.push(cleanLead);
    }
  }

  return deduped;
}

/**
 * Process entire workbook for multi-sheet lead import.
 * Loops through ALL sheets, detects which ones contain lead data,
 * extracts leads, and deduplicates across sheets and against existing data.
 *
 * @param {Object} workbook - XLSX workbook object
 * @param {Array} existingUsers - Existing users in system (for assignment matching)
 * @param {Set<string>} existingPhones - Set of phone digit strings already in DB (for dedup)
 * @returns {{ leads: Array, stats: Object, errors: Array }}
 */
export function processLeadWorkbook(workbook, existingUsers = [], existingPhones = new Set()) {
  const allLeads = [];
  const stats = {
    sheetsProcessed: 0,
    sheetSkipped: 0,
    leadsExtracted: 0,
    duplicatesRemoved: 0
  };
  const errors = [];

  for (const sheetName of workbook.SheetNames) {
    try {
      const ws = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

      if (!rawRows || rawRows.length < 2) {
        stats.sheetSkipped++;
        continue;
      }

      // Try each of the first 10 rows as a potential header row
      // (some sheets have title rows before the actual header)
      let colMap = null;
      let headerRowIdx = -1;
      for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
        colMap = detectLeadColumns(rawRows[i]);
        if (colMap) { headerRowIdx = i; break; }
      }

      if (!colMap) {
        stats.sheetSkipped++;
        continue;
      }

      // Pass only rows from the header onwards
      const rowsFromHeader = rawRows.slice(headerRowIdx);
      const sheetLeads = extractLeadsFromSheet(rowsFromHeader, colMap, sheetName, existingUsers);

      allLeads.push(...sheetLeads);
      stats.sheetsProcessed++;
      stats.leadsExtracted += sheetLeads.length;
    } catch (err) {
      errors.push(`Sheet "${sheetName}": ${err.message}`);
      console.error(`Error processing sheet ${sheetName}:`, err);
    }
  }

  const beforeDedup = allLeads.length;
  const finalLeads = deduplicateLeads(allLeads, existingPhones);
  stats.duplicatesRemoved = beforeDedup - finalLeads.length;

  return { leads: finalLeads, stats, errors };
}

export default {
  isMonthlySheet,
  detectLeadColumns,
  extractLeadsFromSheet,
  deduplicateLeads,
  processLeadWorkbook
};
