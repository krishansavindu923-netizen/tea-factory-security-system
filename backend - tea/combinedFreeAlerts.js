const { sendAlert } = require('./emailAlert');
const { sendFreeSMS } = require('./freeSMSService');
const { sendWhatsAppAlert } = require('./whatsappService');

// Send alerts via all free methods
const sendAllFreeAlerts = async (alertType, message) => {
  console.log(`🚨 Sending ${alertType} via all FREE platforms...`);
  
  const results = {
    email: { success: false, method: 'Gmail' },
    sms: { success: false, method: 'Email-to-SMS' },
    whatsapp: { success: false, method: 'CallMeBot' }
  };

  // 1. Send Email Alert (Free)
  try {
    results.email = await sendAlert(alertType, message);
    results.email.method = 'Gmail (FREE)';
  } catch (error) {
    console.error('Email alert failed:', error);
  }

  // 2. Send Free SMS (Email-to-SMS Gateway)
  try {
    results.sms = await sendFreeSMS(alertType, message);
  } catch (error) {
    console.error('Free SMS alert failed:', error);
  }

  // 3. Send WhatsApp (CallMeBot Free API)
  try {
    results.whatsapp = await sendWhatsAppAlert(alertType, message);
  } catch (error) {
    console.error('WhatsApp alert failed:', error);
  }

  // Summary
  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`📊 Alert Summary: ${successCount}/3 platforms successful`);
  
  return {
    success: successCount > 0,
    totalPlatforms: 3,
    successfulPlatforms: successCount,
    results: results,
    timestamp: new Date().toISOString()
  };
};

module.exports = { sendAllFreeAlerts };
