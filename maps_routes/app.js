// ... (previous code continues)

// Show info window for a stop
function showStopInfo(marker, title, position) {
    // Close any open info windows
    if (currentInfoWindow) {
        currentInfoWindow.close();
    }
    
    // Create content for the info window
    const content = `
        <div class="p-2">
            <h6>${title}</h6>
            <p class="mb-1">Lat: ${position.lat().toFixed(6)}</p>
            <p class="mb-2">Lng: ${position.lng().toFixed(6)}</p>
            <div class="d-grid gap-2">
                <button class="btn btn-sm btn-primary" onclick="centerOnLocation(${position.lat()}, ${position.lng()})">
                    <i class="fas fa-location-arrow me-1"></i> Center Here
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="removeStopByPosition({lat: ${position.lat()}, lng: ${position.lng()}})">
                    <i class="fas fa-trash me-1"></i> Remove
                </button>
            </div>
        </div>
    `;
    
    // Create and open the info window
    currentInfoWindow = new google.maps.InfoWindow({
        content: content,
        position: position
    });
    
    currentInfoWindow.open(map, marker);
}

// Remove a stop by its ID
function removeStop(stopId) {
    const stopIndex = waypoints.findIndex(s => s.id === stopId);
    if (stopIndex === -1) return;
    
    // Remove marker from map
    waypoints[stopIndex].marker.setMap(null);
    
    // Remove from waypoints array
    waypoints.splice(stopIndex, 1);
    
    // Remove from UI
    const stopElement = document.getElementById(`stop-${stopId}`);
    if (stopElement) {
        stopElement.remove();
    }
    
    // Update stop numbers
    updateStopNumbers();
    
    // Recalculate route if we have at least 2 stops left
    if (waypoints.length >= 2) {
        calculateRoute();
    } else {
        // Clear the route if less than 2 stops remain
        directionsRenderer.setMap(null);
        document.getElementById('directionsPanel').classList.add('d-none');
        document.getElementById('elevationChart').style.display = 'none';
    }
    
    // Update UI
    updateUI();
}

// Remove a stop by its position
function removeStopByPosition(position) {
    const stop = waypoints.find(s => 
        s.position.lat() === position.lat && 
        s.position.lng() === position.lng
    );
    
    if (stop) {
        removeStop(stop.id);
    }
}

// Calculate and display the route
function calculateRoute() {
    if (waypoints.length < 2) {
        showAlert('You need at least 2 stops to calculate a route.', 'warning');
        return;
    }
    
    showLoading(true);
    
    // Prepare waypoints (all stops except first and last)
    const waypointsForDirections = waypoints.slice(1, -1).map(stop => ({
        location: stop.position,
        stopover: true
    }));
    
    // Get travel mode
    const travelMode = document.getElementById('travelMode').value;
    
    // Get route options
    const avoidHighways = document.getElementById('avoidHighways').checked;
    const avoidTolls = document.getElementById('avoidTolls').checked;
    
    // Prepare request
    const request = {
        origin: waypoints[0].position,
        destination: waypoints[waypoints.length - 1].position,
        waypoints: waypointsForDirections,
        travelMode: google.maps.TravelMode[travelMode],
        optimizeWaypoints: true,
        avoidHighways: avoidHighways,
        avoidTolls: avoidTolls
    };
    
    // Get directions
    directionsService.route(request, (response, status) => {
        showLoading(false);
        
        if (status === 'OK') {
            // Display the route
            directionsRenderer.setMap(map);
            directionsRenderer.setDirections(response);
            
            // Show directions panel
            document.getElementById('directionsPanel').classList.remove('d-none');
            
            // Update route information
            updateRouteInfo(response);
            
            // Show elevation chart
            showElevationChart(response.routes[0].overview_path);
            
            // Save the current route
            currentRoute = response;
        } else {
            showAlert('Directions request failed: ' + status, 'danger');
        }
    });
}

// Update route information in the UI
function updateRouteInfo(response) {
    const route = response.routes[0];
    let totalDistance = 0;
    let totalDuration = 0;
    
    // Calculate total distance and duration
    route.legs.forEach(leg => {
        totalDistance += leg.distance.value; // in meters
        totalDuration += leg.duration.value; // in seconds
    });
    
    // Convert to appropriate units
    const distanceInKm = (totalDistance / 1000).toFixed(1);
    const durationInMinutes = Math.ceil(totalDuration / 60);
    
    // Update UI
    document.getElementById('totalDistance').textContent = `${distanceInKm} km`;
    document.getElementById('totalDuration').textContent = `${durationInMinutes} min`;
    document.getElementById('totalStops').textContent = waypoints.length;
}

