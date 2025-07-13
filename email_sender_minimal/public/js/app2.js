// Initialize EmailJS with your public key
// Replace 'YOUR_PUBLIC_KEY' with your actual EmailJS public key
(function() {
    emailjs.init({
        publicKey: 'YOUR_PUBLIC_KEY',
        blockHeadless: true,
        blockList: {
            // Block all domains except the ones in the allow list
            'blockList': {
                'display': 'none',
                'iframe': 'https://your-domain.com/emailjs-blocked.html',
                'url': 'https://your-domain.com/emailjs-blocked.html'
            }
        },
        limitRate: {
            // Set the limit rate for the public key
            throttle: 10000, // 10 seconds
            throttle_interval: 60000 // 1 minute
        }
    });
})();

// DOM Elements
const emailForm = document.getElementById('emailForm');
const sendBtn = document.getElementById('sendBtn');
const spinner = document.getElementById('spinner');
const btnText = document.getElementById('btnText');
const statusMessage = document.getElementById('statusMessage');

// Form submission handler
document.getElementById('emailForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const toEmail = document.getElementById('toEmail').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();
    
    // Validate email
    if (!isValidEmail(toEmail)) {
        showStatus('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    sendBtn.disabled = true;
    spinner.classList.remove('d-none');
    btnText.textContent = 'Sending...';
    
    // Prepare email parameters
    const templateParams = {
        to_email: toEmail,
        subject: subject,
        message: message,
        from_name: 'Minimal Email Sender',
        reply_to: 'noreply@example.com'
    };
    
    // Send email using EmailJS
    // Replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' with your actual EmailJS service and template IDs
    emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
        .then(function(response) {
            console.log('SUCCESS!', response.status, response.text);
            showStatus('Email sent successfully!', 'success');
            emailForm.reset();
        })
        .catch(function(error) {
            console.error('FAILED...', error);
            showStatus('Failed to send email. Please try again later.', 'error');
        })
        .finally(function() {
            // Reset button state
            sendBtn.disabled = false;
            spinner.classList.add('d-none');
            btnText.textContent = 'Send Email';
        });
});

// Helper function to validate email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Helper function to show status messages
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}

// Add input event listeners to hide status message when user starts typing
const formInputs = document.querySelectorAll('#emailForm input, #emailForm textarea');
formInputs.forEach(input => {
    input.addEventListener('input', () => {
        if (statusMessage.style.display === 'block') {
            statusMessage.style.display = 'none';
        }
    });
});
