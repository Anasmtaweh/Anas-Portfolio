require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/submit-contact-form', async (req, res) => {
    const { name, email, inquiryType, message } = req.body;

    if (!name || !email || !inquiryType || !message) {
        return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    // Configure nodemailer
    // IMPORTANT: Use environment variables for sensitive data like email credentials
    // For production, consider dedicated email services like SendGrid, Mailgun, or AWS SES
    // if they offer better reliability or features for your needs.
    const transporter = nodemailer.createTransport({
        service: 'hotmail',
        auth: {
            user: process.env.EMAIL_USER, // Your email address from .env
            pass: process.env.EMAIL_PASS  // Your email password or app-specific password from .env
        },
        // For some providers, you might need to enable "Less secure app access"
        // or use App Passwords (recommended for Gmail).
        // tls: {
        //     rejectUnauthorized: false // Use only for development/testing if you have self-signed certs
        // }
    });

    const mailOptions = {
        from: `"${name}" <${process.env.EMAIL_USER}>`, // Sender address (can be your email if provider restricts 'from')
        replyTo: email, // Set the reply-to to the user's email
        to: process.env.YOUR_RECEIVING_EMAIL,      // List of receivers (your email from .env)
        subject: `Portfolio Inquiry: ${inquiryType} from ${name}`, // Subject line
        text: `You have a new inquiry from your portfolio website:
        
Name: ${name}
Email: ${email}
Type of Inquiry: ${inquiryType}
Message:
${message}`, // Plain text body
        html: `<p>You have a new inquiry from your portfolio website:</p>
               <ul>
                 <li><strong>Name:</strong> ${name}</li>
                 <li><strong>Email:</strong> ${email}</li>
                 <li><strong>Type of Inquiry:</strong> ${inquiryType}</li>
               </ul>
               <p><strong>Message:</strong></p>
               <p>${message.replace(/\n/g, '<br>')}</p>` // HTML body
    };

    try {
        // Log the environment variables being used (for debugging only, remove in production)
        console.log('Attempting to send email with:');
        console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'NOT SET');
        console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'NOT SET');
        console.log('YOUR_RECEIVING_EMAIL:', process.env.YOUR_RECEIVING_EMAIL ? 'Set' : 'NOT SET');

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', process.env.YOUR_RECEIVING_EMAIL);
        res.status(200).json({ success: true, message: 'Message sent successfully! Thank you.' });
    } catch (error) {
        console.error('Error sending email:', error.message);
        console.error('Nodemailer error details:', error); // Log full error object for more details
        // Provide a more generic error to the client for security
        res.status(500).json({ success: false, error: 'Failed to send message. Please try again later or contact me directly.' });
    }
});

// Catch-all for 404 errors (optional, but good practice)
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html')); // Create a 404.html if you want
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});