// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// DOM Elements
const whatsappForm = document.getElementById('whatsappForm');
const phoneNumberInput = document.getElementById('phoneNumber');
const messageInput = document.getElementById('message');
const sendButton = document.querySelector('button[type="submit"]');
const charCountEl = document.getElementById('charCount');
const statusEl = document.getElementById('status');

// Format phone number (remove all non-numeric characters except +)
function formatPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters except +
    return phoneNumber.replace(/[^0-9+]/g, '');
}

// Validate phone number (basic validation)
function isValidPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    // Check if the number has at least 8 digits (minimum for a valid phone number)
    return cleaned.length >= 8;
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    // Get form values
    let phoneNumber = phoneNumberInput.value.trim();
    const message = messageInput.value.trim();
    
    // Format phone number (remove all non-numeric characters except +)
    phoneNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Validate inputs
    if (!phoneNumber) {
        showAlert('Please enter a phone number', 'danger');
        phoneNumberInput.focus();
        return;
    }
    
    if (!isValidPhoneNumber(phoneNumber)) {
        showAlert('Please enter a valid phone number with country code', 'warning');
        phoneNumberInput.focus();
        return;
    }
    
    if (!message) {
        showAlert('Please enter a message', 'warning');
        messageInput.focus();
        return;
    }
    
    // Show loading state
    const originalButtonText = sendButton.innerHTML;
    sendButton.disabled = true;
    sendButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';
    
    try {
        // Remove + from phone number for the API
        const apiPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
        
        // Send the message via our backend
        const response = await fetch(`${API_BASE_URL}/api/send-whatsapp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: apiPhoneNumber,
                message: message
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showAlert('WhatsApp message sent successfully!', 'success');
            whatsappForm.reset();
            updateCharCount();
        } else {
            // Fallback to web method if API fails
            console.warn('API failed, falling back to web method');
            fallbackToWebWhatsApp(phoneNumber, message);
        }
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        // Fallback to web method on error
        fallbackToWebWhatsApp(phoneNumber, message);
    } finally {
        // Reset button state
        sendButton.disabled = false;
        sendButton.innerHTML = originalButtonText;
    }
}

// Fallback to web WhatsApp if API fails
function fallbackToWebWhatsApp(phoneNumber, message) {
    try {
        // Format the phone number for WhatsApp (remove + if present and add country code if missing)
        let formattedNumber = phoneNumber;
        if (!formattedNumber.startsWith('+')) {
            // Default to US country code if not specified
            formattedNumber = '1' + formattedNumber;
        } else {
            // Remove the + for the URL
            formattedNumber = formattedNumber.substring(1);
        }
        
        // Encode the message for URL
        const encodedMessage = encodeURIComponent(message);
        
        // Show info message about fallback
        showAlert('Opening WhatsApp Web as a fallback...', 'info');
        
        // Open WhatsApp Web with the message
        window.open(`https://web.whatsapp.com/send?phone=${formattedNumber}&text=${encodedMessage}`, '_blank');
        
        // Reset the form
        whatsappForm.reset();
        updateCharCount();
    } catch (error) {
        console.error('Error in fallback method:', error);
        showAlert('Failed to send message. Please try again.', 'danger');
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    // Remove any existing alerts
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertDiv.role = 'alert';
    
    // Add icon based on alert type
    let icon = '';
    switch(type) {
        case 'success':
            icon = 'check-circle';
            break;
        case 'danger':
            icon = 'exclamation-circle';
            break;
        case 'warning':
            icon = 'exclamation-triangle';
            break;
        default:
            icon = 'info-circle';
    }
    
    alertDiv.innerHTML = `
        <i class="fas fa-${icon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insert alert after the form
    whatsappForm.parentNode.insertBefore(alertDiv, whatsappForm.nextSibling);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 5000);
}

// Add input mask for phone number (optional)
phoneNumberInput.addEventListener('input', function(e) {
    // Remove any non-numeric characters
    let value = e.target.value.replace(/[^0-9+]/g, '');
    
    // Limit to 15 digits (max for international numbers)
    if (value.length > 15) {
        value = value.substring(0, 15);
    }
    
    e.target.value = value;
});

// Add country code suggestion
phoneNumberInput.addEventListener('focus', function() {
    if (!this.value) {
        // Show a small tooltip or placeholder with common country codes
        this.placeholder = 'e.g., 911234567890 (India: 91)';
    }
});

// Update character count
function updateCharCount() {
    const charCount = messageInput.value.length;
    charCountEl.textContent = `Characters: ${charCount}/2048`;
}

// Check API status
async function checkApiStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (response.ok) {
            console.log('Connected to messaging API');
            return true;
        }
    } catch (error) {
        console.warn('Could not connect to messaging API, will use fallback methods');
    }
    return false;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('WhatsApp Integration initialized');
    
    // Check API status
    const isApiAvailable = await checkApiStatus();
    if (!isApiAvailable) {
        showAlert('Note: Using fallback method. Some features may be limited.', 'warning');
    }
    
    // Add form submission handler
    whatsappForm.addEventListener('submit', handleSubmit);
    
    // Update character count when message changes
    messageInput.addEventListener('input', updateCharCount);
    
    // Focus on phone number field when page loads
    phoneNumberInput.focus();
    
    // Initialize character count
    updateCharCount();
});
