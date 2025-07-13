// DOM Elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const startCameraBtn = document.getElementById('startCamera');
const capturePhotoBtn = document.getElementById('capturePhoto');
const startRecordingBtn = document.getElementById('startRecording');
const stopRecordingBtn = document.getElementById('stopRecording');
const cameraStatus = document.getElementById('cameraStatus');
const recordingTime = document.getElementById('recordingTime');
const timer = document.getElementById('timer');
const getLocationBtn = document.getElementById('getLocation');
const showOnMapBtn = document.getElementById('showOnMap');
const findStoresBtn = document.getElementById('findStores');
const getRouteBtn = document.getElementById('getRoute');
const locationInfo = document.getElementById('locationInfo');
const mapElement = document.getElementById('map');
const ipInfo = document.getElementById('ipInfo');
const ipAddress = document.getElementById('ipAddress');
const browserInfo = document.getElementById('browserInfo');
const platformInfo = document.getElementById('platformInfo');
const screenInfo = document.getElementById('screenInfo');
const sendEmailBtn = document.getElementById('sendEmail');
const sendWhatsAppBtn = document.getElementById('sendWhatsApp');
const sendSMSBtn = document.getElementById('sendSMS');
const emailInput = document.getElementById('emailInput');
const phoneInput = document.getElementById('phoneInput');
const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
const previewImage = document.getElementById('previewImage');
const previewVideo = document.getElementById('previewVideo');
const previewText = document.getElementById('previewText');
const downloadMediaBtn = document.getElementById('downloadMedia');

// Global variables
let stream = null;
let mediaRecorder = null;
let recordedChunks = [];
let timerInterval = null;
let seconds = 0;
let currentLocation = null;
let map = null;
let markers = [];
let currentMediaUrl = null;

// Initialize the application
function init() {
    // Set up event listeners
    setupEventListeners();
    
    // Initialize device info
    initDeviceInfo();
    
    // Initialize EmailJS (replace with your EmailJS user ID)
    emailjs.init('YOUR_EMAILJS_USER_ID');
}

// Set up all event listeners
function setupEventListeners() {
    // Camera controls
    startCameraBtn.addEventListener('click', startCamera);
    capturePhotoBtn.addEventListener('click', capturePhoto);
    startRecordingBtn.addEventListener('click', startRecording);
    stopRecordingBtn.addEventListener('click', stopRecording);
    
    // Location controls
    getLocationBtn.addEventListener('click', getLocation);
    showOnMapBtn.addEventListener('click', showOnMap);
    findStoresBtn.addEventListener('click', findNearbyStores);
    getRouteBtn.addEventListener('click', getDirections);
    
    // Communication controls
    sendEmailBtn.addEventListener('click', sendEmail);
    sendWhatsAppBtn.addEventListener('click', sendWhatsApp);
    sendSMSBtn.addEventListener('click', sendSMS);
    
    // Preview modal
    downloadMediaBtn.addEventListener('click', downloadMedia);
    
    // IP info
    ipInfo.addEventListener('click', getIPInfo);
}

// Initialize device information
function initDeviceInfo() {
    // Get browser info
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    
    if (userAgent.includes('Firefox')) browserName = 'Firefox';
    else if (userAgent.includes('Chrome')) browserName = 'Chrome';
    else if (userAgent.includes('Safari')) browserName = 'Safari';
    else if (userAgent.includes('Edge')) browserName = 'Edge';
    else if (userAgent.includes('Opera') || userAgent.includes('OPR/')) browserName = 'Opera';
    
    browserInfo.textContent = browserName;
    
    // Get platform info
    platformInfo.textContent = navigator.platform;
    
    // Get screen resolution
    screenInfo.textContent = `${window.screen.width} × ${window.screen.height}`;
    
    // Get IP info on page load
    getIPInfo();
}

// Camera functionality
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
                facingMode: 'environment'
            },
            audio: true // For video recording
        });
        
        // Set video source
        video.srcObject = stream;
        video.play();
        
        // Enable buttons
        capturePhotoBtn.disabled = false;
        startRecordingBtn.disabled = false;
        startCameraBtn.disabled = true;
        
        hideStatus();
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        showStatus('Could not access camera. Please check permissions.');
        capturePhotoBtn.disabled = true;
        startRecordingBtn.disabled = true;
    }
}

function capturePhoto() {
    if (!stream) return;
    
    try {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Show preview
        showPreview(canvas.toDataURL('image/png'), 'photo');
        
    } catch (error) {
        console.error('Error capturing photo:', error);
        showStatus('Error capturing photo');
    }
}

