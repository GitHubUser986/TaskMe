import nodemailer from 'nodemailer';

// Don't create transporter at import time - create it when needed
let transporter = null;

/**
 * Get or create email transporter (lazy initialization)
 */
const getTransporter = () => {
  if (!transporter) {
    console.log('=== EMAIL SERVICE INITIALIZATION ===');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASSWORD exists:', !!process.env.EMAIL_PASSWORD);
    console.log('EMAIL_PASSWORD length:', process.env.EMAIL_PASSWORD?.length || 0);
    console.log('====================================');

    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Vérifier la configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Erreur de configuration email:', error.message);
      } else {
        console.log('✅ Service email prêt');
      }
    });
  }
  
  return transporter;
};

/**
 * Templates d'email selon le type de notification
 */
const getEmailTemplate = (type, message) => {
  const templates = {
    'Information': {
      subject: '📬 Nouvelle information',
      color: '#3498db',
      icon: 'ℹ️'
    },
    'Echoue': {
      subject: '❌ Notification d\'échec',
      color: '#e74c3c',
      icon: '❌'
    },
    'Rappel': {
      subject: '🔔 Rappel important',
      color: '#f39c12',
      icon: '🔔'
    },
    'Succès': {
      subject: '✅ Opération réussie',
      color: '#2ecc71',
      icon: '✓'
    }
  };

  const template = templates[type] || templates['Information'];
  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  return {
    subject: template.subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${template.color}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .icon { font-size: 48px; margin-bottom: 10px; }
            .message { font-size: 16px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
            .button { display: inline-block; padding: 12px 30px; background-color: ${template.color}; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">${template.icon}</div>
              <h2>${template.subject}</h2>
            </div>
            <div class="content">
              <p class="message">${message}</p>
              <p>Cette notification a été générée automatiquement par le système.</p>
              <a href="${appUrl}" class="button">
                Voir dans l'application
              </a>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>&copy; ${new Date().getFullYear()} Système de Gestion TaskMe</p>
            </div>
          </div>
        </body>
      </html>
    `
  };
};

/**
 * Envoie un email de notification
 * @param {string} to - Email du destinataire
 * @param {string} type - Type de notification
 * @param {string} message - Message de la notification
 * @param {string} userName - Nom complet de l'utilisateur
 */
export const sendNotificationEmail = async (to, type, message, userName = '') => {
  try {
    // Get transporter (will initialize if needed)
    const emailTransporter = getTransporter();
    
    const { subject, html } = getEmailTemplate(type, message);

    const mailOptions = {
      from: `"TaskMe System" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: message
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Email envoyé avec succès:', info.messageId, 'à', to);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
    return { success: false, error: error.message };
  }
};

export default { sendNotificationEmail };