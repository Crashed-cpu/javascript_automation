// Gmail API Configuration
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const API_KEY = 'YOUR_GOOGLE_API_KEY';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';

// Global variables
let tokenClient;
let gapiInited = false;
let gisInited = false;
let editor;
let currentUser = null;
let currentFolder = 'inbox';
let selectedEmailId = null;
let emails = [];

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the rich text editor
    initEditor();
    
    // Initialize Google API client
    gapi.load('client', initializeGapiClient);
    
    // Initialize Google Identity Services client
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    
    // Set up event listeners
    setupEventListeners();
    
    // Check if user is already signed in
    const savedUser = localStorage.getItem('gmail_user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            updateUIAfterSignIn(currentUser);
        } catch (e) {
            console.error('Error parsing saved user data:', e);
            localStorage.removeItem('gmail_user');
        }
    }
});

// Initialize the rich text editor
function initEditor() {
    const toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'header': 1 }, { 'header': 2 }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'direction': 'rtl' }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'font': [] }],
        [{ 'align': [] }],
        ['clean'],
        ['link', 'image']
    ];

    editor = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: toolbarOptions
        },
        placeholder: 'Compose your email here...'
    });
}

// Initialize Google API client
async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        maybeEnableButtons();
    } catch (error) {
        console.error('Error initializing GAPI client:', error);
        showToast('Failed to initialize Gmail API', 'error');
    }
}

// Check if both clients are initialized and enable buttons if so
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('signInButton').disabled = false;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Sign in/out buttons
    document.getElementById('signInButton').addEventListener('click', handleAuthClick);
    document.getElementById('signOutButton').addEventListener('click', handleSignoutClick);
    
    // Compose email
    document.getElementById('composeButton').addEventListener('click', showComposeModal);
    
    // Folder navigation
    document.querySelectorAll('[data-folder]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const folder = e.currentTarget.getAttribute('data-folder');
            loadEmails(folder);
            
            // Update active state
            document.querySelectorAll('[data-folder]').forEach(el => {
                el.classList.remove('active');
            });
            e.currentTarget.classList.add('active');
        });
    });
    
    // Compose modal buttons
    document.getElementById('sendButton').addEventListener('click', sendEmail);
    document.getElementById('saveDraftButton').addEventListener('click', saveDraft);
    
    // Attachment handling
    document.getElementById('attachmentInput').addEventListener('change', handleFileSelect);
    
    // Search
    document.getElementById('searchEmails').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filterEmails(query);
    });
}

// Handle sign in
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw resp;
        }
        
        // Get user info
        try {
            const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    'Authorization': `Bearer ${gapi.client.getToken().access_token}`
                }
            }).then(res => res.json());
            
            currentUser = {
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                token: gapi.client.getToken()
            };
            
            // Save user data to localStorage
            localStorage.setItem('gmail_user', JSON.stringify(currentUser));
            
            // Update UI
            updateUIAfterSignIn(currentUser);
            
            // Load emails
            loadEmails('inbox');
            
        } catch (error) {
            console.error('Error getting user info:', error);
            showToast('Failed to get user information', 'error');
        }
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

// Handle sign out
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        
        // Clear user data
        currentUser = null;
        localStorage.removeItem('gmail_user');
        
        // Update UI
        updateUIAfterSignOut();
        
        showToast('Successfully signed out', 'success');
    }
}

// Update UI after sign in
function updateUIAfterSignIn(user) {
    document.getElementById('signInButton').classList.add('d-none');
    document.getElementById('signOutButton').classList.remove('d-none');
    
    const userInfoElement = document.getElementById('userInfo');
    userInfoElement.classList.remove('d-none');
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userImage').src = user.picture;
    
    // Enable compose button
    document.getElementById('composeButton').disabled = false;
    
    // Show welcome message
    showToast(`Welcome, ${user.name}!`, 'success');
}

// Update UI after sign out
function updateUIAfterSignOut() {
    document.getElementById('signInButton').classList.remove('d-none');
    document.getElementById('signOutButton').classList.add('d-none');
    document.getElementById('userInfo').classList.add('d-none');
    
    // Clear email list and view
    document.getElementById('emailList').innerHTML = `
        <div class="text-center p-5 text-muted" id="noEmails">
            <i class="fas fa-inbox fa-3x mb-3"></i>
            <p>Sign in to view your emails</p>
        </div>
    `;
    
    document.getElementById('emailSubject').textContent = 'Welcome to Gmail Integration';
    document.getElementById('emailBody').innerHTML = `
        <p>Welcome to Gmail Integration! Sign in with your Google account to start sending and receiving emails.</p>
    `;
    
    // Disable compose button
    document.getElementById('composeButton').disabled = true;
}

