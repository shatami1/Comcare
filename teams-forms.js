// Teams Form Submission Handler
// Update TEAMS_WEBHOOK_URL with your actual Teams webhook

const TEAMS_WEBHOOK_URL = 'https://outlook.webhook.office.com/webhookb2/YOUR_WEBHOOK_URL_HERE';

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
        
        // Build Teams Card
        const teamsPayload = {
            "@type": "MessageCard",
            "@context": "https://schema.org/extensions",
            "summary": "New Contact Message from ComfortCare",
            "themeColor": "0078D4",
            "sections": [
                {
                    "activityTitle": "📬 New Contact Message",
                    "activitySubtitle": `From: ${formData.name}`,
                    "facts": [
                        { "name": "Name:", "value": formData.name },
                        { "name": "Email:", "value": formData.email },
                        { "name": "Phone:", "value": formData.phone },
                        { "name": "Subject:", "value": formData.subject },
                        { "name": "Subscribe:", "value": formData.subscribe },
                        { "name": "Submitted:", "value": new Date().toLocaleString() }
                    ]
                },
                {
                    "activityTitle": "Message",
                    "text": formData.message
                }
            ]
        };
        
        try {
            const response = await fetch(TEAMS_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teamsPayload)
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
        
        // Build Teams Card
        const teamsPayload = {
            "@type": "MessageCard",
            "@context": "https://schema.org/extensions",
            "summary": "New Booking Request from ComfortCare",
            "themeColor": "0078D4",
            "sections": [
                {
                    "activityTitle": "📋 New Booking Request",
                    "activitySubtitle": `Equipment: ${formData.equipmentType}`,
                    "facts": [
                        { "name": "Equipment:", "value": formData.equipmentType },
                        { "name": "Duration:", "value": `${formData.rentalDays} days` },
                        { "name": "Start Date:", "value": formData.startDate },
                        { "name": "Delivery/Return:", "value": formData.deliveryDate },
                        { "name": "Customer:", "value": formData.fullName },
                        { "name": "Email:", "value": formData.email },
                        { "name": "Phone:", "value": formData.phone },
                        { "name": "Zip Code:", "value": formData.zipCode },
                        { "name": "Address:", "value": formData.address },
                        { "name": "Submitted:", "value": new Date().toLocaleString() }
                    ]
                },
                {
                    "activityTitle": "Special Requests",
                    "text": formData.specialRequests || "None"
                }
            ]
        };
        
        try {
            const response = await fetch(TEAMS_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(teamsPayload)
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
