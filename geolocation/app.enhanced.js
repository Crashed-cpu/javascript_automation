// Geolocation Tracker with Multi-Service Geocoding

// Cache for geocoding results
const geocodeCache = new Map();

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const locationInfo = document.getElementById('locationInfo');
    const latitudeEl = document.getElementById('latitude');
    const longitudeEl = document.getElementById('longitude');
    const accuracyEl = document.getElementById('accuracy');
    const addressEl = document.getElementById('address');
    
    // Initialize map and marker
    let map;
    let marker;
    let watchId;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    // Show status message with optional error styling
    function showStatus(message, isError = false, isWarning = false) {
        if (!locationInfo) return;
        
        const alertClass = isError ? 'alert-danger' : (isWarning ? 'alert-warning' : 'alert-info');
        const iconClass = isError ? 'fa-exclamation-triangle' : (isWarning ? 'fa-exclamation-circle' : 'fa-info-circle');
        
        locationInfo.innerHTML = `
            <div class="alert ${alertClass} d-flex align-items-center">
                <i class="fas ${iconClass} me-2"></i>
                <div>${message}</div>
                ${isWarning ? '<button class="btn btn-sm btn-outline-dark ms-auto" id="retryBtn">Retry</button>' : ''}
            </div>
        `;
        
        // Add event listener for retry button if it exists
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', initGeolocation);
        }
    }

    // Initialize or update the map with accuracy circle
    function updateMap(lat, lng, accuracy) {
        // Store accuracy for map updates
        window.currentAccuracy = accuracy;
        
        // Initialize map if it doesn't exist
        if (!map) {
            map = L.map('map').setView([lat, lng], 15);
            
            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Custom marker icon
            const icon = L.divIcon({
                className: 'location-marker',
                iconSize: [24, 24],
                html: '📍'
            });
            
            // Add marker
            marker = L.marker([lat, lng], { icon: icon })
                .addTo(map)
                .bindPopup('Your Location')
                .openPopup();
            
            // Add accuracy circle
            if (accuracy) {
                L.circle([lat, lng], {
                    radius: accuracy,
                    color: '#3388ff',
                    fillColor: '#3388ff',
                    fillOpacity: 0.2
                }).addTo(map);
            }
        } else {
            // Update existing marker and view
            marker.setLatLng([lat, lng]);
            map.setView([lat, lng]);
            
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
            }
        }
    }

    // Get address using multiple geocoding services with fallbacks
    async function getAddress(lat, lng) {
        if (!addressEl) return;
        
        // Generate cache key
        const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        
        // Check cache first
        if (geocodeCache.has(cacheKey)) {
            updateAddressDisplay(geocodeCache.get(cacheKey), lat, lng);
            return;
        }
        
        // Show loading state
        addressEl.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <span>Looking up address...</span>
            </div>
        `;
        
        try {
            // Try multiple geocoding services in parallel
            const [nominatimResult, locationIQResult] = await Promise.allSettled([
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`),
                fetch(`https://us1.locationiq.com/v1/reverse.php?key=pk.1234567890&lat=${lat}&lon=${lng}&format=json`)
            ]);
            
            // Process results
            let bestResult = null;
            
            // Check Nominatim result
            if (nominatimResult.status === 'fulfilled' && nominatimResult.value.ok) {
                const data = await nominatimResult.value.json();
                bestResult = formatNominatimResult(data, lat, lng);
            }
            
            // Check LocationIQ result (if available and better)
            if (locationIQResult.status === 'fulfilled' && locationIQResult.value.ok) {
                const data = await locationIQResult.value.json();
                const locationIQFormatted = formatLocationIQResult(data, lat, lng);
                
                // Use LocationIQ result if it has better accuracy or if we don't have a result yet
                if (!bestResult || (locationIQFormatted.confidence > (bestResult.confidence || 0))) {
                    bestResult = locationIQFormatted;
                }
            }
            
            // Fallback to simple coordinates if no good result
            if (!bestResult) {
                bestResult = {
                    line1: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                    line2: 'Address not available',
                    confidence: 0
                };
            }
            
            // Cache the result
            geocodeCache.set(cacheKey, bestResult);
            
            // Update the UI
            updateAddressDisplay(bestResult, lat, lng);
            
        } catch (error) {
            console.error('Geocoding error:', error);
            addressEl.innerHTML = `
                <div class="alert alert-warning p-2 mb-0">
                    <i class="fas fa-exclamation-triangle me-1"></i>
                    Could not determine address. Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}
                </div>
            `;
        }
    }
    
    // Format Nominatim API response
    function formatNominatimResult(data, lat, lng) {
        if (!data || !data.address) return null;
        
        const addr = data.address;
        const parts = [];
        let line1 = '';
        let line2 = '';
        
        // Build address parts
        if (addr.road) {
            line1 = addr.road;
            if (addr.house_number) {
                line1 = `${addr.house_number} ${line1}`;
            }
        }
        
        // Add city/town/village
        if (addr.city || addr.town || addr.village) {
            line2 = addr.city || addr.town || addr.village;
        }
        
        // Add state and country if available
        if (addr.state) {
            if (line2) line2 += ', ';
            line2 += addr.state;
        }
        if (addr.country) {
            if (line2) line2 += ', ';
            line2 += addr.country;
        }
        
        // If we still don't have an address, use the display name
        if (!line1 && data.display_name) {
            const parts = data.display_name.split(',');
            line1 = parts[0].trim();
            if (!line2) {
                line2 = parts.slice(1, 3).join(',').trim();
            }
        }
        
        return {
            line1: line1 || 'Location',
            line2: line2 || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            confidence: calculateConfidence(addr),
            service: 'OpenStreetMap Nominatim',
            raw: data
        };
    }
    
    // Format LocationIQ API response
    function formatLocationIQResult(data, lat, lng) {
        if (!data || !data.address) return null;
        
        const addr = data.address;
        let line1 = '';
        let line2 = '';
        
        // Build address parts
        if (addr.road) {
            line1 = addr.road;
            if (addr.house_number) {
                line1 = `${addr.house_number} ${line1}`;
            }
        } else if (addr.pedestrian) {
            line1 = addr.pedestrian;
        } else if (addr.footway) {
            line1 = addr.footway;
        }
        
        // Add city/town/village
        if (addr.city || addr.town || addr.village) {
            line2 = addr.city || addr.town || addr.village;
        }
        
        // Add state and country if available
        if (addr.state) {
            if (line2) line2 += ', ';
            line2 += addr.state;
        }
        if (addr.country) {
            if (line2) line2 += ', ';
            line2 += addr.country;
        }
        
        // If we still don't have an address, use the display name
        if (!line1 && data.display_name) {
            const parts = data.display_name.split(',');
            line1 = parts[0].trim();
            if (!line2) {
                line2 = parts.slice(1, 3).join(',').trim();
            }
        }
        
        return {
            line1: line1 || 'Location',
            line2: line2 || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            confidence: calculateConfidence(addr),
            service: 'LocationIQ',
            raw: data
        };
    }
    
    // Calculate confidence score based on address components
    function calculateConfidence(addr) {
        let score = 0;
        
        // Higher scores for more specific address components
        if (addr.house_number) score += 40;
        if (addr.road) score += 30;
        if (addr.suburb || addr.city_district) score += 20;
        if (addr.city || addr.town || addr.village) score += 10;
        
        return Math.min(100, score);
    }
    
    // Update the address display in the UI
    function updateAddressDisplay(result, lat, lng) {
        if (!addressEl) return;
        
        let addressHTML = '';
        
        if (result.line1) {
            addressHTML += `<div class="fw-bold mb-1">${result.line1}</div>`;
        }
        
        if (result.line2) {
            addressHTML += `<div class="text-muted">${result.line2}</div>`;
        } else {
            // Fallback to coordinates if no address lines
            addressHTML += `
                <div class="alert alert-warning p-2 mb-0">
                    <i class="fas fa-info-circle me-1"></i>
                    Precise address not available. Coordinates: 
                    ${lat.toFixed(6)}, ${lng.toFixed(6)}
                </div>
            `;
        }
        
        // Add service attribution if available
        if (result.service) {
            addressHTML += `
                <div class="small text-muted mt-2">
                    <i class="fas fa-map-marker-alt me-1"></i>
                    ${result.service}
                </div>
            `;
        }
        
        addressEl.innerHTML = addressHTML;
    }

    // Initialize geolocation
    function initGeolocation() {
        // Clear any existing watch
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
        }

        // Check if geolocation is supported
        if (!navigator.geolocation) {
            showStatus('Geolocation is not supported by your browser', true);
            return;
        }

        // Show loading status
        if (retryCount === 0) {
            showStatus('Getting your location...');
        } else {
            showStatus(`Trying to improve accuracy (attempt ${retryCount + 1}/${MAX_RETRIES})...`, false, true);
        }

        // High accuracy options
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        // Success callback
        function success(position) {
            const { latitude, longitude, accuracy } = position.coords;
            
            // Update the UI
            if (latitudeEl) latitudeEl.textContent = latitude.toFixed(8);
            if (longitudeEl) longitudeEl.textContent = longitude.toFixed(8);
            if (accuracyEl) {
                accuracyEl.textContent = `${Math.round(accuracy)} meters`;
                // Color code accuracy
                accuracyEl.className = accuracy < 20 ? 'text-success' : 
                                     accuracy < 100 ? 'text-warning' : 'text-danger';
            }
            
            // Update the map
            updateMap(latitude, longitude, accuracy);
            
            // Get the address
            getAddress(latitude, longitude);
            
            // If accuracy is poor, try to get a better fix
            if (accuracy > 50 && retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(() => {
                    navigator.geolocation.getCurrentPosition(success, error, options);
                }, 1000);
                return;
            }
            
            // Reset retry counter if we have a good fix
            retryCount = 0;
            
            // Show success message
            showStatus('Location updated successfully');
            
            // Clear status after delay
            setTimeout(() => {
                if (locationInfo && !locationInfo.querySelector('#retryBtn')) {
                    locationInfo.innerHTML = '';
                }
            }, 3000);
        }

        // Error callback
        function error(err) {
            console.error('Geolocation error:', err);
            let message = 'Unable to retrieve your location. ';
            
            switch(err.code) {
                case err.PERMISSION_DENIED:
                    message = 'Location permission denied. Please enable location access in your browser settings.';
                    break;
                case err.POSITION_UNAVAILABLE:
                    message = 'Location information is unavailable. Please check your connection and try again.';
                    break;
                case err.TIMEOUT:
                    message = 'The request to get your location timed out. Please try again.';
                    break;
                default:
                    message = 'An unknown error occurred while getting your location.';
            }
            
            showStatus(message, true);
        }

        // Start watching position
        watchId = navigator.geolocation.watchPosition(success, error, options);
        
        // Also try to get current position immediately
        navigator.geolocation.getCurrentPosition(success, error, options);
    }

    // Start the geolocation
    initGeolocation();

    // Clean up on page unload
    window.addEventListener('beforeunload', function() {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
        }
    });
    
    // Add some basic styles for the map container
    const style = document.createElement('style');
    style.textContent = `
        #map { 
            height: 300px; 
            width: 100%;
            border-radius: 8px;
            border: 1px solid #ddd;
        }
        .location-marker {
            font-size: 24px;
            text-shadow: 0 0 3px white;
            transform: translate(-12px, -24px);
        }
        .text-success { color: #198754 !important; }
        .text-warning { color: #ffc107 !important; }
        .text-danger { color: #dc3545 !important; }
    `;
    document.head.appendChild(style);
});
