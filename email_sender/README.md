# Email Sender

A lightweight web application for sending emails directly from the browser using EmailJS. This is a client-side only solution that doesn't require a backend server.

## Features

- Simple, intuitive interface for composing emails
- Support for file attachments (images, documents, etc.)
- Real-time form validation
- Responsive design that works on all devices
- No backend required - runs entirely in the browser
- Built with vanilla JavaScript (no frameworks required)

## Prerequisites

- A free [EmailJS](https://www.emailjs.com/) account
- A verified email service (Gmail, Outlook, etc.) connected to EmailJS
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Quick Start

1. **Sign up for EmailJS**
   - Create a free account at [EmailJS](https://www.emailjs.com/)
   - Add and verify your email service (Gmail, Outlook, etc.)
   - Create an email template with these variables:
     - `to_email` (required)
     - `subject` (required)
     - `message` (required)
     - `from_name` (optional)
     - `reply_to` (optional)
     - `attachment` (optional)

2. **Configure the Application**
   - Open `app.js`
   - Update the EmailJS initialization with your credentials:
     ```javascript
     // Initialize EmailJS with your public key
     emailjs.init('YOUR_PUBLIC_KEY');
     
     // Send email function - update with your service and template IDs
     const response = await emailjs.send(
         'your_service_id',  // Replace with your EmailJS service ID
         'your_template_id', // Replace with your template ID
         templateParams      // Form data
     );
     ```

3. **Run the Application**
   - Simply open `index.html` in any modern web browser
   - No server required - it works with the `file://` protocol
   - No server required - it works directly from the file system

## How to Use

1. Fill in the recipient's email address
2. Enter your name and email address
3. Add a subject and your message
4. Optionally attach a file (max 5MB)
5. Click "Send Email"
6. Check the status message to confirm the email was sent

## Browser Support

This application uses modern JavaScript features and works best in the latest versions of:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

## Security Notes

- The application uses client-side JavaScript to send emails via EmailJS
- Your EmailJS public key is exposed in the client-side code
- For production use, consider implementing server-side email sending for better security
- Never expose sensitive information in client-side code

## Troubleshooting

- **Emails not being received**: Check your spam folder and verify your EmailJS service configuration
- **File upload issues**: Ensure files are under 5MB and are valid file types
- **CORS errors**: Make sure your EmailJS service is properly configured and your API key is correct

## License

This project is open source and available under the [MIT License](LICENSE).

## Credits

- [EmailJS](https://www.emailjs.com/) for the email sending service
- [Bootstrap](https://getbootstrap.com/) for the responsive design
- [Font Awesome](https://fontawesome.com/) for the icons