// Video recording functionality
function startRecording() {
    if (!stream) return;
    
    try {
        recordedChunks = [];
        
        // Create media recorder
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 2500000 // 2.5Mbps
        });
        
        // Handle data available event
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        // Handle recording stopped
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            showPreview(url, 'video');
            
            // Reset timer
            clearInterval(timerInterval);
            seconds = 0;
            recordingTime.classList.add('d-none');
        };
        
        // Start recording
        mediaRecorder.start(100); // Collect 100ms of data
        
        // Update UI
        startRecordingBtn.classList.add('d-none');
        stopRecordingBtn.classList.remove('d-none');
        capturePhotoBtn.disabled = true;
        
        // Start timer
        startTimer();
        
    } catch (error) {
        console.error('Error starting recording:', error);
        showStatus('Error starting recording');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        stopRecordingBtn.classList.add('d-none');
        startRecordingBtn.classList.remove('d-none');
        capturePhotoBtn.disabled = false;
    }
}

function startTimer() {
    recordingTime.classList.remove('d-none');
    
    timerInterval = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timer.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Location functionality
function getLocation() {
    if (!navigator.geolocation) {
        showStatus('Geolocation is not supported by your browser');
        return;
    }
    
    showStatus('Getting your location...');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
            };
            
            // Update UI
            locationInfo.innerHTML = `
                <p><i class="fas fa-map-marker-alt me-2"></i> 
                <strong>Latitude:</strong> ${currentLocation.lat.toFixed(6)}<br>
                <strong>Longitude:</strong> ${currentLocation.lng.toFixed(6)}<br>
                <strong>Accuracy:</strong> ${Math.round(currentLocation.accuracy)} meters</p>
            `;
            
            // Enable location-based buttons
            showOnMapBtn.disabled = false;
            findStoresBtn.disabled = false;
            getRouteBtn.disabled = false;
            
            // Get address from coordinates
            getAddressFromCoords(currentLocation.lat, currentLocation.lng);
            
            hideStatus();
            
        },
        (error) => {
            let errorMessage = 'Error getting location: ';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'User denied the request for geolocation.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'The request to get user location timed out.';
                    break;
                default:
                    errorMessage += 'An unknown error occurred.';
            }
            showStatus(errorMessage);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function showOnMap() {
    if (!currentLocation) return;
    
    // Initialize map if not already done
    if (!map) {
        map = new google.maps.Map(mapElement, {
            center: { lat: currentLocation.lat, lng: currentLocation.lng },
            zoom: 15,
            mapTypeControl: true,
            fullscreenControl: true
        });
    } else {
        map.setCenter({ lat: currentLocation.lat, lng: currentLocation.lng });
        map.setZoom(15);
    }
    
    // Clear existing markers
    clearMarkers();
    
    // Add current location marker
    addMarker(currentLocation.lat, currentLocation.lng, 'Your Location', 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png');
    
    // Show map
    mapElement.style.display = 'block';
    
    // Scroll to map
    mapElement.scrollIntoView({ behavior: 'smooth' });
}

function findNearbyStores() {
    if (!currentLocation || !map) return;
    
    const service = new google.maps.places.PlacesService(map);
    
    service.nearbySearch(
        {
            location: { lat: currentLocation.lat, lng: currentLocation.lng },
            radius: '1000', // 1km radius
            type: ['grocery_or_supermarket', 'supermarket']
        },
        (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                // Clear existing markers except current location
                clearMarkers();
                
                // Add markers for each store
                results.slice(0, 5).forEach(place => {
                    if (place.geometry && place.geometry.location) {
                        addMarker(
                            place.geometry.location.lat(),
                            place.geometry.location.lng(),
                            place.name,
                            'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                        );
                    }
                });
                
                // Show list of stores
                const storesList = results.slice(0, 5).map(place => 
                    `<li>${place.name} (${place.vicinity || 'Address not available'})</li>`
                ).join('');
                
                locationInfo.innerHTML += `
                    <div class="mt-3">
                        <h6>Nearby Grocery Stores:</h6>
                        <ul class="list-unstyled">
                            ${storesList}
                        </ul>
                    </div>
                `;
                
            } else {
                showStatus('Error finding nearby stores: ' + status);
            }
        }
    );
}

function getDirections() {
    if (!currentLocation) return;
    
    const destination = prompt('Enter destination address:');
    if (!destination) return;
    
    // Use Google Maps Directions Service
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    
    // Initialize map if not already done
    if (!map) {
        map = new google.maps.Map(mapElement, {
            center: { lat: currentLocation.lat, lng: currentLocation.lng },
            zoom: 15
        });
    }
    
    directionsRenderer.setMap(map);
    
    // Request directions
    directionsService.route(
        {
            origin: { lat: currentLocation.lat, lng: currentLocation.lng },
            destination: destination,
            travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
                mapElement.style.display = 'block';
                mapElement.scrollIntoView({ behavior: 'smooth' });
            } else {
                showStatus('Directions request failed: ' + status);
            }
        }
    );
}

