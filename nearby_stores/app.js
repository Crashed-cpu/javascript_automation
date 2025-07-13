// Google Maps API Key - Replace with your actual API key
const API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';

// Global variables
let map;
let infoWindow;
let markers = [];
let placesService;
let currentLocation = null;
let currentPositionMarker = null;
let currentInfoWindow = null;
let selectedStore = null;
let favorites = JSON.parse(localStorage.getItem('storeFavorites')) || [];

// Store categories with icons
const STORE_CATEGORIES = {
    'restaurant': { name: 'Restaurants', icon: 'utensils' },
    'cafe': { name: 'Cafés', icon: 'coffee' },
    'supermarket': { name: 'Supermarkets', icon: 'shopping-cart' },
    'pharmacy': { name: 'Pharmacies', icon: 'pills' },
    'clothing_store': { name: 'Clothing Stores', icon: 'tshirt' },
    'electronics_store': { name: 'Electronics', icon: 'mobile-alt' },
    'grocery_or_supermarket': { name: 'Grocery', icon: 'shopping-basket' },
    'shopping_mall': { name: 'Shopping Malls', icon: 'store' },
    'convenience_store': { name: 'Convenience Stores', icon: 'store-alt' },
    'department_store': { name: 'Department Stores', icon: 'store' }
};

// Initialize the map when the page loads
function initMap() {
    // Default to New York if geolocation is not available
    const defaultLocation = { lat: 40.7128, lng: -74.0060 };
    
    // Create the map
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultLocation,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'transit',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
    
    // Initialize services
    placesService = new google.maps.places.PlacesService(map);
    infoWindow = new google.maps.InfoWindow();
    
    // Set up event listeners
    setupEventListeners();
    
    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                currentLocation = pos;
                map.setCenter(pos);
                addCurrentLocationMarker(pos);
                findNearbyStores(pos);
            },
            () => {
                // If geolocation fails, use default location
                currentLocation = defaultLocation;
                findNearbyStores(defaultLocation);
                showAlert('Geolocation service failed. Using default location.', 'warning');
            }
        );
    } else {
        // Browser doesn't support Geolocation
        currentLocation = defaultLocation;
        findNearbyStores(defaultLocation);
        showAlert('Geolocation is not supported by your browser. Using default location.', 'warning');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Search button click
    document.getElementById('searchButton').addEventListener('click', handleSearch);
    
    // Search input enter key
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Use my location button
    document.getElementById('useMyLocation').addEventListener('click', useMyLocation);
    
    // Apply filters button
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    
    // Map controls
    document.getElementById('locateMe').addEventListener('click', centerOnMyLocation);
    document.getElementById('zoomIn').addEventListener('click', () => map.setZoom(map.getZoom() + 1));
    document.getElementById('zoomOut').addEventListener('click', () => map.setZoom(map.getZoom() - 1));
    
    // Store details modal events
    document.getElementById('getDirections').addEventListener('click', getDirections);
    document.getElementById('saveToFavorites').addEventListener('click', toggleFavorite);
}

// Handle search
function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    const request = {
        query: query,
        fields: ['name', 'geometry', 'formatted_address']
    };
    
    showLoading(true);
    
    // Use Places API to find the location
    const placesService = new google.maps.places.PlacesService(map);
    placesService.findPlaceFromQuery(request, (results, status) => {
        showLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && results[0]) {
            const place = results[0];
            const location = place.geometry.location;
            
            // Update current location
            currentLocation = { lat: location.lat(), lng: location.lng() };
            
            // Move map to the searched location
            map.setCenter(currentLocation);
            
            // Find nearby stores
            findNearbyStores(currentLocation);
        } else {
            showAlert('No results found for: ' + query, 'warning');
        }
    });
}

// Find nearby stores
function findNearbyStores(location) {
    if (!location) return;
    
    // Clear existing markers
    clearMarkers();
    
    // Get selected category
    const category = document.getElementById('categorySelect').value;
    const radius = parseInt(document.getElementById('distanceSelect').value) * 1000; // Convert km to meters
    const minRating = parseFloat(document.getElementById('ratingSelect').value);
    const openNow = document.getElementById('openNowCheck').checked;
    
    // Create request
    const request = {
        location: location,
        radius: radius,
        type: category || ['store', 'food', 'point_of_interest'],
        openNow: openNow
    };
    
    showLoading(true);
    
    // Search for nearby places
    placesService.nearbySearch(request, (results, status, pagination) => {
        showLoading(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Filter results by minimum rating if specified
            let filteredResults = results;
            if (minRating > 0) {
                filteredResults = results.filter(place => 
                    place.rating && place.rating >= minRating
                );
            }
            
            // Update results count
            document.getElementById('resultsCount').textContent = `${filteredResults.length} ${filteredResults.length === 1 ? 'result' : 'results'}`;
            
            // Display results
            displayStores(filteredResults);
            
            // Add markers to map
            addMarkers(filteredResults);
            
            // Show/hide no results message
            document.getElementById('noResults').style.display = 
                filteredResults.length === 0 ? 'block' : 'none';
            
            // Handle pagination if available
            if (pagination && pagination.hasNextPage) {
                // You could add a "Load more" button here
            }
        } else {
            showAlert('Error finding nearby stores: ' + status, 'danger');
            document.getElementById('noResults').style.display = 'block';
        }
    });
}

