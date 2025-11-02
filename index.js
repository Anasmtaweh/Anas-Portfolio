require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

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

// Stable CV download URL that serves the latest CV PDF in /public
function resolveLatestCV() {
    try {
        const dir = path.join(__dirname, 'public');
        const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.pdf'));
        if (!files.length) return null;
        // Prefer filenames that look like CVs
        const preferred = files.filter(f => /cv|curriculum|anas/i.test(f));
        const candidates = preferred.length ? preferred : files;
        const withTimes = candidates.map(fn => ({ fn, mtime: fs.statSync(path.join(dir, fn)).mtimeMs }));
        withTimes.sort((a, b) => b.mtime - a.mtime);
        return path.join(dir, withTimes[0].fn);
    } catch (e) {
        return null;
    }
}

app.get('/cv.pdf', (req, res) => {
    const latestCVPath = resolveLatestCV();
    if (!latestCVPath) {
        return res.status(404).send('CV not found');
    }
    res.set('Cache-Control', 'no-store'); // Always fetch latest from server
    // Force a friendly filename for download
    res.download(latestCVPath, 'Anas_Mtaweh_CV.pdf');
});

// Convenience redirect from /cv to the downloadable file
app.get('/cv', (req, res) => {
    res.redirect(302, '/cv.pdf');
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
        service: 'gmail', // Or your preferred email provider (e.g., 'hotmail', 'yahoo')
                          // Ensure your provider allows SMTP access or check their API.
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
        await transporter.sendMail(mailOptions);
        // console.log('Email sent successfully');
        res.status(200).json({ success: true, message: 'Message sent successfully! Thank you.' });
    } catch (error) {
        console.error('Error sending email:', error);
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
