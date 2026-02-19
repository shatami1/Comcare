// Telegram Form Submission Handler
// Update these values with your Telegram bot credentials

const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; // Get from @BotFather
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID_HERE';     // Your Telegram chat ID

// Contact Form Handler
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value,
            subscribe: document.querySelector('input[name="subscribe"]:checked') ? 'Yes' : 'No'
        };
        
        // Build message
        const telegramMessage = `
📬 <b>New Contact Message</b>

<b>Name:</b> ${escapeHtml(formData.name)}
<b>Email:</b> ${escapeHtml(formData.email)}
<b>Phone:</b> ${escapeHtml(formData.phone)}
<b>Subject:</b> ${escapeHtml(formData.subject)}

<b>Message:</b>
${escapeHtml(formData.message)}

<b>Subscribe:</b> ${formData.subscribe}
<b>Time:</b> ${new Date().toLocaleString()}
        `.trim();
        
        try {
            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: telegramMessage,
                    parse_mode: 'HTML'
                })
            });
            
            if (response.ok) {
                alert('✓ Message sent! Thank you for contacting us. We\'ll get back to you soon.');
                window.location.href = 'thank-you.html';
            } else {
                throw new Error('Send failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error sending message. Please try again.');
        }
    });
}

// Booking Form Handler
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            equipmentType: document.getElementById('equipmentType').value,
            rentalDays: document.getElementById('rentalDays').value,
            startDate: document.getElementById('startDate').value,
            deliveryDate: document.getElementById('deliveryDate').value,
            fullName: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            zipCode: document.getElementById('zipCode').value,
            address: document.getElementById('address').value,
            specialRequests: document.getElementById('specialRequests').value
        };
        
        // Build message
        const telegramMessage = `
📋 <b>New Booking Request</b>

<b>Equipment:</b> ${escapeHtml(formData.equipmentType)}
<b>Duration:</b> ${formData.rentalDays} days
<b>Start Date:</b> ${formData.startDate}
<b>Delivery/Return:</b> ${formData.deliveryDate}

<b>Customer Name:</b> ${escapeHtml(formData.fullName)}
<b>Email:</b> ${escapeHtml(formData.email)}
<b>Phone:</b> ${escapeHtml(formData.phone)}
<b>Zip Code:</b> ${escapeHtml(formData.zipCode)}
<b>Address:</b> ${escapeHtml(formData.address)}

<b>Special Requests:</b>
${formData.specialRequests ? escapeHtml(formData.specialRequests) : 'None'}

<b>Time:</b> ${new Date().toLocaleString()}
        `.trim();
        
        try {
            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: telegramMessage,
                    parse_mode: 'HTML'
                })
            });
            
            if (response.ok) {
                alert('✓ Booking submitted! We\'ll confirm your reservation shortly.');
                window.location.href = 'thank-you.html';
            } else {
                throw new Error('Send failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error submitting booking. Please try again.');
        }
    });
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
