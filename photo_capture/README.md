# Photo Capture App

A simple web application that allows users to take photos using their device camera and download them.

## Features

- Access device camera
- Take photos with a single click
- Preview captured photos
- Download photos in PNG format
- Responsive design that works on both desktop and mobile devices
- Clean and intuitive user interface

## Prerequisites

- Modern web browser with camera access support (Chrome, Firefox, Safari, Edge)
- HTTPS connection or localhost for camera access

## How to Use

1. Open `index.html` in a modern web browser
2. Click "Start Camera" to enable your device's camera (if not started automatically)
3. Position yourself or the subject in the camera view
4. Click "Take Photo" to capture an image
5. View the captured photo in the preview section
6. Click "Download" to save the photo to your device

## Browser Support

This application uses the following modern web APIs:
- MediaDevices API (for camera access)
- Canvas API (for image processing)
- Download API (for saving images)

It works best in the latest versions of:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari (with some limitations)

## Notes

- Camera access requires a secure context (HTTPS) or localhost
- On mobile devices, you may need to grant camera permissions
- The app automatically handles orientation changes and window resizing
- The camera is automatically turned off when the page is hidden to save battery

## License

This project is open source and available under the [MIT License](LICENSE).