// Show elevation chart for the route
function showElevationChart(path) {
    // Create a PathElevationRequest object using the array's one value
    const pathRequest = {
        path: path,
        samples: 100
    };
    
    // Initiate the elevation service
    elevationService.getElevationAlongPath(pathRequest, (elevations, status) => {
        if (status === 'OK') {
            // Extract elevation data
            const elevationData = elevations.map((elevation, index) => ({
                distance: (index / (elevations.length - 1)) * 100,
                elevation: elevation.elevation
            }));
            
            // Draw the chart
            drawElevationChart(elevationData);
        }
    });
}

// Draw elevation chart using Google Charts
function drawElevationChart(elevationData) {
    // Load the Visualization API and the linechart package
    google.charts.load('current', { 'packages': ['line'] });
    
    // Set a callback to run when the Google Visualization API is loaded
    google.charts.setOnLoadCallback(() => {
        // Create the data table
        const data = new google.visualization.DataTable();
        data.addColumn('number', 'Distance (%)');
        data.addColumn('number', 'Elevation (m)');
        
        // Add data points
        const rows = elevationData.map(point => [point.distance, point.elevation]);
        data.addRows(rows);
        
        // Set chart options
        const options = {
            chart: {
                title: 'Elevation Profile',
                subtitle: 'Elevation changes along the route'
            },
            height: 200,
            hAxis: {
                title: 'Distance (%)',
                viewWindow: {
                    min: 0,
                    max: 100
                }
            },
            vAxis: {
                title: 'Elevation (m)'
            },
            colors: ['#4285F4'],
            legend: { position: 'none' },
            backgroundColor: 'transparent'
        };
        
        // Instantiate and draw the chart
        const chart = new google.charts.Line(document.getElementById('elevationChart'));
        chart.draw(data, google.charts.Line.convertOptions(options));
        
        // Show the chart
        document.getElementById('elevationChart').style.display = 'block';
    });
}

// Set up drag and drop for stops
function setupDragAndDrop() {
    const stopsList = document.getElementById('stopsList');
    
    // Make stops sortable
    new Sortable(stopsList, {
        animation: 150,
        handle: '.stop-item',
        onEnd: function(evt) {
            // Update waypoints array based on new order
            const stopElements = Array.from(stopsList.children);
            waypoints.sort((a, b) => {
                const aIndex = stopElements.findIndex(el => el.dataset.stopId === a.id);
                const bIndex = stopElements.findIndex(el => el.dataset.stopId === b.id);
                return aIndex - bIndex;
            });
            
            // Update stop numbers
            updateStopNumbers();
            
            // Recalculate route if we have at least 2 stops
            if (waypoints.length >= 2) {
                calculateRoute();
            }
        }
    });
}

// Save the current route
function saveRoute() {
    if (waypoints.length < 2) {
        showAlert('You need at least 2 stops to save a route.', 'warning');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('saveRouteModal'));
    const routeNameInput = document.getElementById('routeName');
    
    // Set default route name
    const defaultName = `Route ${new Date().toLocaleDateString()}`;
    routeNameInput.value = defaultName;
    
    // Show the modal
    modal.show();
    
    // Handle save button click
    document.getElementById('confirmSaveRoute').onclick = () => {
        const routeName = routeNameInput.value.trim() || defaultName;
        const setAsDefault = document.getElementById('setAsDefault').checked;
        
        // Create route object
        const route = {
            id: 'route-' + Date.now(),
            name: routeName,
            waypoints: waypoints.map(stop => ({
                name: stop.name,
                address: stop.address,
                lat: stop.position.lat(),
                lng: stop.position.lng()
            })),
            createdAt: new Date().toISOString(),
            isDefault: setAsDefault
        };
        
        // Save to localStorage
        const savedRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
        
        // Remove any existing default route if this is set as default
        if (setAsDefault) {
            savedRoutes.forEach(r => r.isDefault = false);
        }
        
        // Add new route
        savedRoutes.push(route);
        localStorage.setItem('savedRoutes', JSON.stringify(savedRoutes));
        
        // Update UI
        loadSavedRoutes();
        
        // Close modal
        modal.hide();
        
        // Show success message
        showAlert('Route saved successfully!', 'success');
    };
}

// Load saved routes from localStorage
function loadSavedRoutes() {
    const savedRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    const container = document.getElementById('savedRoutes');
    
    // Clear existing routes
    container.innerHTML = '';
    
    if (savedRoutes.length === 0) {
        container.innerHTML = '<div class="text-muted p-2">No saved routes yet.</div>';
        return;
    }
    
    // Sort routes by creation date (newest first)
    savedRoutes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Add each route to the UI
    savedRoutes.forEach(route => {
        const routeElement = document.createElement('div');
        routeElement.className = `list-group-item list-group-item-action saved-route ${route.isDefault ? 'active' : ''}`;
        routeElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h6 class="mb-1">${route.name}</h6>
                    <small class="text-muted">
                        ${route.waypoints.length} stops • 
                        ${new Date(route.createdAt).toLocaleDateString()}
                        ${route.isDefault ? '• Default' : ''}
                    </small>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary load-route" title="Load Route">
                        <i class="fas fa-map-marked-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-route" title="Delete Route">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        routeElement.querySelector('.load-route').addEventListener('click', (e) => {
            e.stopPropagation();
            loadRoute(route);
        });
        
        routeElement.querySelector('.delete-route').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteRoute(route.id);
        });
        
        container.appendChild(routeElement);
    });
}

