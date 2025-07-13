# Video Recorder

A web application that allows users to record videos directly from their device camera and download them.

## Features

- Record videos using your device's camera
- Switch between front and back cameras (on supported devices)
- Preview recorded videos before downloading
- Download videos in WebM format
- Responsive design that works on both desktop and mobile devices
- Clean and intuitive user interface
- Timer to track recording duration

## Prerequisites

- Modern web browser with support for:
  - MediaRecorder API
  - getUserMedia API
  - Video.js (included via CDN)
- HTTPS connection or localhost for camera access

## How to Use

1. Open `index.html` in a modern web browser
2. Click "Start Camera" to enable your device's camera (if not started automatically)
3. Position yourself or the subject in the camera view
4. Click "Record" to start recording
5. Click "Stop" when finished
6. Preview the recorded video
7. Click "Download Video" to save the recording to your device
8. Use "Delete" to remove the current recording and start over

## Browser Support

This application uses the following modern web APIs:
- MediaRecorder API (for video recording)
- getUserMedia API (for camera access)
- Video.js (for better video player controls)

It works best in the latest versions of:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari (with some limitations)

## Notes

- Camera access requires a secure context (HTTPS) or localhost
- On mobile devices, you may need to grant camera and microphone permissions
- The video is recorded in WebM format with VP9 codec for better compression
- The app automatically stops recording when the page is hidden to save battery

## Customization

You can customize the application by modifying the following:

1. Video quality: Adjust the `width` and `height` constraints in the `startCamera` function
2. Video format: Change the `mimeType` in the `startRecording` function
3. Styling: Modify the `styles.css` file to match your brand

## License

This project is open source and available under the [MIT License](LICENSE).

## Credits

- [Video.js](https://videojs.com/) for the video player
- [Bootstrap](https://getbootstrap.com/) for the responsive design
- [Font Awesome](https://fontawesome.com/) for the icons
