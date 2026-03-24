const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Nur POST erlauben
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { subject, body, recipients } = JSON.parse(event.body);
    
    // Validierung
    if (!subject || !body) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Betreff und Nachricht sind erforderlich' })
      };
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Mindestens ein Empfänger ist erforderlich' })
      };
    }

    // E-Mail-Adressen validieren
    const emails = recipients.filter(email => email && email.includes('@'));

    // Gmail Transporter erstellen
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // E-Mail-Optionen
    const mailOptions = {
      from: `"Majlis Khuddam-ul-Ahmadiyya" <${process.env.GMAIL_USER}>`,
      bcc: emails, // BCC für Datenschutz - niemand sieht andere Empfänger
      subject: subject,
      text: body,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #000; color: white; padding: 20px; text-align: center;">
            <h2>Majlis Khuddam-ul-Ahmadiyya</h2>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p style="white-space: pre-wrap; line-height: 1.6;">${body}</p>
          </div>
          <div style="background-color: #e9e9e9; padding: 15px; text-align: center; font-size: 12px; color: #666;">
            <p>Diese E-Mail wurde von der Chanda-Verwaltung gesendet.</p>
            <p>© ${new Date().getFullYear()} Majlis Khuddam-ul-Ahmadiyya</p>
          </div>
        </div>
      `
    };

    // E-Mail senden
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent:', info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: `E-Mail erfolgreich an ${emails.length} Empfänger gesendet`,
        recipients: emails.length
      })
    };

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Spezifische Fehlerbehandlung
    let errorMessage = 'Fehler beim Senden der E-Mail';
    
    if (error.message.includes('Invalid login')) {
      errorMessage = 'Gmail-Anmeldung fehlgeschlagen. Bitte App-Passwort überprüfen.';
    } else if (error.message.includes('Recipient')) {
      errorMessage = 'Ungültige E-Mail-Adresse gefunden';
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: errorMessage,
        details: error.message 
      })
    };
  }
};
