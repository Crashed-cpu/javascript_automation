// Google Maps API Key - Replace with your actual API key
const API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

// Global variables
let map;
let markers = [];
let directionsService;
let directionsRenderer;
let autocomplete;
let placesService;
let currentInfoWindow = null;

// Initialize the map when the page loads
function initMap() {
    // Default coordinates (New York)
    const defaultLocation = { lat: 40.7128, lng: -74.0060 };
    
    // Create the map
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 12,
        mapTypeId: 'roadmap',
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
    
    // Initialize services
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        panel: document.getElementById('directions')
    });
    
    placesService = new google.maps.places.PlacesService(map);
    
    // Initialize autocomplete for search
    initAutocomplete();
    
    // Add click event listener to the map
    map.addListener('click', (event) => {
        addMarker(event.latLng);
    });
    
    // Load saved locations from localStorage
    loadSavedLocations();
    
    // Set up UI event listeners
    setupEventListeners();
    
    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Center the map on the user's location
                map.setCenter(pos);
                
                // Add a marker at the user's location
                addMarker(pos, 'My Location', true);
            },
            () => {
                // Handle location error
                console.warn('Geolocation service failed. Using default location.');
            }
        );
    }
}

// Initialize the autocomplete functionality
function initAutocomplete() {
    const searchInput = document.getElementById('searchInput');
    
    autocomplete = new google.maps.places.Autocomplete(searchInput, {
        fields: ['name', 'geometry', 'formatted_address'],
        types: ['establishment', 'geocode']
    });
    
    // When a place is selected from the dropdown
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry) {
            // User entered the name of a Place that was not suggested and
            // pressed the Enter key, or the Place Details request failed.
            showAlert('No details available for input: ' + place.name, 'warning');
            return;
        }
        
        // If the place has a geometry, then present it on a map.
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(17);
        }
        
        // Add a marker for the selected place
        addMarker(place.geometry.location, place.name || place.formatted_address);
    });
    
    // Handle search button click
    document.getElementById('searchButton').addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            searchPlaces(query);
        }
    });
}

// Add a marker to the map
function addMarker(location, title = 'New Location', isUserLocation = false) {
    // Close any open info windows
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }
    
    // Create a new marker
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        title: title,
        animation: google.maps.Animation.DROP,
        icon: isUserLocation ? {
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        } : null
    });
    
    // Add click event to the marker
    marker.addListener('click', () => {
        showMarkerInfo(marker, title, location);
    });
    
    // Add to markers array
    markers.push(marker);
    
    // If not the user's location, show the save location modal
    if (!isUserLocation) {
        showSaveLocationModal(title, location);
    }
    
    return marker;
}

// Show info window for a marker
function showMarkerInfo(marker, title, location) {
    // Close any open info windows
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }
    
    // Create content for the info window
    const content = `
        <div class="p-2">
            <h6>${title}</h6>
            <p class="mb-1">Lat: ${location.lat().toFixed(6)}</p>
            <p class="mb-2">Lng: ${location.lng().toFixed(6)}</p>
            <div class="d-grid gap-2">
                <button class="btn btn-sm btn-primary" onclick="getDirectionsToHere(${location.lat()}, ${location.lng()})">
                    <i class="fas fa-directions me-1"></i> Get Directions
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="removeMarker(${markers.indexOf(marker)})">
                    <i class="fas fa-trash me-1"></i> Remove
                </button>
            </div>
        </div>
    `;
    
    // Create and open the info window
    currentInfoWindow = new google.maps.InfoWindow({
        content: content
    });
    
    currentInfoWindow.open(map, marker);
}

// Show save location modal
function showSaveLocationModal(title, location) {
    const modal = new bootstrap.Modal(document.getElementById('addLocationModal'));
    const locationNameInput = document.getElementById('locationName');
    
    // Set default name if available
    if (title && title !== 'New Location') {
        locationNameInput.value = title;
    } else {
        locationNameInput.value = '';
    }
    
    // Handle save button click
    document.getElementById('saveLocationBtn').onclick = () => {
        const name = locationNameInput.value.trim() || 'Unnamed Location';
        saveLocation(name, location.lat(), location.lng());
        modal.hide();
    };
    
    modal.show();
}

// Save location to localStorage
function saveLocation(name, lat, lng) {
    const savedLocations = JSON.parse(localStorage.getItem('savedLocations') || '[]');
    
    // Check if location already exists
    const exists = savedLocations.some(loc => 
        loc.lat === lat && loc.lng === lng
    );
    
    if (!exists) {
        const newLocation = { name, lat, lng };
        savedLocations.push(newLocation);
        localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
        
        // Update the UI
        addLocationToUI(newLocation, savedLocations.length - 1);
        showAlert('Location saved successfully!', 'success');
    } else {
        showAlert('This location is already saved.', 'info');
    }
}

