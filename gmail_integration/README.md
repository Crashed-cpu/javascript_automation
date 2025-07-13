# Gmail API Integration

A web application that integrates with Gmail API to provide comprehensive email management functionality. This application demonstrates how to interact with Gmail's API to send, receive, and manage emails programmatically.

## Features

- **Email Composition**: Create and send emails with rich text formatting
- **Inbox Management**: View and organize your inbox, sent items, and drafts
- **Email Search**: Powerful search functionality to find emails quickly
- **Labels & Categories**: Manage Gmail labels and categories
- **Responsive UI**: Fully responsive design that works on all devices
- **Secure Authentication**: OAuth 2.0 authentication with Gmail API

## Prerequisites

- Node.js (v14 or later)
- npm (comes with Node.js)
- Google Cloud Platform (GCP) project with Gmail API enabled
- OAuth 2.0 credentials from Google Cloud Console
- Modern web browser

## Quick Start

1. **Set up Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Gmail API
   - Configure OAuth consent screen
   - Create OAuth 2.0 credentials (Web application type)
   - Add authorized redirect URIs (e.g., `http://localhost:3000/auth/google/callback`)

2. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Update with your credentials:
     ```
     GOOGLE_CLIENT_ID=your-client-id
     GOOGLE_CLIENT_SECRET=your-client-secret
     REDIRECT_URI=http://localhost:3000/auth/google/callback
     SESSION_SECRET=your-session-secret
     ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Start the Application**
   ```bash
   npm start
   ```
   Visit `http://localhost:3000` in your browser

## Project Structure

```
gmail_integration/
├── public/            # Static files
│   ├── css/           # Stylesheets
│   ├── js/            # Frontend JavaScript
│   └── index.html     # Main HTML file
├── server/            # Backend code
│   ├── auth/          # Authentication logic
│   ├── routes/        # API routes
│   └── server.js      # Express server
├── .env.example      # Example environment variables
├── package.json      # Project dependencies
└── README.md         # This file
```

## Security Notes

- Never commit your `.env` file to version control
- Keep your OAuth client secret secure
- Implement proper session management
- Use HTTPS in production
- Follow Google's API usage policies

## Troubleshooting

- **Authentication Errors**: Verify your OAuth credentials and redirect URIs
- **API Quota Exceeded**: Check your Google Cloud quotas
- **CORS Issues**: Ensure proper CORS configuration in development

## License

This project is open source and available under the [MIT License](LICENSE).
- **Google OAuth**: Secure sign-in with Google account

## Prerequisites

1. Google Cloud Project with Gmail API enabled
2. OAuth 2.0 Client ID from Google Cloud Console
3. Node.js and npm installed (for local development)

## Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Gmail API
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized JavaScript origins: `http://localhost:8000`
   - Add authorized redirect URIs: `http://localhost:8000/oauth2callback`

2. **Configure the Application**
   - Open `app.js`
   - Replace `YOUR_GOOGLE_CLIENT_ID` with your OAuth 2.0 Client ID
   - Replace `YOUR_GOOGLE_API_KEY` with your API key (if required)

3. **Run the Application**
   ```bash
   # Navigate to the project directory
   cd javascript_tasks/gmail_integration
   
   # Start a local server (Python 3)
   python -m http.server 8000
   ```
   
   Alternatively, you can use any other local server of your choice.

4. **Access the Application**
   Open your browser and navigate to `http://localhost:8000`

## How to Use

1. **Sign In**
   - Click the "Sign In with Google" button
   - Select your Google account and grant the necessary permissions

2. **Compose an Email**
   - Click the "Compose" button
   - Enter the recipient's email address
   - Add a subject and compose your email
   - Click "Send" to send the email or "Save Draft" to save it as a draft

3. **View Emails**
   - Click on an email in the list to view its contents
   - Use the folder navigation to switch between Inbox, Sent, Drafts, etc.
   - Use the search bar to find specific emails

4. **Sign Out**
   - Click the "Sign Out" button to sign out of your account

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- [Google API Client](https://developers.google.com/api-client-library)
- [Bootstrap 5](https://getbootstrap.com/)
- [Font Awesome](https://fontawesome.com/)
- [jQuery](https://jquery.com/)
- [Quill Rich Text Editor](https://quilljs.com/)
- [Toastr](https://github.com/CodeSeven/toastr)

## Security Notes

- The application uses OAuth 2.0 for secure authentication
- API keys and tokens are stored in the browser's localStorage
- For production use, consider implementing server-side token storage and refresh token handling

## License

This project is open source and available under the [MIT License](LICENSE).

## Troubleshooting

- If you encounter CORS issues, make sure you're running the application through a web server (not opening the HTML file directly)
- Ensure all required APIs are enabled in the Google Cloud Console
- Check the browser's console for error messages

## Future Enhancements

- Implement email threading
- Add support for labels and filters
- Improve attachment handling
- Add keyboard shortcuts
- Implement offline support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
