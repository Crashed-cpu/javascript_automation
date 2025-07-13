# Social Media Poster

A web application that allows users to compose, schedule, and manage social media posts across multiple platforms from a single interface.

## Features

- **Multi-platform Posting**: Compose once, post to multiple platforms (Facebook, Twitter, LinkedIn)
- **Scheduling**: Schedule posts for future dates and times
- **Media Support**: Attach images and videos to your posts
- **Drafts**: Save posts as drafts to finish later
- **Responsive Design**: Works on desktop and mobile devices
- **Offline Support**: Posts are saved locally in the browser
- **Real-time Previews**: See how your post will look before scheduling

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome 6
- **Storage**: LocalStorage for offline functionality
- **No Backend Required**: Runs entirely in the browser

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server or backend required

### Installation

1. Clone the repository or download the source code
2. Open `public/index.html` in your web browser

## Usage

1. **Create a New Post**
   - Enter your post content in the text area
   - Add images or videos (optional)
   - Select the platforms you want to post to
   - Choose to post now or schedule for later
   - Click "Schedule Post" or "Save Draft"

2. **Manage Scheduled Posts**
   - View all scheduled posts in the list
   - Edit or delete posts before they're published
   - Post immediately if needed

3. **Drafts**
   - Save posts as drafts to finish later
   - Edit and schedule drafts at any time

## File Structure

```
social_media_poster/
├── public/                # Frontend files
│   ├── css/              # Stylesheets
│   │   └── styles.css    # Custom styles
│   ├── js/               # JavaScript files
│   │   └── app.js        # Main application logic
│   └── index.html        # Main HTML file
└── README.md             # This file
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Limitations

- This is a frontend-only implementation. For a production application, you would need:
  - Backend server for actual social media API integration
  - User authentication
  - Database for persistent storage
  - Server-side scheduling

## Future Enhancements

- Add support for more social media platforms
- Implement actual API integration with social networks
- Add user accounts and authentication
- Enable post analytics and insights
- Add team collaboration features

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
