// High-Accuracy Geolocation with Google Maps Geocoding
// Uses browser's geolocation API with Google Maps for best accuracy

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const locationInfo = document.getElementById('locationInfo');
    const latitudeEl = document.getElementById('latitude');
    const longitudeEl = document.getElementById('longitude');
    const accuracyEl = document.getElementById('accuracy');
    const addressEl = document.getElementById('address');
    
    // State
    let map;
    let marker;
    let watchId;
    let bestPosition = null;
    let geocodingAttempts = 0;
    const MAX_ATTEMPTS = 5;
    const TARGET_ACCURACY = 20; // meters
    
    // Show status message
    function showStatus(message, isError = false, showRetry = false) {
        if (!locationInfo) return;
        
        const alertClass = isError ? 'alert-danger' : 'alert-info';
        const icon = isError ? '⚠️' : '⏳';
        
        locationInfo.innerHTML = `
            <div class="alert ${alertClass} d-flex align-items-center">
                <span class="me-2">${icon}</span>
                <div class="flex-grow-1">${message}</div>
                ${showRetry ? '<button class="btn btn-sm btn-outline-dark" id="retryBtn">Retry</button>' : ''}
            </div>
        `;
        
        // Add retry button handler if needed
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', initGeolocation);
        }
    }
    
    // Initialize the map
    function initMap(lat, lng, accuracy) {
        if (!map) {
            map = L.map('map').setView([lat, lng], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(map);
        }
        
        // Update marker
        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            // Custom marker icon
            const icon = L.divIcon({
                className: 'location-marker',
                iconSize: [24, 24],
                html: '📍',
                popupAnchor: [0, -12]
            });
            
            marker = L.marker([lat, lng], { icon: icon })
                .addTo(map)
                .bindPopup('Your Location')
                .openPopup();
        }
        
        // Update accuracy circle
        if (window.accuracyCircle) {
            map.removeLayer(window.accuracyCircle);
        }
        
        if (accuracy) {
            window.accuracyCircle = L.circle([lat, lng], {
                radius: accuracy,
                color: '#3388ff',
                fillColor: '#3388ff',
                fillOpacity: 0.2
            }).addTo(map);
            
            // Adjust zoom based on accuracy
            const zoom = accuracy < 50 ? 16 : (accuracy < 200 ? 15 : 14);
            map.setView([lat, lng], zoom);
        }
    }
    
    // Get address using Google Maps Geocoding API
    async function getGoogleAddress(lat, lng) {
        if (!addressEl) return;
        
        // Show loading state
        addressEl.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span>Getting precise address from Google Maps...</span>
            </div>
        `;
        
        try {
            // Try Google Maps Geocoding API first
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=YOUR_GOOGLE_MAPS_API_KEY`
            );
            
            if (!response.ok) throw new Error('Google Maps request failed');
            
            const data = await response.json();
            
            if (data.status === 'OK' && data.results && data.results.length > 0) {
                // Format the best result
                const result = data.results[0];
                updateAddressDisplay({
                    line1: result.formatted_address.split(',')[0],
                    line2: result.formatted_address.split(',').slice(1).join(',').trim(),
                    confidence: 95, // Google is very reliable
                    service: 'Google Maps',
                    raw: result
                });
                return;
            }
            
            // Fallback to OpenStreetMap if Google fails
            throw new Error('No results from Google Maps');
            
        } catch (error) {
            console.error('Google Maps geocoding error:', error);
            // Fall back to OpenStreetMap
            getOSMAddress(lat, lng);
        }
    }
    
    // Fallback to OpenStreetMap for address
    async function getOSMAddress(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            
            if (!response.ok) throw new Error('OSM request failed');
            
            const data = await response.json();
            const addr = data.address || {};
            
            // Format address
            let line1 = '';
            if (addr.road) {
                line1 = addr.house_number ? `${addr.house_number} ${addr.road}` : addr.road;
            }
            
            let line2 = [];
            if (addr.suburb) line2.push(addr.suburb);
            if (addr.city || addr.town || addr.village) {
                line2.push(addr.city || addr.town || addr.village);
            }
            if (addr.state) line2.push(addr.state);
            if (addr.country) line2.push(addr.country);
            
            updateAddressDisplay({
                line1: line1 || 'Location',
                line2: line2.length > 0 ? line2.join(', ') : `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                confidence: 70, // OSM is less reliable than Google
                service: 'OpenStreetMap',
                raw: data
            });
            
        } catch (error) {
            console.error('OSM geocoding error:', error);
            // Last resort - just show coordinates
            addressEl.innerHTML = `
                <div class="alert alert-warning p-2 mb-0">
                    <i class="fas fa-exclamation-triangle me-1"></i>
                    Could not determine address. Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}
                </div>
            `;
        }
    }
    
    // Update the address display
    function updateAddressDisplay(result) {
        if (!addressEl) return;
        
        let html = '';
        
        if (result.line1) {
            html += `<div class="fw-bold mb-1">${result.line1}</div>`;
        }
        
        if (result.line2) {
            html += `<div class="text-muted">${result.line2}</div>`;
        }
        
        // Add service attribution
        html += `
            <div class="small text-muted mt-2">
                <i class="fas fa-map-marker-alt me-1"></i>
                ${result.service} ${result.confidence ? `(${result.confidence}% confidence)` : ''}
            </div>
        `;
        
        addressEl.innerHTML = html;
    }
    
    // Handle new position data
    function handleNewPosition(position) {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Update position if it's better than the current one
        if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
            
            // Update UI
            if (latitudeEl) latitudeEl.textContent = latitude.toFixed(8);
            if (longitudeEl) longitudeEl.textContent = longitude.toFixed(8);
            if (accuracyEl) {
                accuracyEl.textContent = `${Math.round(accuracy)} m`;
                // Color code accuracy
                accuracyEl.className = accuracy <= 20 ? 'text-success' : 
                                     accuracy <= 100 ? 'text-warning' : 'text-danger';
            }
            
            // Update map
            initMap(latitude, longitude, accuracy);
            
            // Get address if accuracy is good enough
            if (accuracy <= TARGET_ACCURACY || geocodingAttempts >= MAX_ATTEMPTS) {
                // Use Google Maps for best accuracy
                getGoogleAddress(latitude, longitude);
                
                // If we've reached the target accuracy, we can stop watching
                if (accuracy <= TARGET_ACCURACY && watchId) {
                    navigator.geolocation.clearWatch(watchId);
                    watchId = null;
                    showStatus('High accuracy location locked', false);
                }
            } else if (geocodingAttempts === 0) {
                // Show initial loading message
                showStatus(`Improving accuracy... (${Math.round(accuracy)}m)`, false, true);
                geocodingAttempts++;
            }
        }
    }
    
    // Handle geolocation errors
    function handleError(error) {
        console.error('Geolocation error:', error);
        
        let message = 'Unable to get your location. ';
        let isError = true;
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = 'Location access was denied. Please enable location permissions in your browser settings.';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Location information is unavailable. Please check your internet connection.';
                isError = true;
                break;
            case error.TIMEOUT:
                message = 'The request to get your location timed out. ';
                if (geocodingAttempts < MAX_ATTEMPTS) {
                    message += 'Trying again...';
                    isError = false;
                    geocodingAttempts++;
                    setTimeout(initGeolocation, 1000);
                }
                break;
            default:
                message = 'An unknown error occurred while getting your location.';
        }
        
        showStatus(message, isError, true);
    }
    
    // Initialize geolocation
    function initGeolocation() {
        // Reset state
        bestPosition = null;
        geocodingAttempts = 0;
        
        // Clear any existing watch
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
        }
        
        // Check if geolocation is supported
        if (!navigator.geolocation) {
            showStatus('Geolocation is not supported by your browser', true);
            return;
        }
        
        // Show initial status
        showStatus('Getting your precise location...', false, true);
        
        // High accuracy options
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };
        
        // Start watching position
        watchId = navigator.geolocation.watchPosition(
            handleNewPosition,
            handleError,
            options
        );
        
        // Also try to get current position immediately
        navigator.geolocation.getCurrentPosition(
            handleNewPosition,
            handleError,
            options
        );
    }
    
    // Start the geolocation process
    initGeolocation();
    
    // Clean up on page unload
    window.addEventListener('beforeunload', function() {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
        }
    });
    
    // Add some basic styles
    const style = document.createElement('style');
    style.textContent = `
        #map { 
            height: 300px; 
            width: 100%;
            border-radius: 8px;
            border: 1px solid #ddd;
            margin-bottom: 1rem;
        }
        .location-marker {
            font-size: 24px;
            text-shadow: 0 0 3px white;
            transform: translate(-12px, -24px);
        }
        .text-success { color: #198754 !important; }
        .text-warning { color: #ffc107 !important; }
        .text-danger { color: #dc3545 !important; }
        .coordinates {
            font-family: monospace;
            background: #f8f9fa;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
        }
    `;
    document.head.appendChild(style);
});
