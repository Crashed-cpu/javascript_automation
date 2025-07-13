document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const photo = document.getElementById('photo');
    const startButton = document.getElementById('startButton');
    const captureButton = document.getElementById('captureButton');
    const downloadButton = document.getElementById('downloadButton');
    const cameraStatus = document.getElementById('cameraStatus');
    const outputSection = document.querySelector('.output');
    
    let stream = null;
    let useDummyImage = true;
    
    // Initialize the app
    function init() {
        // Hide the output section initially
        outputSection.style.display = 'none';
        
        // Show loading state
        showStatus('Loading photo app...');
        
        // Try to access camera automatically
        setTimeout(() => {
            if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
                startCamera();
            } else {
                showStatus('Using sample images (camera requires HTTPS)');
                loadSampleImage();
            }
        }, 500);
    }
    
    // Show status message
    function showStatus(message) {
        if (cameraStatus) {
            cameraStatus.textContent = message;
            cameraStatus.classList.remove('hidden');
        }
    }
    
    // Hide status message
    function hideStatus() {
        if (cameraStatus) {
            cameraStatus.classList.add('hidden');
        }
    }
    
    // Load a sample image
    function loadSampleImage() {
        showStatus('Loading sample image...');
        
        // Use a random image from picsum.photos with cache busting
        const timestamp = new Date().getTime();
        photo.src = `https://picsum.photos/800/600?random=${timestamp}`;
        photo.alt = 'Sample image';
        
        // Handle image load
        photo.onload = () => {
            downloadButton.disabled = false;
            outputSection.style.display = 'block';
            hideStatus();
        };
        
        // Handle image error
        photo.onerror = () => {
            showStatus('Failed to load sample image');
            setTimeout(loadSampleImage, 2000); // Retry after 2 seconds
        };
    }
    
    // Start Camera Function
    async function startCamera() {
        try {
            showStatus('Accessing camera...');
            
            // First try to access the camera
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                // Request access to the user's camera
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'environment' // Use the rear camera by default
                    },
                    audio: false
                });
                
                // Set the video source to the camera stream
                video.srcObject = stream;
                video.style.display = 'block';
                
                // Wait for video to be ready
                await new Promise((resolve) => {
                    video.onloadedmetadata = () => {
                        video.play();
                        resolve();
                    };
                });
                
                // Enable capture button and disable start button
                captureButton.disabled = false;
                startButton.disabled = true;
                useDummyImage = false;
                hideStatus();
                
            } else {
                throw new Error('MediaDevices API not supported');
            }
            
        } catch (err) {
            console.warn('Could not access camera, using sample image instead:', err);
            // If camera access fails, use a sample image
            useDummyImage = true;
            video.style.display = 'none';
            captureButton.disabled = true;
            startButton.disabled = true;
            loadSampleImage();
        }
    }
    
    // Capture Photo Function
    function capturePhoto() {
        try {
            if (useDummyImage) {
                // If using dummy image, load a new one
                loadSampleImage();
                return;
            }
            
            showStatus('Capturing photo...');
            
            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Draw the current video frame to the canvas
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to data URL and set as image source
            photo.src = canvas.toDataURL('image/png');
            
            // Enable download button
            downloadButton.disabled = false;
            
            // Show the photo container
            outputSection.style.display = 'block';
            
            // Scroll to the output
            outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            hideStatus();
            
        } catch (err) {
            console.error('Error capturing photo:', err);
            showStatus('Error capturing photo');
            setTimeout(() => loadSampleImage(), 1000);
        }
    }
    
    // Download Photo Function
    function downloadPhoto() {
        try {
            // Create a temporary link element
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `photo-${timestamp}.png`;
            link.href = photo.src;
            
            // Add a timestamp to force download
            if (link.href.includes('?')) {
                link.href += '&download=' + Date.now();
            } else {
                link.href += '?download=' + Date.now();
            }
            
            // Trigger the download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Show feedback
            const originalText = downloadButton.textContent;
            downloadButton.textContent = '✅ Downloaded!';
            setTimeout(() => {
                downloadButton.textContent = originalText;
            }, 2000);
            
        } catch (err) {
            console.error('Error downloading photo:', err);
            showStatus('Error downloading photo');
            
            // Fallback: Show instructions for manual download
            const originalText = downloadButton.textContent;
            downloadButton.textContent = '❌ Download Failed';
            setTimeout(() => {
                downloadButton.textContent = originalText;
            }, 2000);
        }
    }
    
    // Event Listeners
    startButton.addEventListener('click', startCamera);
    captureButton.addEventListener('click', capturePhoto);
    downloadButton.addEventListener('click', downloadPhoto);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (!useDummyImage && stream) {
            // Adjust video display on resize
            video.style.width = '100%';
            video.style.height = 'auto';
        }
    });
    
    // Stop the camera when the page is unloaded
    window.addEventListener('beforeunload', () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    });
    
    // Initialize the app
    init();
});
