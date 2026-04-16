/* Triggers.gs - Background jobs and email engines for CitadelCRM_DB */

function dailyReminderEngine() {
  const leads = getSheetData('LEADS');
  const interactions = getSheetData('INTERACTIONS');
  const customers = getSheetData('CUSTOMERS');
  const quotations = getSheetData('QUOTATIONS');
  const orders = getSheetData('ORDERS');
  const settings = getSettingsMap();
  
  const today = new Date();
  const followUpDays = parseInt(settings.FollowUpDays) || 3;
  const followUpEmailResendDays = parseInt(settings.FollowUpEmailResendDays) || 2;
  const staleDaysAgo = new Date();
  staleDaysAgo.setDate(today.getDate() - followUpDays);

  const resendThreshold = new Date();
  resendThreshold.setDate(today.getDate() - followUpEmailResendDays);

  const activeLeads = leads.filter(l => l['LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)'] !== 'Won' && l['LeadStatus (New/Contacted/Quoted/Negotiating/Won/Lost)'] !== 'Lost');

  activeLeads.forEach(lead => {
    const customer = customers.find(c => c.CustomerID == lead.CustomerID);
    if (!customer) return;

    // Check interaction history
    const leadInteractions = interactions.filter(i => i.LeadID == lead.LeadID);
    let lastInteractionDate = lead.CreatedAt ? new Date(lead.CreatedAt) : new Date(0);
    
    leadInteractions.forEach(int => {
      const intDate = new Date(int.InteractionDate);
      if (intDate > lastInteractionDate) {
        lastInteractionDate = intDate;
      }
    });

    if (lastInteractionDate < staleDaysAgo) {
      // Create FollowUp reminder
      createTriggerReminder(
        "FollowUp",
        lead.LeadID,
        "",
        "",
        customer.CustomerID,
        lead.AssignedUserID,
        `Follow up with ${customer.CustomerName} - no contact in ${followUpDays} days`
      );
    }

    // Check Quotations for this lead
    const leadQuotations = quotations.filter(q => q.LeadID == lead.LeadID && q['QuotationSent (Yes/No)'] === 'Yes');
    leadQuotations.forEach(quotation => {
      const hasOrder = orders.some(o => o.LeadID == lead.LeadID);
      if (!hasOrder) {
        // Find if we already followed up recently
        const recentFollowUps = interactions.filter(i => 
          i.LeadID == lead.LeadID && 
          i['Type (Call/Email/Visit/WhatsApp)'] == 'Email' && 
          i['Feedback (Call not received/Spoke with customer/Details shared/Waiting for approval/Other)'].includes('Automated Follow-up')
        );

        let lastFollowUpEmailDate = new Date(quotation.QuotationDate);
        recentFollowUps.forEach(f => {
          const fDate = new Date(f.InteractionDate);
          if (fDate > lastFollowUpEmailDate) {
            lastFollowUpEmailDate = fDate;
          }
        });

        if (lastFollowUpEmailDate < resendThreshold && String(settings.AutoFollowUpEmailEnabled).toLowerCase() === 'true') {
          // Send automated follow-up
          if (customer.Email) {
            sendFollowUpEmail(lead, customer, quotation, settings);
            
            // Log interaction
            appendRow('INTERACTIONS', {
              InteractionID: generateID("INT"),
              LeadID: lead.LeadID,
              CustomerID: customer.CustomerID,
              InteractionDate: new Date().toISOString(),
              "Type (Call/Email/Visit/WhatsApp)": "Email",
              "Feedback (Call not received/Spoke with customer/Details shared/Waiting for approval/Other)": "Automated Follow-up sent",
              Remark1: `Followed up on Quotation ${quotation.QuotationID}`,
              Remark2: "",
              NextFollowUpDate: "",
              "FollowUpStatus (Pending/Completed)": "Completed",
              CreatedByUserID: "SYSTEM",
              CreatedAt: new Date().toISOString()
            });

            // Create reminder for staff that email was sent
            createTriggerReminder(
              "FollowUp",
              lead.LeadID,
              "",
              "",
              customer.CustomerID,
              lead.AssignedUserID,
              `Automated follow-up email sent to ${customer.CustomerName} for Quotation ${quotation.QuotationID}`
            );
          }
        }
      }
    });

  });
}