// Display stores in the sidebar
function displayStores(stores) {
    const storesList = document.getElementById('storesList');
    storesList.innerHTML = '';
    
    if (stores.length === 0) {
        document.getElementById('noResults').style.display = 'block';
        return;
    }
    
    stores.forEach((store, index) => {
        const storeCard = createStoreCard(store, index);
        storesList.appendChild(storeCard);
    });
}

// Create a store card element
function createStoreCard(place, index) {
    const card = document.createElement('div');
    card.className = 'store-card card mb-2';
    card.innerHTML = `
        <div class="row g-0">
            <div class="col-md-4">
                <img src="${place.photos && place.photos[0] ? place.photos[0].getUrl() : 'https://via.placeholder.com/150'}" 
                     class="card-img-top" 
                     alt="${place.name}">
            </div>
            <div class="col-md-8">
                <div class="card-body p-2">
                    <h5 class="card-title">${place.name}</h5>
                    <div class="d-flex align-items-center mb-1">
                        ${place.rating ? `
                            <div class="rating-badge me-2">
                                <span class="stars">${getStarRating(place.rating)}</span>
                                <span>${place.rating.toFixed(1)}</span>
                            </div>
                            <small class="text-muted">(${place.user_ratings_total || 0})</small>
                        ` : '<small class="text-muted">No ratings</small>'}
                        ${place.opening_hours && place.opening_hours.open_now !== undefined ? `
                            <span class="store-status ${place.opening_hours.open_now ? 'open' : 'closed'}">
                                ${place.opening_hours.open_now ? 'Open Now' : 'Closed'}
                            </span>
                        ` : ''}
                    </div>
                    <p class="card-text mb-1">
                        <i class="fas fa-map-marker-alt text-muted me-1"></i>
                        ${place.vicinity || 'Address not available'}
                    </p>
                    ${place.price_level ? `
                        <p class="card-text mb-0">
                            <small class="price-level">${'$'.repeat(place.price_level)}</small>
                        </p>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Add click event to show details
    card.addEventListener('click', () => showStoreDetails(place));
    
    return card;
}

// Add markers to the map
function addMarkers(stores) {
    clearMarkers();
    
    stores.forEach(store => {
        const marker = new google.maps.Marker({
            position: store.geometry.location,
            map: map,
            title: store.name,
            icon: {
                url: getMarkerIcon(store.types[0] || 'store'),
                scaledSize: new google.maps.Size(30, 30)
            }
        });
        
        // Add click event to show info window
        marker.addListener('click', () => {
            showStoreDetails(store);
        });
        
        markers.push(marker);
    });
}

// Show store details in modal
function showStoreDetails(place) {
    selectedStore = place;
    const modal = new bootstrap.Modal(document.getElementById('storeDetailsModal'));
    
    // Set store name
    document.getElementById('storeName').textContent = place.name;
    
    // Set rating
    const ratingElement = document.getElementById('storeRating');
    if (place.rating) {
        ratingElement.innerHTML = `
            <span class="stars">${getStarRating(place.rating)}</span>
            <span>${place.rating.toFixed(1)}</span>
        `;
        document.getElementById('reviewCount').textContent = `(${place.user_ratings_total || 0} reviews)`;
    } else {
        ratingElement.innerHTML = '<span>No ratings</span>';
        document.getElementById('reviewCount').textContent = '';
    }
    
    // Set address
    document.getElementById('storeAddress').querySelector('span').textContent = 
        place.vicinity || 'Address not available';
    
    // Set phone
    const phoneElement = document.getElementById('storePhone');
    if (place.international_phone_number) {
        phoneElement.style.display = 'block';
        phoneElement.querySelector('span').textContent = place.international_phone_number;
        phoneElement.href = `tel:${place.international_phone_number}`;
    } else {
        phoneElement.style.display = 'none';
    }
    
    // Set website
    const websiteElement = document.getElementById('storeWebsite');
    if (place.website) {
        websiteElement.style.display = 'block';
        websiteElement.href = place.website;
        websiteElement.textContent = 'Visit Website';
    } else {
        websiteElement.style.display = 'none';
    }
    
    // Set hours
    const hoursElement = document.getElementById('storeHours');
    if (place.opening_hours) {
        const status = place.opening_hours.open_now ? 'Open Now' : 'Closed';
        const statusClass = place.opening_hours.open_now ? 'open' : 'closed';
        
        hoursElement.innerHTML = `
            <i class="far fa-clock text-primary me-2"></i>
            <span class="me-2">${status}</span>
            <span class="store-status ${statusClass}">${status}</span>
        `;
    } else {
        hoursElement.innerHTML = `
            <i class="far fa-clock text-primary me-2"></i>
            <span>Hours not available</span>
        `;
    }
    
    // Update favorite button
    updateFavoriteButton(place.place_id);
    
    // Load photos
    loadStorePhotos(place);
    
    // Show the modal
    modal.show();
}

