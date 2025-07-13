// DOM Elements
const video = document.getElementById('video');
const startCameraBtn = document.getElementById('startCamera');
const startRecordingBtn = document.getElementById('startRecording');
const stopRecordingBtn = document.getElementById('stopRecording');
const switchCameraBtn = document.getElementById('switchCamera');
const deleteRecordingBtn = document.getElementById('deleteRecording');
const downloadLink = document.getElementById('downloadLink');
const cameraStatus = document.getElementById('cameraStatus');
const previewContainer = document.getElementById('previewContainer');
const downloadSection = document.getElementById('downloadSection');
const recordingTimer = document.getElementById('recordingTimer');
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');

// Global variables
let stream = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingStartTime = null;
let timerInterval = null;
let currentFacingMode = 'user'; // 'user' for front camera, 'environment' for back
let recordedVideoUrl = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check if browser supports MediaRecorder
    if (!window.MediaRecorder) {
        showStatus('MediaRecorder is not supported in this browser', 'error');
        disableAllButtons();
        return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Try to start camera automatically if on HTTPS or localhost
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
        startCamera();
    }
});

// Set up event listeners
function setupEventListeners() {
    startCameraBtn.addEventListener('click', startCamera);
    startRecordingBtn.addEventListener('click', startRecording);
    stopRecordingBtn.addEventListener('click', stopRecording);
    switchCameraBtn.addEventListener('click', switchCamera);
    deleteRecordingBtn.addEventListener('click', deleteRecording);
    
    // Clean up when the page is unloaded
    window.addEventListener('beforeunload', cleanup);
}

// Start the camera
async function startCamera() {
    try {
        showStatus('Accessing camera...');
        
        // Stop any existing stream
        if (stream) {
            cleanupStream();
        }
        
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: currentFacingMode
            },
            audio: true
        });
        
        // Set video source
        video.srcObject = stream;
        await video.play();
        
        // Update UI
        startCameraBtn.disabled = true;
        startRecordingBtn.disabled = false;
        switchCameraBtn.disabled = false;
        hideStatus();
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        showStatus('Could not access camera. Please check permissions and try again.');
        disableAllButtons();
    }
}

// Start recording
function startRecording() {
    if (!stream) return;
    
    try {
        // Reset recorded chunks
        recordedChunks = [];
        
        // Create a MediaRecorder instance
        const options = { mimeType: 'video/webm;codecs=vp9' };
        mediaRecorder = new MediaRecorder(stream, options);
        
        // Handle data available event
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        // Handle recording stopped
        mediaRecorder.onstop = () => {
            // Create a blob from the recorded chunks
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            recordedVideoUrl = URL.createObjectURL(blob);
            
            // Show the recorded video
            showPreview(recordedVideoUrl);
            
            // Enable download
            downloadLink.href = recordedVideoUrl;
            downloadLink.download = `recording-${new Date().toISOString()}.webm`;
            downloadSection.style.display = 'block';
            
            // Stop all tracks
            stopRecordingTimer();
        };
        
        // Start recording
        mediaRecorder.start(100); // Collect 100ms of data
        
        // Update UI
        startRecordingBtn.disabled = true;
        stopRecordingBtn.disabled = false;
        switchCameraBtn.disabled = true;
        
        // Start the recording timer
        startRecordingTimer();
        
    } catch (error) {
        console.error('Error starting recording:', error);
        showStatus('Error starting recording. Please try again.');
    }
}

// Stop recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        
        // Stop all tracks in the stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // Update UI
        startRecordingBtn.disabled = false;
        stopRecordingBtn.disabled = true;
        switchCameraBtn.disabled = false;
    }
}

// Switch between front and back camera
async function switchCamera() {
    // Toggle between front and back camera
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    // Restart the camera with the new facing mode
    await startCamera();
}

// Show the recorded video preview
function showPreview(videoUrl) {
    previewContainer.innerHTML = `
        <video id="recordedVideo" class="video-js vjs-theme-forest" controls>
            <source src="${videoUrl}" type="video/webm">
            Your browser does not support the video tag.
        </video>
    `;
    
    // Initialize Video.js player
    if (videojs.getPlayers()['recordedVideo']) {
        videojs.getPlayers()['recordedVideo'].dispose();
    }
    
    const player = videojs('recordedVideo', {
        controls: true,
        fluid: true,
        preload: 'auto'
    });
    
    player.ready(function() {
        this.play();
    });
}

// Delete the recorded video
function deleteRecording() {
    if (recordedVideoUrl) {
        // Revoke the object URL to free up memory
        URL.revokeObjectURL(recordedVideoUrl);
        recordedVideoUrl = null;
        
        // Reset the preview
        previewContainer.innerHTML = '<p class="text-muted">Your recorded video will appear here</p>';
        downloadSection.style.display = 'none';
    }
}

// Start the recording timer
function startRecordingTimer() {
    recordingStartTime = Date.now();
    recordingTimer.classList.remove('d-none');
    
    // Update the timer every second
    timerInterval = setInterval(updateTimer, 1000);
}

// Update the recording timer
function updateTimer() {
    const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    
    minutesDisplay.textContent = minutes;
    secondsDisplay.textContent = seconds;
}

// Stop the recording timer
function stopRecordingTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    recordingTimer.classList.add('d-none');
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
    if (type === 'error' || type === 'danger') {
        cameraStatus.classList.add('bg-danger');
    } else {
        cameraStatus.classList.add('bg-primary');
    }
}

// Hide status message
function hideStatus() {
    if (cameraStatus) {
        cameraStatus.style.display = 'none';
    }
}

// Disable all buttons
function disableAllButtons() {
    startCameraBtn.disabled = true;
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = true;
    switchCameraBtn.disabled = true;
}

// Clean up the media stream
function cleanupStream() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder = null;
    }
    
    stopRecordingTimer();
}

// Clean up resources
function cleanup() {
    cleanupStream();
    
    if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
        recordedVideoUrl = null;
    }
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && mediaRecorder && mediaRecorder.state === 'recording') {
        // Page is hidden, stop recording
        stopRecording();
    }
});
