import nodemailer from 'nodemailer';
import 'dotenv/config'; 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_CLINICA,
    pass: process.env.PASSWORD_APP_EMAIL
  }
});

const enviarCorreoInstitucional = async ({ to, subject, html, attachments = [] }) => {
  try {
    const mailOptions = {
      from: `"Pet Experts" <${process.env.EMAIL_CLINICA}>`,
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✨ Correo enviado con éxito. ID: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error(' Error crítico en el servicio de email:', error);
    return { success: false, error: error.message };
  }
};

export { enviarCorreoInstitucional };