const axios = require('axios');

// Free WhatsApp API using CallMeBot service
const sendWhatsAppAlert = async (alertType, message) => {
  // WhatsApp recipients with their CallMeBot API keys
  const whatsappRecipients = [
    { 
      phone: '94771234567',           // ✏️ ඔබේ WhatsApp number (without +)
      apikey: 'YOUR_API_KEY_1',       // ✏️ CallMeBot API key
      name: 'Manager'
    },
    { 
      phone: '94777654321',           // ✏️ Security team WhatsApp
      apikey: 'YOUR_API_KEY_2',       // ✏️ CallMeBot API key
      name: 'Security Team'
    }
  ];

  const whatsappMessage = `🚨 *TEA FACTORY ALERT*

*Type:* ${alertType}
*Message:* ${message}
*Time:* ${new Date().toLocaleString()}
*Location:* Craig Tea Factory

⚠️ *IMMEDIATE ACTION REQUIRED*`;

  try {
    console.log(`💚 Sending WhatsApp alerts to ${whatsappRecipients.length} numbers...`);
    
    const whatsappPromises = whatsappRecipients.map(async ({ phone, apikey, name }) => {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(whatsappMessage)}&apikey=${apikey}`;
      
      const response = await axios.get(url);
      console.log(`WhatsApp sent to ${name}: ${response.status}`);
      return response;
    });

    await Promise.all(whatsappPromises);
    
    console.log('✅ WhatsApp alerts sent successfully!');
    
    return {
      success: true,
      whatsappCount: whatsappRecipients.length,
      recipients: whatsappRecipients.map(r => r.name),
      method: 'CallMeBot WhatsApp API (FREE)'
    };
    
  } catch (error) {
    console.error('❌ WhatsApp alert failed:', error.message);
    return {
      success: false,
      error: error.message,
      method: 'CallMeBot WhatsApp API'
    };
  }
};

module.exports = { sendWhatsAppAlert };
