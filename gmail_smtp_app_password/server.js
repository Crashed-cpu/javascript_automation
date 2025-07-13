require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
    dest: os.tmpdir(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Allowed MIME types for uploads
        const allowedTypes = [
            // Images
            'image/jpeg', 'image/png', 'image/gif',
            
            // Documents
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain', 'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
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
        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 
                                'mp4', 'mov', 'avi', 'wmv', 'mkv', 'webm', 'mpeg', 'mpg',
                                'mp3', 'wav', 'ogg', 'zip', 'rar', '7z', 'tar', 'gz'];
        
        const isMimeTypeAllowed = allowedTypes.includes(file.mimetype);
        const isExtensionAllowed = allowedExtensions.includes(fileExtension);
        
        if (isMimeTypeAllowed || isExtensionAllowed) {
            cb(null, true);
        } else {
            cb(new Error(`File type not supported: ${file.originalname}. Only images, documents, videos, audio, and archives are allowed.`));
        }
    }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    requireTLS: true,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false // Only for development, remove in production
    }
});

// Verify connection configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('SMTP Connection Error:', error);
    } else {
        console.log('SMTP Server is ready to take our messages');
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle email with attachments
app.post('/api/send-email', upload.array('attachments', 5), async (req, res) => {
    // Parse form data
    const { to, subject = '', text = '', html = '' } = req.body;
    const files = req.files || [];

    if (!to || (!text && !html)) {
        // Clean up uploaded files if validation fails
        files.forEach(file => {
            fs.unlink(file.path, () => {});
        });
        
        return res.status(400).json({ 
            success: false, 
            error: 'Recipient email and message content are required' 
        });
    }

    try {
        // Prepare email options
        const emailSubject = subject.trim() || '(No subject)';
        const emailHtml = html || text.replace(/\n/g, '<br>');
        
        // Format the 'from' field based on SENDER_NAME
        const fromName = process.env.SENDER_NAME || 'Gmail SMTP App';
        const fromEmail = process.env.GMAIL_USER;
        const from = fromName ? `"${fromName.replace(/"/g, '')}" <${fromEmail}>` : fromEmail;
        
        const mailOptions = {
            from: from,
            to: to.trim(),
            subject: emailSubject,
            text: text,
            html: emailHtml,
            attachments: files.map(file => ({
                filename: file.originalname,
                path: file.path,
                cid: `attachment-${Date.now()}-${Math.round(Math.random() * 1E9)}`
            }))
        };

        await transporter.sendMail(mailOptions);
        
        // Clean up uploaded files after sending
        files.forEach(file => {
            fs.unlink(file.path, () => {});
        });
        
        res.json({ 
            success: true,
            message: 'Email sent successfully',
            attachments: files.length
        });
    } catch (error) {
        console.error('Error sending email:', error);
        
        // Clean up uploaded files on error
        files.forEach(file => {
            fs.unlink(file.path, () => {});
        });
        
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send email',
            details: error.message 
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Error handling middleware for file uploads
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        return res.status(400).json({
            success: false,
            error: 'File upload error',
            details: err.message
        });
    } else if (err) {
        // An unknown error occurred
        return res.status(500).json({
            success: false,
            error: 'An error occurred',
            details: err.message
        });
    }
    next();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});