// Load a saved route
function loadRoute(route) {
    // Clear current route
    clearRoute();
    
    // Add each stop from the saved route
    route.waypoints.forEach((stop, index) => {
        const stopObj = {
            name: stop.name,
            address: stop.address,
            location: new google.maps.LatLng(stop.lat, stop.lng)
        };
        
        // Add stop to the map and UI
        addStop(stopObj, true);
    });
    
    // Calculate and display the route
    if (waypoints.length >= 2) {
        calculateRoute();
    }
    
    // Show success message
    showAlert(`Loaded route: ${route.name}`, 'success');
}

// Delete a saved route
function deleteRoute(routeId) {
    if (!confirm('Are you sure you want to delete this route? This action cannot be undone.')) {
        return;
    }
    
    const savedRoutes = JSON.parse(localStorage.getItem('savedRoutes') || '[]');
    const updatedRoutes = savedRoutes.filter(route => route.id !== routeId);
    
    localStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
    loadSavedRoutes();
    
    showAlert('Route deleted successfully.', 'info');
}

// Clear the current route
function clearRoute() {
    // Remove all markers
    waypoints.forEach(stop => {
        stop.marker.setMap(null);
    });
    
    // Clear waypoints array
    waypoints = [];
    
    // Clear directions
    directionsRenderer.setMap(null);
    
    // Clear UI
    document.getElementById('stopsList').innerHTML = '';
    document.getElementById('directionsPanel').classList.add('d-none');
    document.getElementById('elevationChart').style.display = 'none';
    
    // Reset route info
    document.getElementById('totalDistance').textContent = '-';
    document.getElementById('totalDuration').textContent = '-';
    document.getElementById('totalStops').textContent = '0';
    
    // Clear current route
    currentRoute = null;
}

// Show loading state
function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (!loadingElement) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading';
        loadingDiv.className = 'loading';
        loadingDiv.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    }
    
    if (show) {
        document.getElementById('loading').style.display = 'flex';
    } else {
        document.getElementById('loading').style.display = 'none';
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

// Set up event listeners
function setupEventListeners() {
    // Add stop button
    document.getElementById('addStopBtn').addEventListener('click', () => {
        const modal = new bootstrap.Modal(document.getElementById('addStopModal'));
        modal.show();
    });
    
    // Confirm add stop
    document.getElementById('confirmAddStop').addEventListener('click', () => {
        const name = document.getElementById('stopName').value.trim() || `Stop ${waypoints.length + 1}`;
        const address = document.getElementById('stopAddress').value.trim();
        
        if (!address) {
            showAlert('Please enter an address or coordinates.', 'warning');
            return;
        }
        
        // Try to geocode the address
        geocoder.geocode({ address: address }, (results, status) => {
            if (status === 'OK' && results[0]) {
                // Add the stop
                addStop({
                    name: name,
                    location: results[0].geometry.location,
                    address: results[0].formatted_address
                });
                
                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addStopModal'));
                modal.hide();
                
                // Reset form
                document.getElementById('stopName').value = '';
                document.getElementById('stopAddress').value = '';
            } else {
                showAlert('Could not find the specified location. Please try again.', 'danger');
            }
        });
    });
    
    // Calculate route button
    document.getElementById('calculateRouteBtn').addEventListener('click', calculateRoute);
    
    // Save route button
    document.getElementById('saveRouteBtn').addEventListener('click', saveRoute);
    
    // New route button
    document.getElementById('newRouteBtn').addEventListener('click', () => {
        if (waypoints.length > 0 && !confirm('Are you sure you want to start a new route? Any unsaved changes will be lost.')) {
            return;
        }
        clearRoute();
    });
    
    // Route options change
    document.getElementById('travelMode').addEventListener('change', () => {
        if (waypoints.length >= 2) {
            calculateRoute();
        }
    });
    
    document.getElementById('avoidHighways').addEventListener('change', () => {
        if (waypoints.length >= 2) {
            calculateRoute();
        }
    });
    
    document.getElementById('avoidTolls').addEventListener('change', () => {
        if (waypoints.length >= 2) {
            calculateRoute();
        }
    });
    
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

// Center the map on a location
function centerOnLocation(lat, lng) {
    const position = new google.maps.LatLng(lat, lng);
    map.setCenter(position);
    map.setZoom(15);
}

// Initialize the application when the page loads
window.onload = function() {
    // Initialize Google Charts
    google.charts.load('current', { 'packages': ['line'] });
    
    // Initialize the map when the API is loaded
    window.initMap = initMap;
    
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
};
