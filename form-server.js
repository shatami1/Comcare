const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'AccentGV@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password-here'
    }
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message, subscribe, privacy } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !subject || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!privacy) {
            return res.status(400).json({ error: 'Must agree to privacy policy' });
        }

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'AccentGV@gmail.com',
            to: process.env.EMAIL_USER || 'AccentGV@gmail.com',
            subject: `New Contact Form Submission: ${subject}`,
            html: `
                <h3>New Contact Message</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <p><strong>Subscribe to Updates:</strong> ${subscribe ? 'Yes' : 'No'}</p>
                <hr>
                <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
            `
        };

        await transporter.sendMail(mailOptions);

        // Send success response
        return res.json({ success: true, message: 'Form submitted successfully' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Failed to submit form', details: error.message });
    }
});

// Booking form endpoint
app.post('/api/booking', async (req, res) => {
    try {
        const {
            equipmentType, rentalDays, startDate, deliveryDate,
            fullName, phone, email, zipCode, address, specialRequests, terms
        } = req.body;

        // Validate required fields
        if (!equipmentType || !rentalDays || !startDate || !deliveryDate ||
            !fullName || !phone || !email || !zipCode || !address || !terms) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_USER || 'AccentGV@gmail.com',
            to: process.env.EMAIL_USER || 'AccentGV@gmail.com',
            subject: `New Booking Request: ${equipmentType}`,
            html: `
                <h3>New Booking Request</h3>
                <p><strong>Equipment Type:</strong> ${equipmentType}</p>
                <p><strong>Rental Duration:</strong> ${rentalDays} days</p>
                <p><strong>Start Date:</strong> ${startDate}</p>
                <p><strong>Delivery/Return Date:</strong> ${deliveryDate}</p>
                <p><strong>Full Name:</strong> ${fullName}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Zip Code:</strong> ${zipCode}</p>
                <p><strong>Address:</strong> ${address}</p>
                <p><strong>Special Requests:</strong> ${specialRequests || 'None'}</p>
                <hr>
                <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: 'Booking submitted successfully' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Failed to submit booking', details: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Form server running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Form server running on http://localhost:${PORT}`);
});
