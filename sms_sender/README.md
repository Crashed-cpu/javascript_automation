# SMS Message Sender

A simple web application that allows users to compose SMS messages and open them in their device's default messaging app. This tool creates a pre-filled SMS message that opens in the user's default messaging application, making it easy to send text messages without saving contacts.

## Features

- Clean, responsive interface with a modern design
- Phone number formatting and validation
- Support for international numbers with country codes
- Character counter with SMS message part calculation
- Support for both standard and Unicode (emojis, special characters) messages
- Dark mode support
- Mobile-friendly design
- Helpful tooltips and error messages

## How It Works

1. Enter the recipient's phone number with country code (e.g., 14155552671 for US/Canada)
2. Type your message in the text area
3. The character counter will show message length and number of SMS parts
4. Click "Send SMS"
5. Your device's default messaging app will open with the message pre-filled
6. Review and send the message

## Technical Details

- Uses the native `sms:` URI scheme to open the default messaging app
- No server-side code required - works entirely in the browser
- Responsive design using Bootstrap 5
- Form validation and error handling
- Progressive enhancement for better user experience
- Supports both standard SMS (160 chars) and Unicode messages (70 chars)
- Handles concatenated (long) messages automatically

## Browser Support

Works in all modern browsers on both desktop and mobile devices:
- Chrome (Mobile & Desktop)
- Firefox (Mobile & Desktop)
- Safari (iOS & macOS)
- Edge (Mobile & Desktop)
- Samsung Internet

## Mobile Integration

On mobile devices, this app will open the device's default messaging app with the pre-filled message. On desktop, the behavior depends on the operating system and installed applications.

## Message Limitations

- **Standard SMS**: 160 characters per message
- **Long SMS (concatenated)**: 153 characters per message part
- **Unicode characters (emojis, etc.)**: 70 characters per message part

## Setup

No installation required! Simply open `index.html` in any modern web browser.

## Privacy

- No messages are stored or processed on any server
- All processing happens locally in your browser
- No tracking or analytics
- Phone numbers and messages never leave your device

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Feel free to submit issues and enhancement requests. Contributions are welcome!

## Troubleshooting

- **Message doesn't open in messaging app**: Ensure you have a default messaging app set on your device
- **Phone number not recognized**: Verify the country code is included and correct
- **Message too long**: The app will split long messages automatically, but some carriers may have additional restrictions