// Communication functionality
function sendEmail() {
    const email = emailInput.value.trim();
    if (!email) {
        showStatus('Please enter a valid email address');
        return;
    }
    
    if (!currentMediaUrl) {
        showStatus('No media to send. Please capture a photo or video first.');
        return;
    }
    
    showStatus('Sending email...');
    
    // In a real app, you would use EmailJS or a backend service to send the email
    // This is a simplified example
    setTimeout(() => {
        showStatus('Email sent successfully!', 'success');
    }, 2000);
}

function sendWhatsApp() {
    const phone = phoneInput.value.trim();
    if (!phone) {
        showStatus('Please enter a phone number with country code');
        return;
    }
    
    if (!currentMediaUrl) {
        showStatus('No media to send. Please capture a photo or video first.');
        return;
    }
    
    // Open WhatsApp with the media
    const message = 'Check out this media I captured!';
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function sendSMS() {
    const phone = phoneInput.value.trim();
    if (!phone) {
        showStatus('Please enter a phone number with country code');
        return;
    }
    
    // In a real app, you would use Twilio or another SMS API
    // This is just a placeholder
    showStatus('SMS functionality requires a backend service like Twilio', 'warning');
}

// IP and Device Info
async function getIPInfo() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        ipAddress.innerHTML = `
            <strong>IP:</strong> ${data.ip}<br>
            <strong>Location:</strong> ${data.city}, ${data.region}, ${data.country_name}<br>
            <strong>ISP:</strong> ${data.org || 'Unknown'}
        `;
        
    } catch (error) {
        console.error('Error getting IP info:', error);
        ipAddress.textContent = 'Could not retrieve IP information';
    }
}

// Helper functions
function showStatus(message, type = 'info') {
    cameraStatus.textContent = message;
    cameraStatus.className = 'status-message';
    cameraStatus.classList.add(`alert-${type}`);
    cameraStatus.style.display = 'flex';
}

function hideStatus() {
    cameraStatus.style.display = 'none';
}

function showPreview(url, type) {
    currentMediaUrl = url;
    
    if (type === 'photo') {
        previewImage.src = url;
        previewImage.classList.remove('d-none');
        previewVideo.classList.add('d-none');
        previewText.textContent = 'Preview of captured photo';
    } else if (type === 'video') {
        previewVideo.src = url;
        previewVideo.classList.remove('d-none');
        previewImage.classList.add('d-none');
        previewText.textContent = 'Preview of recorded video';
    }
    
    // Show the modal
    previewModal.show();
}

function downloadMedia() {
    if (!currentMediaUrl) return;
    
    const a = document.createElement('a');
    a.href = currentMediaUrl;
    a.download = `capture-${new Date().toISOString().replace(/[:.]/g, '-')}.${currentMediaUrl.includes('image') ? 'png' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Show feedback
    const originalText = downloadMediaBtn.innerHTML;
    downloadMediaBtn.innerHTML = '<i class="fas fa-check me-1"></i> Downloaded!';
    setTimeout(() => {
        downloadMediaBtn.innerHTML = originalText;
    }, 2000);
}

function addMarker(lat, lng, title, iconUrl) {
    const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title,
        icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(32, 32)
        }
    });
    
    markers.push(marker);
    return marker;
}

function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

async function getAddressFromCoords(lat, lng) {
    try {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=YOUR_GOOGLE_MAPS_API_KEY`);
        const data = await response.json();
        
        if (data.results && data.results[0]) {
            const address = data.results[0].formatted_address;
            locationInfo.innerHTML += `<p class="mt-2"><i class="fas fa-home me-2"></i> <strong>Address:</strong> ${address}</p>`;
        }
    } catch (error) {
        console.error('Error getting address:', error);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
