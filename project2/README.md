# JavaScript Features Demo

A comprehensive demo application showcasing various JavaScript features including camera access, geolocation, maps integration, and communication APIs.

## Features

- **Camera & Media**
  - Take photos using device camera
  - Record videos with timer
  - Preview and download captured media

- **Location Services**
  - Get current GPS coordinates
  - Display location on Google Maps
  - Find nearby grocery stores
  - Get directions to a destination

- **Communication**
  - Send emails (requires EmailJS setup)
  - Share via WhatsApp
  - Send SMS (requires backend service)
  - Social media sharing

- **Device Information**
  - Display IP address and location
  - Show browser and device details
  - Screen resolution information

## Prerequisites

- Modern web browser with camera and geolocation support
- Google Maps API key (for maps functionality)
- EmailJS account (for email functionality)
- Local web server (for testing camera access)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project2
   ```

2. **Get API Keys**
   - Get a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/)
   - Get an EmailJS user ID from [EmailJS](https://www.emailjs.com/)

3. **Update Configuration**
   - In `index.html`, replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual Google Maps API key
   - In `app.js`, replace `YOUR_EMAILJS_USER_ID` with your actual EmailJS user ID

4. **Run a Local Server**
   - Camera access requires HTTPS or localhost
   - You can use Python's built-in server:
     ```bash
     # Python 3
     python -m http.server 8000
     ```
   - Or use VS Code's Live Server extension

5. **Open in Browser**
   - Navigate to `http://localhost:8000` (or your chosen port)
   - Grant camera and location permissions when prompted

## Usage

1. **Camera Features**
   - Click "Start Camera" to begin using your device camera
   - Use "Take Photo" to capture an image
   - Use "Record Video" to start/stop video recording
   - Preview and download your media

2. **Location Features**
   - Click "Get My Location" to get your current coordinates
   - View your location on the map
   - Find nearby grocery stores
   - Get directions to any destination

3. **Communication**
   - Enter an email and click "Send Photo via Email" (requires EmailJS setup)
   - Enter a phone number to share via WhatsApp or SMS
   - Use the social media buttons to share your current page

## API Documentation

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/overview)
- [EmailJS Documentation](https://www.emailjs.com/docs/)
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

## Browser Support

This application uses modern web APIs and is best viewed in the latest versions of:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari (with some limitations)

## Security Notes

- Camera and location access require user permission
- For production use, implement proper authentication and validation
- Never expose API keys in client-side code in production

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
