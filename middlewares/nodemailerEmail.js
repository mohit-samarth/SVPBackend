import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: true, // use true for port 465, false for other ports like 587
  auth: {
    user: 'rohit.jorvekar@svp.edu.in',
    pass: 'yofx ipig disc zuwf',  // make sure this is an app password, not your regular password
  },
  ssl: {
    rejectUnauthorized: false, // helps with certificate issues, though ideally this should be true
  },
});

const sendEmail = async (emailOptions) => {
  try {
    await transporter.sendMail({
      from: 'rohit.jorvekar@svp.edu.in',
      to: emailOptions.to,
      subject: emailOptions.subject,
      text: emailOptions.text,
    });
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Email sending failed');
  }
};

export { sendEmail };