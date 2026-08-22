const nodemailer = require('nodemailer');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Admin Contact Details
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rp111monster@gmail.com';
const ADMIN_PHONE = process.env.ADMIN_PHONE || '9340623657';

/**
 * Simple HTTP(S) request helper (replaces axios — zero dependencies)
 */
function httpRequest(urlString, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(urlString);
    const lib = parsedUrl.protocol === 'https:' ? https : http;
    const method = (options.method || 'GET').toUpperCase();

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: options.headers || {},
      timeout: options.timeout || 10000,
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Configure Nodemailer Transporter for Gmail / Custom SMTP
 */
function createTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Gmail App Password (16-char)
      },
    });
  }
  
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
}

/**
 * Send WhatsApp notification to Admin
 * Supports: CallMeBot (free), Twilio, or custom webhook
 */
async function sendWhatsAppNotification(messageText) {
  try {
    const rawPhone = ADMIN_PHONE.replace(/[^0-9]/g, '');

    // Option 1: CallMeBot WhatsApp API (Free & Instant — recommended for solo admin)
    if (process.env.CALLMEBOT_API_KEY) {
      const encodedMsg = encodeURIComponent(messageText);
      const url = `https://api.callmebot.com/whatsapp.php?phone=+91${rawPhone}&text=${encodedMsg}&apikey=${process.env.CALLMEBOT_API_KEY}`;
      await httpRequest(url);
      console.log(`✅ WhatsApp Notification sent to ${ADMIN_PHONE} via CallMeBot`);
      return true;
    }

    // Option 2: Twilio WhatsApp API
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      params.append('From', process.env.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:') ? process.env.TWILIO_WHATSAPP_NUMBER : `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`);
      params.append('To', `whatsapp:+91${rawPhone}`);
      params.append('Body', messageText);

      await httpRequest(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      console.log(`✅ WhatsApp Notification sent to ${ADMIN_PHONE} via Twilio`);
      return true;
    }

    // Option 3: Custom Webhook API (UltraMsg / GreenAPI / any webhook)
    if (process.env.WHATSAPP_WEBHOOK_URL) {
      const body = JSON.stringify({ phone: ADMIN_PHONE, message: messageText });
      await httpRequest(process.env.WHATSAPP_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      console.log(`✅ WhatsApp Notification sent to ${ADMIN_PHONE} via Custom Webhook`);
      return true;
    }

    // Fallback: Console log (no API key configured)
    console.log(`\n========================================`);
    console.log(`📱 [WHATSAPP NOTIFICATION] -> Admin Phone: ${ADMIN_PHONE}`);
    console.log(`----------------------------------------`);
    console.log(messageText);
    console.log(`========================================\n`);
    return false;
  } catch (err) {
    console.error('❌ Failed to send WhatsApp notification:', err.message);
    return false;
  }
}

/**
 * Send Gmail / Email Notification to Admin
 */
async function sendEmailNotification(subject, htmlBody) {
  try {
    const transporter = createTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: `"HOMEMADE Protein Alerts" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
        to: ADMIN_EMAIL,
        subject: subject,
        html: htmlBody,
      });
      console.log(`✅ Email Notification sent to ${ADMIN_EMAIL}`);
      return true;
    }

    // Fallback: Console log (no email credentials configured)
    console.log(`\n========================================`);
    console.log(`📧 [EMAIL NOTIFICATION] -> Admin Email: ${ADMIN_EMAIL}`);
    console.log(`[SUBJECT]: ${subject}`);
    console.log(`----------------------------------------`);
    console.log(`HTML Email Ready (configure EMAIL_USER + EMAIL_PASS to send)`);
    console.log(`========================================\n`);
    return false;
  } catch (err) {
    console.error('❌ Failed to send Email notification:', err.message);
    return false;
  }
}

/**
 * Trigger Notifications for NEW ORDER
 */
exports.notifyNewOrder = async (order) => {
  try {
    const orderNum = order.orderNumber || order._id?.toString().slice(-6) || 'N/A';
    const customerName = order.customer?.name || 'Customer';
    const customerPhone = order.customer?.phone || 'N/A';
    const totalAmount = Number(order.totalAmount || 0).toFixed(2);
    const paymentMethod = (order.paymentMethod || 'COD').toUpperCase();

    const itemsSummary = (order.items || []).map(i => {
      const name = i.name || i.menuItem?.name || 'Item';
      const qty = i.quantity || 1;
      const price = Number(i.price || 0).toFixed(2);
      return `• ${qty}x ${name} (₹${price})`;
    }).join('\n');

    // --- WhatsApp Message ---
    const whatsappMsg = 
`🚨 *NEW ORDER RECEIVED!* 🥡
-----------------------------
*Order #:* ${orderNum}
*Customer:* ${customerName} (${customerPhone})
*Total Amount:* ₹${totalAmount}
*Payment:* ${paymentMethod}

*Items Ordered:*
${itemsSummary}

*Delivery Type:* ${order.deliveryType || 'Delivery'}
-----------------------------
Log in to your Admin Dashboard to manage this order!`;

    // --- Email HTML ---
    const emailSubject = `🚨 New Order #${orderNum} Received! - ₹${totalAmount}`;
    const itemsHtml = (order.items || []).map(i => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${i.name || i.menuItem?.name || 'Item'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${i.quantity || 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${Number(i.price || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; background-color: #ffffff;">
        <div style="background-color: #f59e0b; color: #1c1917; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 22px;">🥡 New Order Received!</h1>
          <p style="margin: 5px 0 0 0; font-weight: bold;">Order #${orderNum}</p>
        </div>
        
        <p style="font-size: 16px;">Hello Admin,</p>
        <p style="font-size: 15px;">A new order has been placed on <strong>HOMEMADE Protein</strong>!</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 8px; font-weight: bold;">Customer:</td>
            <td style="padding: 8px;">${customerName} (${customerPhone})</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Total Amount:</td>
            <td style="padding: 8px; font-weight: bold; color: #d97706;">₹${totalAmount}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 8px; font-weight: bold;">Payment Method:</td>
            <td style="padding: 8px;">${paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Delivery Type:</td>
            <td style="padding: 8px;">${order.deliveryType || 'Delivery'}</td>
          </tr>
        </table>

        <h3 style="border-bottom: 2px solid #f59e0b; padding-bottom: 5px;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left;">
              <th style="padding: 10px;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 25px; text-align: center;">
          <a href="${process.env.CLIENT_URL || 'https://homemade-protein-production.vercel.app'}/admin" style="background-color: #f59e0b; color: #1c1917; padding: 12px 24px; border-radius: 25px; font-weight: bold; text-decoration: none; display: inline-block;">View Admin Dashboard</a>
        </div>
      </div>
    `;

    // Fire both notifications concurrently (non-blocking)
    await Promise.allSettled([
      sendWhatsAppNotification(whatsappMsg),
      sendEmailNotification(emailSubject, emailHtml)
    ]);
  } catch (err) {
    console.error('❌ Error in notifyNewOrder:', err.message);
  }
};

/**
 * Trigger Notifications for NEW CUSTOM DISH REQUEST
 */
exports.notifyNewRequest = async (request) => {
  try {
    const customerName = request.customer?.name || 'Customer';
    const customerPhone = request.customer?.phone || 'N/A';
    const dishName = request.dishName || 'Custom Protein Dish';
    const description = request.description || 'No description provided.';
    const servings = request.servingsNeeded || 1;
    const budget = request.budget ? `₹${request.budget}` : 'Flexible';
    const prefs = (request.dietaryPreferences || []).join(', ') || 'Standard';

    // --- WhatsApp Message ---
    const whatsappMsg = 
`💡 *NEW CUSTOM MEAL REQUEST!* 🥗
-----------------------------
*Dish:* ${dishName}
*Customer:* ${customerName} (${customerPhone})
*Servings:* ${servings}
*Budget:* ${budget}
*Diet Preferences:* ${prefs}

*Description:*
"${description}"
-----------------------------
Review and accept this request on your Admin/Chef dashboard!`;

    // --- Email HTML ---
    const emailSubject = `💡 New Custom Meal Request from ${customerName}: ${dishName}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; background-color: #ffffff;">
        <div style="background-color: #3b82f6; color: #ffffff; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 22px;">🥗 New Custom Meal Request</h1>
          <p style="margin: 5px 0 0 0;">${dishName}</p>
        </div>

        <p style="font-size: 16px;">Hello Admin & Chef,</p>
        <p style="font-size: 15px;">A user has submitted a custom meal plan request:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 8px; font-weight: bold;">Customer:</td>
            <td style="padding: 8px;">${customerName} (${customerPhone})</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Dish Name:</td>
            <td style="padding: 8px; font-weight: bold; color: #2563eb;">${dishName}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 8px; font-weight: bold;">Servings:</td>
            <td style="padding: 8px;">${servings}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Budget:</td>
            <td style="padding: 8px;">${budget}</td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 8px; font-weight: bold;">Preferences:</td>
            <td style="padding: 8px;">${prefs}</td>
          </tr>
        </table>

        <div style="background-color: #eff6ff; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 4px; margin-bottom: 20px;">
          <strong>Request Notes:</strong>
          <p style="margin: 5px 0 0 0; font-style: italic;">"${description}"</p>
        </div>

        <div style="margin-top: 25px; text-align: center;">
          <a href="${process.env.CLIENT_URL || 'https://homemade-protein-production.vercel.app'}/chef" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 25px; font-weight: bold; text-decoration: none; display: inline-block;">Review in Dashboard</a>
        </div>
      </div>
    `;

    // Fire both notifications concurrently (non-blocking)
    await Promise.allSettled([
      sendWhatsAppNotification(whatsappMsg),
      sendEmailNotification(emailSubject, emailHtml)
    ]);
  } catch (err) {
    console.error('❌ Error in notifyNewRequest:', err.message);
  }
};