// Show compose modal
function showComposeModal() {
    const modal = new bootstrap.Modal(document.getElementById('composeModal'));
    modal.show();
    
    // Clear form
    document.getElementById('composeForm').reset();
    editor.root.innerHTML = '';
    document.getElementById('attachmentList').innerHTML = '';
    
    // Set focus to the "To" field
    setTimeout(() => {
        document.getElementById('toInput').focus();
    }, 500);
}

// Send email
async function sendEmail() {
    const to = document.getElementById('toInput').value.trim();
    const subject = document.getElementById('subjectInput').value.trim();
    const body = editor.root.innerHTML;
    
    if (!to) {
        showToast('Please enter a recipient email', 'error');
        return;
    }
    
    if (!body) {
        showToast('Please enter a message', 'error');
        return;
    }
    
    try {
        showLoading(true);
        
        // Create email content
        const emailContent = [
            `To: ${to}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${subject || '(No subject)'}`,
            '',
            body
        ].join('\n');
        
        // Encode the email
        const encodedEmail = btoa(emailContent)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        
        // Send the email
        await gapi.client.gmail.users.messages.send({
            'userId': 'me',
            'resource': {
                'raw': encodedEmail
            }
        });
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('composeModal'));
        modal.hide();
        
        showToast('Email sent successfully!', 'success');
        
        // Refresh the sent folder
        if (currentFolder === 'sent') {
            loadEmails('sent');
        }
        
    } catch (error) {
        console.error('Error sending email:', error);
        showToast('Failed to send email', 'error');
    } finally {
        showLoading(false);
    }
}

// Save draft
async function saveDraft() {
    const to = document.getElementById('toInput').value.trim();
    const subject = document.getElementById('subjectInput').value.trim();
    const body = editor.root.innerHTML;
    
    if (!to && !subject && !body) {
        showToast('Draft is empty', 'info');
        return;
    }
    
    try {
        showLoading(true);
        
        // Create email content
        const emailContent = [
            `To: ${to}`,
            'Content-Type: text/html; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${subject || '(No subject)'}`,
            '',
            body
        ].join('\n');
        
        // Encode the email
        const encodedEmail = btoa(emailContent)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        
        // Save as draft
        await gapi.client.gmail.users.drafts.create({
            'userId': 'me',
            'resource': {
                'message': {
                    'raw': encodedEmail
                }
            }
        });
        
        showToast('Draft saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving draft:', error);
        showToast('Failed to save draft', 'error');
    } finally {
        showLoading(false);
    }
}

// Handle file selection for attachments
function handleFileSelect(event) {
    const files = event.target.files;
    const attachmentList = document.getElementById('attachmentList');
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileSize = (file.size / 1024 / 1024).toFixed(2); // Convert to MB
        
        if (fileSize > 25) {
            showToast(`File ${file.name} is too large (max 25MB)`, 'error');
            continue;
        }
        
        const attachmentItem = document.createElement('div');
        attachmentItem.className = 'attachment-item';
        attachmentItem.innerHTML = `
            <i class="fas fa-paperclip me-1"></i>
            ${file.name} (${fileSize}MB)
            <span class="remove-attachment" data-filename="${file.name}">
                <i class="fas fa-times"></i>
            </span>
        `;
        
        attachmentList.appendChild(attachmentItem);
    }
    
    // Clear the file input
    event.target.value = '';
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-attachment').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            button.parentElement.remove();
        });
    });
}

// Load emails for the selected folder
async function loadEmails(folder) {
    if (!currentUser) return;
    
    try {
        showLoading(true);
        currentFolder = folder;
        
        // In a real app, you would fetch emails from the Gmail API
        // For now, we'll just show a message
        const emailList = document.getElementById('emailList');
        emailList.innerHTML = `
            <div class="text-center p-5 text-muted">
                <i class="fas fa-inbox fa-3x mb-3"></i>
                <p>Loading ${folder}...</p>
            </div>
        `;
        
        // Simulate API call
        setTimeout(() => {
            // In a real app, you would process the API response here
            // For now, we'll just show some sample data
            emails = [
                {
                    id: '1',
                    subject: 'Welcome to Gmail Integration',
                    from: 'support@example.com',
                    fromName: 'Support Team',
                    preview: 'Thank you for trying out our Gmail Integration demo.',
                    date: 'Just now',
                    read: false,
                    starred: false
                },
                {
                    id: '2',
                    subject: 'Your account has been created',
                    from: 'noreply@example.com',
                    fromName: 'Account Team',
                    preview: 'Your account has been successfully created.',
                    date: '2 hours ago',
                    read: true,
                    starred: true
                },
                {
                    id: '3',
                    subject: 'Weekly Newsletter',
                    from: 'newsletter@example.com',
                    fromName: 'Newsletter',
                    preview: 'Check out our latest updates and news.',
                    date: '1 day ago',
                    read: true,
                    starred: false
                }
            ];
            
            renderEmailList(emails);
            
            // If there are emails, select the first one
            if (emails.length > 0) {
                selectEmail(emails[0].id);
            }
            
            showLoading(false);
        }, 1000);
        
    } catch (error) {
        console.error('Error loading emails:', error);
        showToast('Failed to load emails', 'error');
        showLoading(false);
    }
}

