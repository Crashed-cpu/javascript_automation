document.addEventListener('DOMContentLoaded', function() {
    const emailForm = document.getElementById('emailForm');
    const sendButton = document.getElementById('sendButton');
    const fileInput = document.getElementById('attachments');
    const fileList = document.getElementById('fileList');
    
    let toastInstance = null;
    let files = [];
    const MAX_FILES = 5;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    
    // Initialize toast
    function initToast() {
        const toastElement = document.getElementById('toast');
        if (!toastElement) return;
        
        // Remove any existing toast instance
        if (toastInstance) {
            toastInstance.dispose();
        }
        
        // Create new toast instance
        toastInstance = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        
        // Add click handler for close button
        const closeButton = toastElement.querySelector('.btn-close');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                toastInstance.hide();
            });
        }
        
        return toastInstance;
    }
    
    // Show toast notification
    function showToast(title, message, type = 'info') {
        const toastElement = document.getElementById('toast');
        if (!toastElement) return;
        
        // Get or initialize toast elements
        const toastHeader = toastElement.querySelector('.toast-header');
        const toastTitle = toastElement.querySelector('#toast-title');
        const toastMessage = toastElement.querySelector('#toast-message');
        
        if (!toastTitle || !toastMessage) return;
        
        // Reset classes
        toastElement.className = 'toast';
        toastHeader.className = 'toast-header';
        
        // Set type-specific styling
        if (type) {
            const typeClass = type.split(' ')[0];
            toastHeader.classList.add('text-white', typeClass);
        }
        
        // Set content
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        // Initialize or get toast instance
        const toast = initToast();
        if (toast) {
            toast.show();
        }
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Update file list display
    function updateFileList() {
        if (files.length === 0) {
            fileList.innerHTML = 'No files selected';
            return;
        }
        
        fileList.innerHTML = '';
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <span class="file-name" title="${file.name}">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
                <button type="button" class="remove-file" data-index="${index}" title="Remove file">
                    <i class="fas fa-times"></i>
                </button>
            `;
            fileList.appendChild(fileItem);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-file').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                files.splice(index, 1);
                updateFileList();
            });
        });
    }
    
    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        const newFiles = Array.from(e.target.files);
        
        // Check file count limit
        if (files.length + newFiles.length > MAX_FILES) {
            showToast('Error', `You can only upload up to ${MAX_FILES} files`, 'bg-danger text-white');
            return;
        }
        
        // Check file sizes and types
        for (const file of newFiles) {
            if (file.size > MAX_FILE_SIZE) {
                showToast('Error', `File ${file.name} is too large (max ${formatFileSize(MAX_FILE_SIZE)})`, 'bg-danger text-white');
                return;
            }
            
            // Check file type - Allowed MIME types for uploads
            const allowedTypes = [
                // Images
                'image/jpeg', 'image/png', 'image/gif',
                
                // Documents
                'application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain', 'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/msword', 'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                
                // Video formats
                'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv',
                'video/x-matroska', 'video/avi', 'video/webm', 'video/mpeg',
                
                // Audio formats
                'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
                
                // Archives
                'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
                'application/x-tar', 'application/gzip'
            ];
            
            // Also check file extension as a fallback
            const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 
                                    'mp4', 'mov', 'avi', 'wmv', 'mkv', 'webm', 'mpeg', 'mpg',
                                    'mp3', 'wav', 'ogg', 'zip', 'rar', '7z', 'tar', 'gz'];
            
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const isExtensionAllowed = allowedExtensions.includes(fileExtension);
            
            if (!allowedTypes.includes(file.type)) {
                showToast('Error', `File type not supported: ${file.name}`, 'bg-danger text-white');
                return;
            }
            
            files.push(file);
        }
        
        updateFileList();
        fileInput.value = ''; // Reset file input
    });
    
    // Handle form submission
    emailForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const to = document.getElementById('to').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const message = document.getElementById('message').value.trim();
        
        // Basic validation
        if (!to) {
            showToast('Error', 'Please enter a recipient email address', 'bg-danger text-white');
            return;
        }
        
        if (!message) {
            showToast('Error', 'Please enter a message', 'bg-danger text-white');
            return;
        }
        
        // Prepare form data
        const formData = new FormData();
        formData.append('to', to);
        formData.append('subject', subject);
        formData.append('text', message);
        
        // Add files to form data
        files.forEach((file, index) => {
            formData.append('attachments', file);
        });
        
        // Update UI for sending
        sendButton.disabled = true;
        sendButton.classList.add('loading');
        sendButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
        
        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Success', 'Email sent successfully!', 'bg-success text-white');
                emailForm.reset();
                files = [];
                updateFileList();
            } else {
                throw new Error(data.error || 'Failed to send email');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error', error.message || 'Failed to send email. Please try again.', 'bg-danger text-white');
        } finally {
            // Re-enable send button
            sendButton.disabled = false;
            sendButton.classList.remove('loading');
            sendButton.innerHTML = '<i class="fas fa-paper-plane me-1"></i> Send Email';
        }
    });
    
    // Show initial instructions
    showToast('Welcome', 'Fill out the form to send an email with attachments', 'bg-info text-dark');
});
