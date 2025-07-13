# Minimal Email Sender with EmailJS

A lightweight email sender application using EmailJS for sending emails directly from the browser without a backend server.

## Features

- Send emails directly from the browser
- Clean and responsive UI
- Form validation
- Loading states and status messages
- No backend required (uses EmailJS service)

## Prerequisites

1. An EmailJS account (https://www.emailjs.com/)
2. An EmailJS email service connected (Gmail, Outlook, etc.)
3. An EmailJS email template

## Setup Instructions

1. **Get your EmailJS credentials**
   - Sign up at https://www.emailjs.com/
   - Go to Email Services and add a new service (Gmail, Outlook, etc.)
   - Go to Email Templates and create a new template
   - Note your:
     - Public Key
     - Service ID
     - Template ID

2. **Configure the application**
   - Open `public/js/app2.js`
   - Replace the following placeholders with your EmailJS credentials:
     ```javascript
     emailjs.init({
         publicKey: 'YOUR_PUBLIC_KEY',  // Replace with your public key
         // ... rest of the config
     });
     
     // Later in the code, replace these:
     emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
     ```

3. **Test the application**
   - Open `public/index2.html` in a web browser
   - Fill out the form and send a test email

## EmailJS Template Setup

Your EmailJS template should include variables that match those used in `app2.js`:

- `{{to_email}}` - Recipient's email address
- `{{subject}}` - Email subject
- `{{message}}` - Email body
- `{{from_name}}` - Sender's name
- `{{reply_to}}` - Reply-to email address

## File Structure

```
email_sender_minimal/
├── public/
│   ├── css/
│   ├── js/
│   │   └── app2.js      # Main JavaScript file
│   └── index2.html      # Main HTML file
└── README.md            # This file
```

## How It Works

1. The application uses the EmailJS SDK to send emails directly from the browser
2. When the form is submitted, it validates the input and shows a loading state
3. EmailJS handles the email delivery using your configured email service
4. Success or error messages are displayed to the user

## Security Notes

- Never expose your EmailJS private keys in client-side code
- The public key is safe to use in client-side code
- For production, consider implementing rate limiting and spam protection

## Customization

You can customize the styling by editing the CSS in the `<style>` section of `index2.html`.

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support with EmailJS, visit their [documentation](https://www.emailjs.com/docs/).
