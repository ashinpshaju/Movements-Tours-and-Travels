/*****
Movements Tours and Travels Inquiry Backend
Stores lead in Google Sheets, sends email notification, and sends WhatsApp notification through Twilio.

Before deployment, set Script Properties:
TEAM_EMAIL = your-team-email@example.com
TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN = your_twilio_auth_token
TWILIO_WHATSAPP_FROM = whatsapp:+14155238886
TEAM_WHATSAPP_TO = whatsapp:+91XXXXXXXXXX
*****/

const SHEET_NAME = 'Inquiries';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const sheet = getInquirySheet_();
    const leadId = 'MTT-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');

    const row = [
      new Date(),
      leadId,
      data.name || '',
      data.institution || '',
      data.email || '',
      data.phone || '',
      data.service || '',
      data.destination || '',
      data.replyMethod || '',
      data.message || '',
      data.submittedFrom || ''
    ];

    sheet.appendRow(row);

    const textMessage = buildMessage_(leadId, data);
    sendEmail_(leadId, data, textMessage);
    sendWhatsApp_(textMessage);

    return json_({ success: true, leadId });
  } catch (error) {
    return json_({ success: false, message: error.message });
  }
}

function getInquirySheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'Timestamp',
      'Lead ID',
      'Name',
      'Institution / Group',
      'Email',
      'Phone',
      'Service',
      'Destination',
      'Preferred Reply Method',
      'Message',
      'Submitted From'
    ]);
  }

  return sheet;
}

function buildMessage_(leadId, data) {
  return `New Inquiry - Movements Tours and Travels

Lead ID: ${leadId}
Name: ${data.name || '-'}
Institution / Group: ${data.institution || '-'}
Email: ${data.email || '-'}
Phone: ${data.phone || '-'}
Service: ${data.service || '-'}
Destination: ${data.destination || '-'}
Preferred Reply Method: ${data.replyMethod || '-'}

Message:
${data.message || '-'}`;
}

function sendEmail_(leadId, data, textMessage) {
  const props = PropertiesService.getScriptProperties();
  const teamEmail = props.getProperty('TEAM_EMAIL');
  if (!teamEmail) return;

  MailApp.sendEmail({
    to: teamEmail,
    subject: `New Travel Inquiry ${leadId} - ${data.destination || 'Movements'}`,
    body: textMessage
  });
}

function sendWhatsApp_(textMessage) {
  const props = PropertiesService.getScriptProperties();
  const sid = props.getProperty('TWILIO_ACCOUNT_SID');
  const token = props.getProperty('TWILIO_AUTH_TOKEN');
  const from = props.getProperty('TWILIO_WHATSAPP_FROM');
  const to = props.getProperty('TEAM_WHATSAPP_TO');

  if (!sid || !token || !from || !to) return;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const payload = {
    From: from,
    To: to,
    Body: textMessage
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    payload,
    headers: {
      Authorization: 'Basic ' + Utilities.base64Encode(sid + ':' + token)
    },
    muteHttpExceptions: true
  });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
