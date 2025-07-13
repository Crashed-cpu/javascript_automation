// DOM Elements
const emailForm = document.getElementById('emailForm');
const toName = document.getElementById('toName');
const toEmail = document.getElementById('toEmail');
const sendButton = document.getElementById('sendButton');
const statusAlert = document.getElementById('statusAlert');
const statusMessage = document.getElementById('statusMessage');
const spinner = document.getElementById('spinner');

// EmailJS Configuration
const EMAILJS_CONFIG = {
    PUBLIC_KEY: 'qEyllJG2Q3dyk9rH0',  // Replace with your public key
    SERVICE_ID: 'service_0h0c55k',    // Replace with your service ID
    TEMPLATE_ID: 'template_1amtrik'   // Replace with your template ID
};

// Initialize EmailJS
try {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    console.log('EmailJS initialized successfully');
} catch (error) {
    console.error('Failed to initialize EmailJS:', error);
    showStatus('Failed to initialize email service. Please check console for details.', 'danger');
}

// Form submission handler
emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    showStatus('Sending email...', 'info');
    sendButton.disabled = true;
    spinner.style.display = 'inline-block';
    
    try {
        // Prepare email parameters for The Ayush Factor template
        const recipientName = toName.value.trim();
        const templateParams = {
            name: recipientName,  // This will be used in the subject: "Welcome to The Ayush Factor, {{name}}!"
            to_name: recipientName,
            to_email: toEmail.value.trim(),
            from_name: 'The Ayush Factor',
            reply_to: 'your-email@example.com',  // Update this to your email
            // The subject is set in the EmailJS template as: "Welcome to The Ayush Factor, {{name}}!"
            message: `Hello ${recipientName},\n\nThank you for your interest in The Ayush Factor!\n\nBest regards,\nThe Ayush Factor Team`
        };
        
        console.log('Sending email with params:', templateParams);
        
        // Send the email using EmailJS
        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            templateParams
        );
        
        console.log('Email sent successfully:', response);
        showStatus('Email sent successfully!', 'success');
        
        // Reset the form
        emailForm.reset();
        
    } catch (error) {
        console.error('Error sending email:', error);
        let errorMessage = 'Failed to send email';
        
        // More specific error messages
        if (error.status === 0) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.status >= 400 && error.status < 500) {
            errorMessage = 'Invalid request. Please check your EmailJS configuration.';
        } else if (error.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
        }
        
        showStatus(`Error: ${errorMessage}`, 'danger');
    } finally {
        sendButton.disabled = false;
        spinner.style.display = 'none';
    }
});

// Show status message
function showStatus(message, type = 'info') {
    // Update status message
    statusMessage.textContent = message;
    
    // Update alert styling
    statusAlert.className = `alert alert-${type} mt-3 mb-0`;
    statusAlert.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusAlert.style.display = 'none';
        }, 5000);
    }
}

// Enable/disable send button based on form validity
emailForm.addEventListener('input', () => {
    const isFormValid = toName.value.trim() !== '' && toEmail.validity.valid;
    sendButton.disabled = !isFormValid;
});