// Render email list
function renderEmailList(emails) {
    const emailList = document.getElementById('emailList');
    
    if (emails.length === 0) {
        emailList.innerHTML = `
            <div class="text-center p-5 text-muted" id="noEmails">
                <i class="fas fa-inbox fa-3x mb-3"></i>
                <p>No emails in this folder</p>
            </div>
        `;
        return;
    }
    
    emailList.innerHTML = '';
    
    emails.forEach(email => {
        const emailElement = document.createElement('div');
        emailElement.className = `list-group-item list-group-item-action email-item ${!email.read ? 'unread' : ''} ${selectedEmailId === email.id ? 'selected' : ''}`;
        emailElement.dataset.id = email.id;
        
        emailElement.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <div class="d-flex align-items-center">
                    <div class="form-check me-2">
                        <input class="form-check-input email-checkbox" type="checkbox" value="" id="select-${email.id}">
                    </div>
                    <div class="d-flex flex-column">
                        <div class="d-flex align-items-center">
                            <h6 class="mb-0 me-2">${email.fromName || email.from}</h6>
                            ${email.starred ? '<i class="fas fa-star text-warning"></i>' : ''}
                        </div>
                        <p class="mb-1 email-preview">${email.preview}</p>
                    </div>
                </div>
                <small class="text-muted email-time">${email.date}</small>
            </div>
            <div class="email-subject mt-1">${email.subject}</div>
        `;
        
        emailElement.addEventListener('click', () => {
            selectEmail(email.id);
        });
        
        emailList.appendChild(emailElement);
    });
}

// Select an email to view
function selectEmail(emailId) {
    selectedEmailId = emailId;
    const email = emails.find(e => e.id === emailId);
    
    if (!email) return;
    
    // Update email view
    document.getElementById('emailSubject').textContent = email.subject || '(No subject)';
    document.getElementById('senderName').textContent = email.fromName || email.from;
    document.getElementById('senderEmail').textContent = email.from;
    document.getElementById('emailDate').textContent = email.date;
    
    // In a real app, you would fetch the full email content here
    document.getElementById('emailBody').innerHTML = `
        <p>${email.preview}</p>
        <p>This is a demo email. In a real application, this would show the full email content.</p>
        <p>Email ID: ${email.id}</p>
    `;
    
    // Update selected state in the list
    document.querySelectorAll('.email-item').forEach(item => {
        if (item.dataset.id === emailId) {
            item.classList.add('selected');
            item.classList.remove('unread');
        } else {
            item.classList.remove('selected');
        }
    });
    
    // Enable action buttons
    document.getElementById('replyButton').disabled = false;
    document.getElementById('forwardButton').disabled = false;
    document.getElementById('deleteButton').disabled = false;
    document.getElementById('replyButtonBottom').disabled = false;
    document.getElementById('forwardButtonBottom').disabled = false;
}

// Filter emails based on search query
function filterEmails(query) {
    if (!query) {
        renderEmailList(emails);
        return;
    }
    
    const filtered = emails.filter(email => 
        email.subject.toLowerCase().includes(query) || 
        (email.fromName && email.fromName.toLowerCase().includes(query)) || 
        email.from.toLowerCase().includes(query) || 
        email.preview.toLowerCase().includes(query)
    );
    
    renderEmailList(filtered);
}

// Show loading spinner
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.remove('d-none');
        spinner.classList.add('d-flex');
    } else {
        spinner.classList.remove('d-flex');
        spinner.classList.add('d-none');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = {
        text: message,
        closeButton: true,
        progressBar: true,
        positionClass: 'toast-top-right',
        timeOut: 5000,
        extendedTimeOut: 2000,
        showDuration: 300,
        hideDuration: 300,
        showMethod: 'fadeIn',
        hideMethod: 'fadeOut'
    };
    
    switch (type) {
        case 'success':
            toastr.success(toast.text, 'Success', toast);
            break;
        case 'error':
            toastr.error(toast.text, 'Error', toast);
            break;
        case 'warning':
            toastr.warning(toast.text, 'Warning', toast);
            break;
        default:
            toastr.info(toast.text, 'Info', toast);
    }
}

// Initialize Google Identity Services
function gisLoaded() {
    gisInited = true;
    maybeEnableButtons();
}

// Expose the gisLoaded function to the global scope
window.gisLoaded = gisLoaded;