// Load store photos
function loadStorePhotos(place) {
    const photosContainer = document.getElementById('storePhotos');
    photosContainer.innerHTML = '';
    
    if (place.photos && place.photos.length > 0) {
        // Show up to 5 photos
        const maxPhotos = Math.min(place.photos.length, 5);
        
        for (let i = 0; i < maxPhotos; i++) {
            const photo = place.photos[i];
            const item = document.createElement('div');
            item.className = `carousel-item ${i === 0 ? 'active' : ''}`;
            item.innerHTML = `
                <img src="${photo.getUrl()}" class="d-block w-100" alt="Store photo">
            `;
            photosContainer.appendChild(item);
        }
    } else {
        // Show placeholder if no photos available
        photosContainer.innerHTML = `
            <div class="carousel-item active">
                <div class="d-flex align-items-center justify-content-center bg-light" style="height: 200px;">
                    <i class="fas fa-store fa-3x text-muted"></i>
                </div>
            </div>
        `;
    }
}

// Toggle store as favorite
function toggleFavorite() {
    if (!selectedStore) return;
    
    const placeId = selectedStore.place_id;
    const index = favorites.indexOf(placeId);
    
    if (index === -1) {
        // Add to favorites
        favorites.push(placeId);
        showAlert('Added to favorites!', 'success');
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        showAlert('Removed from favorites.', 'info');
    }
    
    // Save to localStorage
    localStorage.setItem('storeFavorites', JSON.stringify(favorites));
    
    // Update the favorite button
    updateFavoriteButton(placeId);
}

// Update favorite button state
function updateFavoriteButton(placeId) {
    const button = document.getElementById('saveToFavorites');
    const icon = button.querySelector('i');
    
    if (favorites.includes(placeId)) {
        button.classList.add('btn-warning');
        button.classList.remove('btn-outline-secondary');
        icon.className = 'fas fa-star me-2';
        button.innerHTML = '<i class="fas fa-star me-2"></i>Saved to Favorites';
    } else {
        button.classList.remove('btn-warning');
        button.classList.add('btn-outline-secondary');
        icon.className = 'far fa-star me-2';
        button.innerHTML = '<i class="far fa-star me-2"></i>Save to Favorites';
    }
}

// Get directions to the selected store
function getDirections() {
    if (!selectedStore || !currentLocation) return;
    
    const destination = selectedStore.geometry.location;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destination.lat()},${destination.lng()}&travelmode=driving`;
    
    window.open(url, '_blank');
}

// Apply filters and refresh results
function applyFilters() {
    if (currentLocation) {
        findNearbyStores(currentLocation);
    }
}

// Use current location
function useMyLocation() {
    if (navigator.geolocation) {
        showLoading(true);
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                currentLocation = pos;
                map.setCenter(pos);
                addCurrentLocationMarker(pos);
                findNearbyStores(pos);
                showLoading(false);
            },
            () => {
                showLoading(false);
                showAlert('Unable to retrieve your location. Please check your browser settings.', 'danger');
            }
        );
    } else {
        showAlert('Geolocation is not supported by your browser.', 'warning');
    }
}

// Center map on current location
function centerOnMyLocation() {
    if (currentLocation) {
        map.setCenter(currentLocation);
        map.setZoom(15);
    } else {
        useMyLocation();
    }
}

// Add current location marker
function addCurrentLocationMarker(position) {
    // Remove existing marker if any
    if (currentPositionMarker) {
        currentPositionMarker.setMap(null);
    }
    
    // Add new marker
    currentPositionMarker = new google.maps.Marker({
        position: position,
        map: map,
        title: 'Your Location',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
            scale: 8
        }
    });
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// Show loading spinner
function showLoading(show) {
    let loadingElement = document.getElementById('loading');
    
    if (!loadingElement && show) {
        loadingElement = document.createElement('div');
        loadingElement.id = 'loading';
        loadingElement.className = 'loading';
        loadingElement.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(loadingElement);
    }
    
    if (loadingElement) {
        loadingElement.style.display = show ? 'flex' : 'none';
    }
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

// Helper function to get star rating HTML
function getStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    
    return stars;
}

// Helper function to get marker icon based on store type
function getMarkerIcon(type) {
    // Default marker
    let icon = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
    
    // Check if type matches any category
    for (const [category, data] of Object.entries(STORE_CATEGORIES)) {
        if (type.includes(category)) {
            // You could use custom icons here based on category
            // For now, we'll just use different colored markers
            switch(category) {
                case 'restaurant':
                    icon = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
                    break;
                case 'cafe':
                    icon = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
                    break;
                case 'supermarket':
                case 'grocery_or_supermarket':
                    icon = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
                    break;
                case 'pharmacy':
                    icon = 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png';
                    break;
                default:
                    icon = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
            }
            break;
        }
    }
    
    return icon;
}

// Initialize the application when the page loads
window.onload = function() {
    // Initialize the map when the API is loaded
    window.initMap = initMap;
};
