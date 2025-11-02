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

// Resolve Mishtika URL from env or use a reliable fallback
function getMishtikaUrl() {
    const envUrl = process.env.MISHTIKA_URL;
    const fallbackUrl = 'https://pet-ai-render.onrender.com';
    if (envUrl && /^https?:\/\//i.test(envUrl)) return envUrl;
    return fallbackUrl;
}

// Redirect helper for external project demos (configurable by env, with fallback)
app.get('/r/mishtika', (req, res) => {
    const url = getMishtikaUrl();
    return res.redirect(302, url);
});

// Basic strict email validation that rejects quoted local-parts and tricky constructs
function isValidEmailStrict(input) {
    if (typeof input !== 'string') return false;
    const email = input.trim();
    if (!email || email.length > 254) return false;
    // Disallow characters that enable header injection or quoted local-parts
    if (/["()<>\\,;:\s]/.test(email)) return false; // quotes, spaces, and specials
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local || !domain) return false;
    // Local-part: allow common unquoted atoms
    if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return false;
    // Domain: labels 1-63 chars, no leading/trailing hyphen, at least one dot, TLD >= 2
    const labels = domain.split('.');
    if (labels.length < 2) return false;
    if (!labels.every(l => /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/.test(l))) return false;
    if (labels[labels.length - 1].length < 2) return false;
    return true;
}

app.post('/submit-contact-form', async (req, res) => {
    const { name, email, inquiryType, message } = req.body;

    if (!name || !email || !inquiryType || !message) {
        return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    // Validate reply-to address strictly to avoid misrouting via tricky quoted local-parts
    if (!isValidEmailStrict(email)) {
        return res.status(400).json({ success: false, error: 'Please provide a valid email address (no quotes, spaces, or special characters).' });
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
        from: `"${(name || '').toString().replace(/[\r\n]/g, ' ').slice(0, 128)}" <${process.env.EMAIL_USER}>`, // safe display name
        replyTo: email, // header-only, after strict validation
        to: process.env.YOUR_RECEIVING_EMAIL,      // header: stays constant for display
        envelope: {                                // SMTP envelope: authoritative recipients
            from: process.env.EMAIL_USER,
            to: [process.env.YOUR_RECEIVING_EMAIL]
        },
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
    const latestCVPath = resolveLatestCV();
    const cvName = latestCVPath ? path.basename(latestCVPath) : 'none';
    console.log(`Server running on http://localhost:${port}`);
    console.log(`[startup] CV selected for /cv.pdf: ${cvName}`);
    console.log(`[startup] Mishtika redirect: ${getMishtikaUrl()}`);
});
