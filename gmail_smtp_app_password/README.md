# Gmail SMTP App Password Sender

A secure email sending application that uses Gmail's SMTP server with App Passwords for authentication. This approach doesn't require OAuth 2.0 setup and is simpler to implement for personal use.

## Features

- Send emails using Gmail's SMTP server
- Support for file attachments (including images and documents)
- Simple and secure authentication using App Passwords
- Responsive design that works on all devices
- Real-time form validation
- Built with Node.js, Express, and Nodemailer

## Prerequisites

- Node.js (v14 or later)
- npm (comes with Node.js)
- Gmail account with 2-Step Verification enabled
- App Password generated from your Google Account

## Setup Instructions

1. **Generate an App Password**
   - Go to your [Google Account](https://myaccount.google.com/)
   - Enable 2-Step Verification if not already enabled
   - Go to Security > App passwords
   - Generate a new app password for "Mail" and your device
   - Copy the generated 16-character password

2. **Configure Environment Variables**
   - Copy `.env.example` to a new file called `.env`
   - Update the following variables in `.env`:
     ```
     GMAIL_USER=your-email@gmail.com
     GMAIL_APP_PASSWORD=your-16-character-app-password
     SENDER_NAME=Your Name
     PORT=3000
     ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start the Server**
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:3000`

## File Structure

```
gmail_smtp_app_password/
├── public/            # Frontend files
│   ├── index.html     # Main HTML file
│   ├── styles.css     # Styling
│   └── app.js         # Frontend JavaScript
├── server/            # Backend files
│   └── server.js      # Express server
├── .env.example      # Example environment variables
├── package.json      # Project dependencies
└── README.md         # This file
```

## Security Notes

- Never commit your `.env` file to version control
- The app password should be kept secret and not shared
- For production use, consider:
  - Using environment variables for all sensitive data
  - Implementing rate limiting
  - Adding input validation on the server side
  - Using HTTPS in production

## Troubleshooting

- **Authentication Failed**: Ensure 2-Step Verification is enabled and you're using the correct app password
- **Email Not Sending**: Check your internet connection and ensure the recipient's email is valid
- **Attachment Issues**: Verify file size is within limits and file type is supported

## License

This project is open source and available under the [MIT License](LICENSE).
