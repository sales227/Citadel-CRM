function generateCrossSellReminders(order, customer, assignedUserID) {
  var settings = getSettingsMap();
  var allProducts = ['AAC Blocks', 'Citabond Mortar', 'Kavach Plaster'];
  var orderedProducts = order.ProductOrdered ? order.ProductOrdered.split(',').map(function(p) { return p.trim(); }) : [];

  var missingProducts = allProducts.filter(function(p) { return orderedProducts.indexOf(p) === -1; });

  var crossSellDelay = parseInt(settings.CrossSellDelayDays) || 7;
  var reminderDate = dateAddDays(order.OrderDate, crossSellDelay);
  var createdAt = new Date().toISOString();
  
  missingProducts.forEach(function(missingProduct) {
    var reminderMessage = customer.CustomerName + " ordered " + orderedProducts.join(', ') + ". Promote " + missingProduct + " for their construction project.";

    appendRow('REMINDERS', {
      ReminderID: generateID('REM'),
      "Type (FollowUp/Payment/Dispatch/CrossSell/GoogleReview/Reference/Quotation)": 'CrossSell',
      LeadID: order.LeadID || '',
      OrderID: order.OrderID,
      PaymentID: '',
      CustomerID: customer.CustomerID,
      AssignedUserID: assignedUserID,
      ReminderDate: reminderDate,
      ReminderMessage: reminderMessage,
      "Status (Pending/Dismissed/Completed)": 'Pending',
      CreatedAt: createdAt
    });
  });
}

function generatePostSaleReminders(payment, customer, assignedUserID) {
  var settings = getSettingsMap();
  var createdAt = new Date().toISOString();

  // PaymentReceivedDate isn't explicitly defined in our schema so using current date or payment.UpdatedAt
  var baseDate = new Date().toISOString().split('T')[0];

  // Row A - Reference
  var referenceDelay = parseInt(settings.ReferenceRequestDelayDays) || 2;
  var refDate = dateAddDays(baseDate, referenceDelay);
  var refMsg = "Ask " + customer.CustomerName + " for references to other construction sites. They completed payment for Invoice " + payment.InvoiceNumber + ".";

  appendRow('REMINDERS', {
    ReminderID: generateID('REM'),
    "Type (FollowUp/Payment/Dispatch/CrossSell/GoogleReview/Reference/Quotation)": 'Reference',
    LeadID: '',
    OrderID: payment.OrderID,
    PaymentID: '',
    CustomerID: customer.CustomerID,
    AssignedUserID: assignedUserID,
    ReminderDate: refDate,
    ReminderMessage: refMsg,
    "Status (Pending/Dismissed/Completed)": 'Pending',
    CreatedAt: createdAt
  });

  // Row B - Google Review
  var googleReviewDelay = parseInt(settings.GoogleReviewDelayDays) || 3;
  var revDate = dateAddDays(baseDate, googleReviewDelay);
  var revMsg = "Request a Google Review from " + customer.CustomerName + " \u2014 great time to ask after successful delivery and payment.";

  appendRow('REMINDERS', {
    ReminderID: generateID('REM'),
    "Type (FollowUp/Payment/Dispatch/CrossSell/GoogleReview/Reference/Quotation)": 'GoogleReview',
    LeadID: '',
    OrderID: payment.OrderID,
    PaymentID: '',
    CustomerID: customer.CustomerID,
    AssignedUserID: assignedUserID,
    ReminderDate: revDate,
    ReminderMessage: revMsg,
    "Status (Pending/Dismissed/Completed)": 'Pending',
    CreatedAt: createdAt
  });
}

