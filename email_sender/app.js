// DOM Elements
const emailForm = document.getElementById('emailForm');
const toEmail = document.getElementById('toEmail');
const fromName = document.getElementById('fromName');
const subject = document.getElementById('subject');
const message = document.getElementById('message');
const attachment = document.getElementById('attachment');
const sendButton = document.getElementById('sendButton');
const statusAlert = document.getElementById('statusAlert');
const statusMessage = document.getElementById('statusMessage');

// Initialize EmailJS with your public key
// Sign up at https://www.emailjs.com/ to get your own API key
// Make sure to replace these with your actual EmailJS credentials
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
    
    try {
        // Prepare email parameters
        const templateParams = {
            to_email: toEmail.value,
            from_name: fromName.value,
            subject: subject.value,
            message: message.value
        };
        
        // If there's a file attachment
        let attachmentData = null;
        if (attachment.files.length > 0) {
            const file = attachment.files[0];
            
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('File size should not exceed 5MB');
            }
            
            // Read the file as base64
            attachmentData = await readFileAsBase64(file);
            templateParams.attachment = {
                name: file.name,
                data: attachmentData
            };
        }
        
        // Send the email using EmailJS
        console.log('Sending email with params:', templateParams);
        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            templateParams
        );
        console.log('Email sent successfully:', response);
        
        // Show success message
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
        
        showStatus(`Error: ${errorMessage} (${error.status || 'Unknown'})`, 'danger');
    } finally {
        sendButton.disabled = false;
    }
});

// Helper function to read file as base64
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

// Show status message
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    
    // Update alert classes
    statusAlert.className = 'alert';
    
    switch (type) {
        case 'success':
            statusAlert.classList.add('alert-success');
            break;
        case 'danger':
            statusAlert.classList.add('alert-danger');
            break;
        case 'info':
        default:
            statusAlert.classList.add('alert-info');
    }
    
    // Show the alert
    statusAlert.classList.remove('d-none');
    
    // Auto-hide after 5 seconds for success/error messages
    if (type !== 'info') {
        setTimeout(() => {
            statusAlert.classList.add('d-none');
        }, 5000);
    }
}

// Form validation
emailForm.addEventListener('input', () => {
    // Check if all required fields are filled
    const isFormValid = toEmail.value && fromName.value && subject.value && message.value;
    
    // Update button state
    sendButton.disabled = !isFormValid;
});

// Show file name when a file is selected
attachment.addEventListener('change', () => {
    const fileName = attachment.files[0]?.name || 'No file chosen';
    const fileSize = attachment.files[0] ? ` (${formatFileSize(attachment.files[0].size)})` : '';
    
    // Update the file input label
    const label = attachment.nextElementSibling;
    if (label && label.tagName === 'LABEL') {
        label.textContent = fileName + fileSize;
    }
});

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
