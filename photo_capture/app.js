// DOM Elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startCameraBtn = document.getElementById('startCamera');
const capturePhotoBtn = document.getElementById('capturePhoto');
const downloadPhotoBtn = document.getElementById('downloadPhoto');
const cameraStatus = document.getElementById('cameraStatus');
const photoPreview = document.getElementById('photoPreview');

// Global variables
let stream = null;
let photoDataUrl = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Set up event listeners
    setupEventListeners();
    
    // Try to start camera automatically if on HTTPS or localhost
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
        startCamera();
    } else {
        showStatus('Camera access requires HTTPS or localhost. Please click "Start Camera" when ready.');
    }
});

// Set up event listeners
function setupEventListeners() {
    startCameraBtn.addEventListener('click', startCamera);
    capturePhotoBtn.addEventListener('click', capturePhoto);
    downloadPhotoBtn.addEventListener('click', downloadPhoto);
}

// Start the camera
async function startCamera() {
    try {
        showStatus('Accessing camera...');
        
        // Stop any existing stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'environment' // Use the back camera by default
            },
            audio: false
        });
        
        // Set video source
        video.srcObject = stream;
        await video.play();
        
        // Update UI
        startCameraBtn.disabled = true;
        capturePhotoBtn.disabled = false;
        hideStatus();
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        showStatus('Could not access camera. Please check permissions and try again.');
        capturePhotoBtn.disabled = true;
    }
}

// Capture a photo from the video stream
function capturePhoto() {
    if (!stream) return;
    
    try {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Get the image data URL
        photoDataUrl = canvas.toDataURL('image/png');
        
        // Show preview
        showPreview(photoDataUrl);
        
        // Enable download button
        downloadPhotoBtn.disabled = false;
        
        // Show success message
        showTemporaryStatus('Photo captured!', 'success');
        
    } catch (error) {
        console.error('Error capturing photo:', error);
        showTemporaryStatus('Error capturing photo', 'danger');
    }
}

// Show the captured photo in the preview area
function showPreview(imageDataUrl) {
    photoPreview.innerHTML = `
        <img src="${imageDataUrl}" alt="Captured Photo" class="img-fluid fade-in">
    `;
    
    // Scroll to preview
    photoPreview.scrollIntoView({ behavior: 'smooth' });
}

// Download the captured photo
function downloadPhoto() {
    if (!photoDataUrl) return;
    
    try {
        // Create a temporary link element
        const link = document.createElement('a');
        link.download = `photo-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
        link.href = photoDataUrl;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        showTemporaryStatus('Download started!', 'success');
        
    } catch (error) {
        console.error('Error downloading photo:', error);
        showTemporaryStatus('Error downloading photo', 'danger');
    }
}

// Show status message
function showStatus(message, type = 'info') {
    if (!cameraStatus) return;
    
    cameraStatus.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="spinner-border text-light me-2" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <span>${message}</span>
        </div>
    `;
    cameraStatus.style.display = 'flex';
    
    // Remove any existing classes and add the appropriate one
    cameraStatus.className = 'status-message';
    if (type === 'success') cameraStatus.classList.add('bg-success');
    else if (type === 'error' || type === 'danger') cameraStatus.classList.add('bg-danger');
    else cameraStatus.classList.add('bg-primary');
}

// Show a temporary status message that auto-hides
function showTemporaryStatus(message, type = 'info', duration = 2000) {
    showStatus(message, type);
    
    // Auto-hide after duration
    setTimeout(() => {
        hideStatus();
    }, duration);
}

// Hide status message
function hideStatus() {
    if (cameraStatus) {
        cameraStatus.style.display = 'none';
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    // Update canvas dimensions if needed
    if (stream && video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // Page is hidden, stop the camera to save resources
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            startCameraBtn.disabled = false;
            capturePhotoBtn.disabled = true;
            showStatus('Camera was stopped. Click "Start Camera" to resume.');
        }
    }
});