function dailyPaymentReminderEngine() {
  const payments = getSheetData('PAYMENTS');
  const orders = getSheetData('ORDERS');
  const customers = getSheetData('CUSTOMERS');
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const settings = getSettingsMap();
  const paymentLookaheadDays = parseInt(settings.PaymentDueLookaheadDays) || 3;
  const lookaheadDate = new Date(today);
  lookaheadDate.setDate(today.getDate() + paymentLookaheadDays);

  const pendingPayments = payments.filter(p => p['PaymentStatus (Pending/Partial/Paid)'] === 'Pending' || p['PaymentStatus (Pending/Partial/Paid)'] === 'Partial');

  pendingPayments.forEach(payment => {
    if (!payment.DueDate) return;
    const dueDateStr = payment.DueDate.split('T')[0];
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0,0,0,0);

    if (dueDate <= lookaheadDate) {
      const order = orders.find(o => o.OrderID == payment.OrderID);
      if (!order) return;
      
      const customer = customers.find(c => c.CustomerID == payment.CustomerID);
      const customerName = customer ? customer.CustomerName : 'Unknown';
      const outstanding = payment.OutstandingAmount;

      let msg = "";
      if (dueDate < today) {
        msg = `[OVERDUE] Payment due from ${customerName} on ${dueDateStr} — Outstanding: ₹${outstanding}`;
      } else {
        msg = `Payment due from ${customerName} on ${dueDateStr} — Outstanding: ₹${outstanding}`;
      }

      // Avoid duplicate reminders for the same payment on the same day
      const existingReminders = getSheetData('REMINDERS').filter(r => 
        r.PaymentID == payment.PaymentID && 
        r['Status (Pending/Dismissed/Completed)'] == 'Pending' &&
        r.ReminderMessage == msg
      );

      if (existingReminders.length === 0) {
        createTriggerReminder(
          "Payment",
          "",
          order.OrderID,
          payment.PaymentID,
          customer ? customer.CustomerID : "",
          order.AssignedUserID,
          msg
        );
      }
    }
  });
}

function sendFollowUpEmail(lead, customer, quotation, settings) {
  const companyName = settings.CompanyName || 'Citadel';
  const logoUrl = settings.CompanyLogo || 'https://via.placeholder.com/150x50.png?text=Citadel+Logo';
  const subject = `Following up on your enquiry - ${lead['ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)']}`;
  
  const htmlBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; background-color: #f9f9f9; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .header { background-color: #1565C0; padding: 20px; text-align: center; }
      .header img { max-height: 50px; }
      .content { padding: 30px; }
      .content h2 { color: #1565C0; margin-top: 0; }
      .summary-box { background-color: #f0f7ff; border-left: 4px solid #1565C0; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .cta-container { text-align: center; margin: 30px 0; }
      .btn { display: inline-block; background-color: #2E7D32; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; }
      .footer { background-color: #333333; color: #ffffff; text-align: center; padding: 20px; font-size: 12px; }
      .unsubscribe { color: #aaaaaa; font-size: 11px; margin-top: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 style="color: white; margin: 0;">${companyName}</h1>
      </div>
      <div class="content">
        <h2>Hello ${customer.CustomerName},</h2>
        <p>I hope this email finds you well.</p>
        <p>I am following up regarding your recent enquiry for <strong>${lead['ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)']}</strong>. We shared a quotation with you on ${new Date(quotation.QuotationDate).toLocaleDateString()} and wanted to check if you had a chance to review it.</p>
        
        <div class="summary-box">
          <strong>Enquiry Details:</strong><br>
          Product: ${lead['ProductRequired (AAC Blocks/Citabond Mortar/Kavach Plaster)']}<br>
          Quantity: ${lead.QuantityRequired}<br>
          Timeline: ${lead.RequirementTimeline}
        </div>
        
        <p>If you have any questions or need further clarification, our team is ready to assist you in making the best choice for your project.</p>
        
        <div class="cta-container">
          <a href="mailto:${settings.AdminEmail || 'sales@citadel.com'}?subject=Reply to Quotation ${quotation.QuotationID}" class="btn">Reply to this Email</a>
        </div>
        
        <p>We look forward to hearing from you soon.</p>
        <p>Best Regards,<br><strong>Team ${companyName}</strong></p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
        <p>Contact: ${settings.AdminEmail || 'sales@citadel.com'}</p>
        <p class="unsubscribe">If you no longer wish to receive these emails, please reply to this email with "Unsubscribe" in the subject line.</p>
      </div>
    </div>
  </body>
  </html>
  `;
  
  MailApp.sendEmail({
    to: customer.Email,
    subject: subject,
    htmlBody: htmlBody
  });
}

function createTriggerReminder(type, leadID, orderID, paymentID, customerID, assignedUserID, message) {
  appendRow('REMINDERS', {
    ReminderID: generateID("REM"),
    "Type (FollowUp/Payment/Dispatch/CrossSell/GoogleReview/Reference/Quotation)": type,
    LeadID: leadID || "",
    OrderID: orderID || "",
    PaymentID: paymentID || "",
    CustomerID: customerID || "",
    AssignedUserID: assignedUserID || "",
    ReminderDate: new Date().toISOString(),
    ReminderMessage: message,
    "Status (Pending/Dismissed/Completed)": "Pending",
    CreatedAt: new Date().toISOString()
  });
}

function setupTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('dailyReminderEngine')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();

  ScriptApp.newTrigger('dailyPaymentReminderEngine')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();
    
  Logger.log("Triggers successfully set up for 9:00 AM daily.");
}