// Load saved locations from localStorage
function loadSavedLocations() {
    const savedLocations = JSON.parse(localStorage.getItem('savedLocations') || '[]');
    
    savedLocations.forEach((location, index) => {
        // Add marker to map
        const marker = addMarker(
            { lat: parseFloat(location.lat), lng: parseFloat(location.lng) },
            location.name
        );
        
        // Add to UI list
        addLocationToUI(location, index);
    });
}

// Add location to the UI list
function addLocationToUI(location, index) {
    const container = document.getElementById('savedLocations');
    
    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    item.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-map-marker-alt text-primary me-2"></i>
            <span>${location.name}</span>
        </div>
        <div class="btn-group">
            <button class="btn btn-sm btn-outline-primary" onclick="centerOnLocation(${location.lat}, ${location.lng})">
                <i class="fas fa-location-arrow"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="removeSavedLocation(${index}, event)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    container.appendChild(item);
}

// Center the map on a location
function centerOnLocation(lat, lng) {
    const location = new google.maps.LatLng(lat, lng);
    map.setCenter(location);
    map.setZoom(15);
    
    // Find and highlight the marker
    markers.forEach(marker => {
        if (marker.getPosition().lat() === lat && marker.getPosition().lng() === lng) {
            // Trigger click on the marker to show its info window
            google.maps.event.trigger(marker, 'click');
        }
    });
}

// Remove a saved location
function removeSavedLocation(index, event) {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to remove this location?')) {
        const savedLocations = JSON.parse(localStorage.getItem('savedLocations') || '[]');
        savedLocations.splice(index, 1);
        localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
        
        // Refresh the UI
        document.getElementById('savedLocations').innerHTML = '';
        loadSavedLocations();
        
        showAlert('Location removed.', 'info');
    }
}

// Remove a marker from the map
function removeMarker(index) {
    if (index >= 0 && index < markers.length) {
        markers[index].setMap(null);
        markers.splice(index, 1);
        
        if (currentInfoWindow) {
            currentInfoWindow.close();
            currentInfoWindow = null;
        }
    }
}

// Get directions to a location
function getDirectionsToHere(lat, lng) {
    document.getElementById('toInput').value = `${lat}, ${lng}`;
    document.getElementById('directionsPanel').classList.remove('d-none');
    document.getElementById('directionsPanel').scrollIntoView({ behavior: 'smooth' });
}

// Calculate and display directions
function calculateAndDisplayRoute() {
    const from = document.getElementById('fromInput').value;
    const to = document.getElementById('toInput').value;
    
    if (!from || !to) {
        showAlert('Please enter both starting point and destination.', 'warning');
        return;
    }
    
    directionsService.route(
        {
            origin: from,
            destination: to,
            travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(response);
                document.getElementById('directionsPanel').classList.remove('d-none');
            } else {
                showAlert('Directions request failed: ' + status, 'danger');
            }
        }
    );
}

// Search for places
function searchPlaces(query) {
    const request = {
        query: query,
        fields: ['name', 'geometry', 'formatted_address']
    };
    
    placesService.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results[0]) {
            const place = results[0];
            
            // Center the map on the first result
            map.setCenter(place.geometry.location);
            
            // Add a marker
            addMarker(place.geometry.location, place.name);
        } else {
            showAlert('No results found for: ' + query, 'warning');
        }
    });
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Set up event listeners
function setupEventListeners() {
    // Map type buttons
    document.getElementById('roadmapBtn').addEventListener('click', () => {
        map.setMapTypeId('roadmap');
        updateMapTypeButtons('roadmapBtn');
    });
    
    document.getElementById('satelliteBtn').addEventListener('click', () => {
        map.setMapTypeId('satellite');
        updateMapTypeButtons('satelliteBtn');
    });
    
    document.getElementById('terrainBtn').addEventListener('click', () => {
        map.setMapTypeId('terrain');
        updateMapTypeButtons('terrainBtn');
    });
    
    // Directions button
    document.getElementById('getDirectionsBtn').addEventListener('click', calculateAndDisplayRoute);
    
    // Search on Enter key
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query) {
                searchPlaces(query);
            }
        }
    });
}

// Update active state of map type buttons
function updateMapTypeButtons(activeId) {
    ['roadmapBtn', 'satelliteBtn', 'terrainBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (id === activeId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Make functions available globally
window.centerOnLocation = centerOnLocation;
window.removeSavedLocation = removeSavedLocation;
window.getDirectionsToHere = getDirectionsToHere;