function dateAddDays(dateStr, days) {
  var d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function sendThankYouEmail(order, customer, rmUser) {
  if (!customer.Email) return;

  var settings = getSettingsMap();
  var senderEmail = settings.AdminEmail || Session.getActiveUser().getEmail() || 'support@citadel.com';

  var subject = "Thank You for Your Order \u2014 Citadel";
  
  var htmlBody = 
    "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>" +
      "<div style='background-color: #1565C0; padding: 20px; text-align: center;'>" +
        "<h1 style='color: white; margin: 0; font-size: 24px; letter-spacing: 1px;'>Citadel</h1>" +
      "</div>" +
      "<div style='padding: 30px;'>" +
        "<p style='color: #333; font-size: 16px;'>Dear " + customer.CustomerName + ",</p>" +
        "<p style='color: #555; line-height: 1.6;'>Thank you for placing your order with Citadel. We are delighted to serve you and look forward to being a part of your construction journey.</p>" +
        
        "<div style='background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 25px 0;'>" +
          "<h3 style='margin-top: 0; color: #1565C0; font-size: 16px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;'>Order Summary</h3>" +
          "<table style='width: 100%; border-collapse: collapse; font-size: 14px;'>" +
            "<tr><td style='padding: 8px 0; color: #666; width: 40%;'>Product:</td><td style='padding: 8px 0; font-weight: bold; color: #333;'>" + order.ProductOrdered + "</td></tr>" +
            "<tr><td style='padding: 8px 0; color: #666;'>Quantity:</td><td style='padding: 8px 0; font-weight: bold; color: #333;'>" + order.OrderQuantity + "</td></tr>" +
            "<tr><td style='padding: 8px 0; color: #666;'>Order Date:</td><td style='padding: 8px 0; font-weight: bold; color: #333;'>" + order.OrderDate + "</td></tr>" +
            "<tr><td style='padding: 8px 0; color: #666;'>Dispatch Schedule:</td><td style='padding: 8px 0; font-weight: bold; color: #333;'>" + (order.DispatchSchedule || 'TBD') + "</td></tr>" +
          "</table>" +
        "</div>" +
        
        "<p style='color: #555; font-weight: bold; margin-bottom: 5px;'>Your dedicated Relationship Manager:</p>" +
        "<p style='color: #555; margin: 0;'>Name: " + (rmUser ? rmUser.FullName : 'Citadel Support') + "</p>" +
        "<p style='color: #555; margin: 0;'>Phone: " + (settings.CompanyPhone || '+91 800-000-0000') + "</p>" +
        "<p style='color: #555; margin: 0;'>Email: " + senderEmail + "</p>" +
        
        "<div style='text-align: center; margin-top: 30px;'>" +
          "<a href='mailto:" + senderEmail + "' style='background-color: #2E7D32; color: white; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; display: inline-block;'>Contact Your RM</a>" +
        "</div>" +
      "</div>" +
      "<div style='background-color: #f9f9f9; padding: 15px; text-align: center; border-top: 1px solid #eee;'>" +
        "<p style='color: #888; font-size: 12px; margin: 0;'>Citadel Building Materials Pvt. Ltd.</p>" +
        "<p style='color: #888; font-size: 12px; margin: 5px 0 0 0;'>This is an automated message. Please do not reply directly to this email.</p>" +
      "</div>" +
    "</div>";

  try {
    MailApp.sendEmail({
      to: customer.Email,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (e) {
    console.error("Failed to send Thank You email: " + e.toString());
  }
}

function sendThankYouPaymentEmail(payment, customer) {
  if (!customer.Email) return;

  var subject = "Payment Received \u2014 Thank You! \u2014 Citadel";
  
  var outstandingLine = "";
  if (parseFloat(payment.OutstandingAmount) > 0) {
    outstandingLine = "<p style='color: #E65100; font-weight: bold; background-color: #FFF3E0; padding: 10px; border-radius: 4px; text-align: center;'>Note: You have an outstanding balance of \u20B9" + payment.OutstandingAmount + ".</p>";
  }
  
  // Fake payment date since we don't have PaymentReceivedDate explicitly
  var paymentDate = new Date().toLocaleDateString();

  var htmlBody = 
    "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>" +
      "<div style='background-color: #2E7D32; padding: 20px; text-align: center;'>" +
        "<h1 style='color: white; margin: 0; font-size: 22px; letter-spacing: 1px;'>Payment Confirmed ✓</h1>" +
      "</div>" +
      "<div style='padding: 30px;'>" +
        "<p style='color: #333; font-size: 16px;'>Dear " + customer.CustomerName + ",</p>" +
        "<p style='color: #555; line-height: 1.6;'>We have received your payment. Thank you for your prompt remittance!</p>" +
        
        "<div style='background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin: 25px 0;'>" +
          "<table style='width: 100%; border-collapse: collapse; font-size: 14px;'>" +
            "<tr><td style='padding: 8px 0; color: #666; width: 45%;'>Invoice Number:</td><td style='padding: 8px 0; font-weight: bold; color: #333;'>" + payment.InvoiceNumber + "</td></tr>" +
            "<tr><td style='padding: 8px 0; color: #666;'>Amount Received:</td><td style='padding: 8px 0; font-weight: bold; color: #2E7D32;'>\u20B9" + payment.PaidAmount + "</td></tr>" +
            "<tr><td style='padding: 8px 0; color: #666;'>Outstanding Balance:</td><td style='padding: 8px 0; font-weight: bold; color: #333;'>\u20B9" + payment.OutstandingAmount + "</td></tr>" +
            "<tr><td style='padding: 8px 0; color: #666;'>Payment Date:</td><td style='padding: 8px 0; font-weight: bold; color: #333;'>" + paymentDate + "</td></tr>" +
          "</table>" +
        "</div>" +
        
        outstandingLine +
        
        "<p style='color: #555; line-height: 1.6; margin-top: 25px;'>We look forward to serving you again. For future requirements or any queries, please don't hesitate to reach out to our team.</p>" +
      "</div>" +
      "<div style='background-color: #f9f9f9; padding: 15px; text-align: center; border-top: 1px solid #eee;'>" +
        "<p style='color: #888; font-size: 12px; margin: 0;'>Citadel Building Materials Pvt. Ltd.</p>" +
      "</div>" +
    "</div>";

  try {
    MailApp.sendEmail({
      to: customer.Email,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (e) {
    console.error("Failed to send Payment Received email: " + e.toString());
  }
}
