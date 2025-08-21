const nodemailer = require('nodemailer');

// Sri Lankan mobile carriers email-to-SMS addresses
const getSMSEmail = (phoneNumber, carrier) => {
  // Remove +94 and spaces from phone number
  const cleanNumber = phoneNumber.replace('+94', '').replace(/\s/g, '');
  
  const carriers = {
    dialog: `${cleanNumber}@sms.dialog.lk`,
    mobitel: `${cleanNumber}@sms.mobitel.lk`,
    hutch: `${cleanNumber}@sms.hutch.lk`,
    airtel: `${cleanNumber}@sms.airtel.lk`
  };
  
  return carriers[carrier] || carriers.dialog;
};

// Send free SMS function
const sendFreeSMS = async (alertType, message) => {
  // **FIX HERE: createTransporter → createTransport**
  const emailSender = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'krishansavindu923@gmail.com',     // ඔබේ Gmail
      pass: 'tzanjlldqfrycjia'                 // ඔබේ App Password
    }
  });

  // SMS recipients with their carriers
  const smsRecipients = [
    { number: '+94763288750', carrier: 'dialog', name: 'Manager' },
    { number: '+94702492715', carrier: 'mobitel', name: 'Security' },
    { number: '+94763288750', carrier: 'dialog', name: 'Admin' }  // ✏️ ඔබේ numbers දාන්න
  ];

  const smsMessage = `TEA FACTORY ALERT
Type: ${alertType}
${message}
Time: ${new Date().toLocaleTimeString()}
Location: Craig Tea Factory
URGENT!`;

  try {
    console.log(`📱 Sending free SMS alerts to ${smsRecipients.length} numbers...`);
    
    const smsPromises = smsRecipients.map(async ({ number, carrier, name }) => {
      const smsEmail = getSMSEmail(number, carrier);

      return await emailSender.sendMail({
        from: 'krishansavindu923@gmail.com',
        to: smsEmail,
        subject: '', // Empty subject for SMS
        text: smsMessage.substring(0, 160) // SMS character limit
      });
    });

    await Promise.all(smsPromises);
    
    console.log('✅ Free SMS alerts sent successfully!');
    console.log(`📞 SMS sent to: ${smsRecipients.map(r => r.name + ' ' + r.number).join(', ')}`);
    
    return {
      success: true,
      smsCount: smsRecipients.length,
      recipients: smsRecipients.map(r => r.name),
      method: 'Email-to-SMS Gateway (FREE)'
    };
    
  } catch (error) {
    console.error('❌ Free SMS failed:', error.message);
    return {
      success: false,
      error: error.message,
      method: 'Email-to-SMS Gateway'
    };
  }
};

module.exports = { sendFreeSMS };
