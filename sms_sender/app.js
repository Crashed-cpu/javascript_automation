// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// DOM Elements
const smsForm = document.getElementById('smsForm');
const phoneNumberInput = document.getElementById('phoneNumber');
const messageInput = document.getElementById('message');
const charCountEl = document.getElementById('charCount');
const messageCountEl = document.getElementById('messageCount');
const sendButton = document.querySelector('button[type="submit"]');

// Constants
const STANDARD_SMS_LIMIT = 160;
const UNICODE_SMS_LIMIT = 70;
const CONCATENATED_SMS_LIMIT = 153;

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

// Check if message contains Unicode characters
function hasUnicode(str) {
    for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 255) return true;
    }
    return false;
}

// Calculate message parts
function calculateMessageParts(message) {
    const hasUnicodeChars = hasUnicode(message);
    const charLimit = hasUnicodeChars ? UNICODE_SMS_LIMIT : STANDARD_SMS_LIMIT;
    const concatenatedLimit = hasUnicodeChars ? UNICODE_SMS_LIMIT : CONCATENATED_SMS_LIMIT;
    
    if (message.length <= charLimit) {
        return 1;
    } else {
        return Math.ceil(message.length / concatenatedLimit);
    }
}

// Update character and message count
function updateCounters() {
    const message = messageInput.value;
    const charCount = message.length;
    const messageCount = calculateMessageParts(message);
    
    charCountEl.textContent = charCount;
    messageCountEl.textContent = messageCount;
    
    // Update character counter color based on limit
    const charLimit = hasUnicode(message) ? UNICODE_SMS_LIMIT : STANDARD_SMS_LIMIT;
    if (charCount > charLimit * 3) {
        charCountEl.classList.add('text-danger');
        charCountEl.classList.remove('text-warning');
    } else if (charCount > charLimit) {
        charCountEl.classList.add('text-warning');
        charCountEl.classList.remove('text-danger');
    } else {
        charCountEl.classList.remove('text-warning', 'text-danger');
    }
}

// Check if the device is Windows
function isWindows() {
    return navigator.platform.indexOf('Win') > -1;
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    // Get form values
    let phoneNumber = phoneNumberInput.value.trim();
    const message = messageInput.value.trim();
    
    // Format phone number
    phoneNumber = formatPhoneNumber(phoneNumber);
    
    // Validate inputs
    if (!phoneNumber) {
        showAlert('Please enter a phone number', 'danger');
        phoneNumberInput.focus();
        return;
    }
    
    if (!isValidPhoneNumber(phoneNumber)) {
        showAlert('Please enter a valid phone number', 'warning');
        phoneNumberInput.focus();
        return;
    }
    
    if (!message) {
        showAlert('Please enter a message', 'warning');
        messageInput.focus();
        return;
    }
    
    try {
        // Disable the send button and show loading state
        const originalButtonText = sendButton.innerHTML;
        sendButton.disabled = true;
        sendButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sending...';
        
        // Send the message via our backend
        const response = await fetch(`${API_BASE_URL}/api/send-sms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: phoneNumber,
                message: message
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showAlert('Message sent successfully!', 'success');
            smsForm.reset();
            updateCounters();
        } else {
            throw new Error(result.error || 'Failed to send message');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showAlert(`Error: ${error.message}`, 'danger');
    } finally {
        // Re-enable the send button
        sendButton.disabled = false;
        sendButton.innerHTML = '<i class="fas fa-paper-plane me-2"></i> Send SMS';
    }
}

// Show options for Windows users (fallback if API fails)
function showWindowsOptions(phoneNumber, message) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="windowsOptionsModal" tabindex="-1" aria-labelledby="windowsOptionsModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="windowsOptionsModalLabel"><i class="fas fa-mobile-alt me-2"></i>Alternative Send Options</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Message could not be sent directly. Try these alternatives:</p>
                        <div class="d-grid gap-2">
                            <a href="https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}" 
                               class="btn btn-primary" target="_blank">
                                <i class="fab fa-whatsapp me-2"></i> Open WhatsApp Web
                            </a>
                            <a href="sms:${phoneNumber}?body=${encodeURIComponent(message)}" 
                               class="btn btn-success">
                                <i class="fas fa-sms me-2"></i> Open Default SMS App
                            </a>
                            <button class="btn btn-outline-secondary" id="copyMessageBtn">
                                <i class="far fa-copy me-2"></i> Copy Message to Clipboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to the page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('windowsOptionsModal'));
    modal.show();
    
    // Add event listener for copy button
    document.getElementById('windowsOptionsModal').addEventListener('shown.bs.modal', function() {
        const copyBtn = document.getElementById('copyMessageBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(message);
                    showAlert('Message copied to clipboard!', 'success');
                } catch (err) {
                    console.error('Failed to copy:', err);
                    showAlert('Failed to copy message to clipboard', 'danger');
                }
            });
        }
    });
}

// Fallback function to send SMS using device capabilities
function sendSMS(phoneNumber, message) {
    // This is now a fallback method that will be used if the API fails
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    
    // Try to open the SMS app
    const link = document.createElement('a');
    link.href = smsUrl;
    link.click();
    
    // Show success message
    showAlert('Opening your default SMS app...', 'info');
    
    // Reset the form
    smsForm.reset();
    updateCounters();
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
    smsForm.parentNode.insertBefore(alertDiv, smsForm.nextSibling);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 5000);
}

// Add input mask for phone number
phoneNumberInput.addEventListener('input', function(e) {
    // Remove any non-numeric characters except +
    let value = e.target.value.replace(/[^0-9+]/g, '');
    
    // Limit to 15 digits (max for international numbers)
    if (value.length > 15) {
        value = value.substring(0, 15);
    }
    
    e.target.value = value;
});

// Add character counter for message
messageInput.addEventListener('input', updateCounters);

// Add country code suggestion
phoneNumberInput.addEventListener('focus', function() {
    if (!this.value) {
        // Show a small tooltip or placeholder with common country codes
        this.placeholder = 'e.g., 14155552671 (US/Canada: 1)';
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('SMS Sender initialized');
    
    try {
        // Check if the API is available
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (!response.ok) {
            throw new Error('API not available');
        }
        console.log('Connected to messaging API');
    } catch (error) {
        console.warn('Could not connect to messaging API, using fallback methods');
        showAlert('Note: Using fallback messaging methods. Some features may be limited.', 'warning');
    }
    
    // Add form submission handler
    smsForm.addEventListener('submit', handleSubmit);
    
    // Focus on phone number field when page loads
    phoneNumberInput.focus();
    
    // Initialize counters
    updateCounters();
    
    // Add Windows-specific instructions
    if (isWindows()) {
        const helpLink = document.querySelector('[data-bs-target="#helpModal"]');
        if (helpLink) {
            helpLink.insertAdjacentHTML('afterend', 
                ' <span class="badge bg-warning text-dark ms-2">Windows User?</span>');
        }
    }
});
