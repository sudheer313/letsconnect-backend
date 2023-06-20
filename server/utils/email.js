// email.js
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, text, html) => {
  const msg = {
    to: to,
    from: "kandulasudheerreddy123@gmail.com", // Use the email address or domain you verified with your SendGrid account
    subject: subject,
    text: text,
    html: html,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
  }
};

module.exports = sendEmail;
