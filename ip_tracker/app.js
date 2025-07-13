document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const ipInput = document.getElementById('ip-input');
    const searchBtn = document.getElementById('search-btn');
    const ipAddressEl = document.getElementById('ip-address');
    const locationEl = document.getElementById('location');
    const timezoneEl = document.getElementById('timezone');
    const ispEl = document.getElementById('isp');
    
    // Initialize map
    let map = L.map('map').setView([0, 0], 2);
    let marker;
    
    // Define base layers
    const baseLayers = {
        'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }),
        'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
            maxZoom: 19
        }),
        'Topographic': L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
            maxZoom: 17
        }),
        'Dark': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CartoDB',
            subdomains: 'abcd',
            maxZoom: 19
        })
    };
    
    // Add default base layer
    baseLayers['OpenStreetMap'].addTo(map);
    
    // Add layer control
    L.control.layers(baseLayers, null, {
        position: 'bottomright',
        collapsed: true
    }).addTo(map);
    
    // Add custom marker icon
    const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        shadowSize: [41, 41]
    });
    
    // Free IP geolocation API (no API key required)
    const API_URL = 'https://ipapi.co';
    
    // Fetch IP information
    async function fetchIPInfo(ipOrDomain = '') {
        try {
            // Show loading state
            searchBtn.classList.add('loading');
            searchBtn.disabled = true;
            
            // First, get the IP address if a domain was provided
            let ip = ipOrDomain;
            if (ipOrDomain && !/^\d+\.\d+\.\d+\.\d+$/.test(ipOrDomain)) {
                // It's a domain, resolve it to an IP
                const dnsResponse = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(ipOrDomain)}&type=A`);
                const dnsData = await dnsResponse.json();
                if (dnsData.Answer && dnsData.Answer[0]) {
                    ip = dnsData.Answer[0].data;
                } else {
                    throw new Error('Could not resolve domain to IP');
                }
            }
            
            // Get IP information
            const url = ip ? `${API_URL}/${ip}/json/` : `${API_URL}/json/`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch IP information');
            }
            
            const data = await response.json();
            
            // Check if we got an error from the API
            if (data.error) {
                throw new Error(data.reason || 'Failed to get IP information');
            }
            
            updateUI(data);
            updateMap(data.latitude, data.longitude);
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Failed to fetch IP information. Please try again.');
        } finally {
            // Remove loading state
            searchBtn.classList.remove('loading');
            searchBtn.disabled = false;
        }
    }
    
    // Update the UI with IP information
    function updateUI(data) {
        ipAddressEl.textContent = data.ip || '-';
        locationEl.textContent = `${data.city || ''}, ${data.region || ''} ${data.postal || ''}, ${data.country_name || ''}`.replace(/^[, ]+/, '').trim() || '-';
        timezoneEl.textContent = data.timezone ? `UTC${data.utc_offset || ''}` : '-';
        ispEl.textContent = data.org || data.asn?.org || '-';
    }
    
    // Update the map with the given coordinates
    function updateMap(lat, lng) {
        // Remove existing marker if it exists
        if (marker) {
            map.removeLayer(marker);
        }
        
        // Add new marker
        marker = L.marker([lat, lng], { 
            icon: customIcon,
            riseOnHover: true,
            title: 'IP Location'
        }).addTo(map);
        
        // Add a circle to show accuracy if available
        if (window.accuracyCircle) {
            map.removeLayer(window.accuracyCircle);
        }
        
        // Create a small circle to indicate accuracy (100m radius)
        window.accuracyCircle = L.circle([lat, lng], {
            color: '#3388ff',
            fillColor: '#3388ff',
            fillOpacity: 0.2,
            radius: 1000 // 1km radius as default
        }).addTo(map);
        
        // Set view to the new location with padding for the info boxes
        map.fitBounds([
            [lat - 0.01, lng - 0.01],
            [lat + 0.01, lng + 0.01]
        ], {
            padding: [50, 50],
            maxZoom: 13
        });
        
        // Add a popup with coordinates
        marker.bindPopup(`
            <div style="text-align: center;">
                <strong>IP Location</strong><br>
                Latitude: ${lat.toFixed(4)}<br>
                Longitude: ${lng.toFixed(4)}
            </div>
        `).openPopup();
    }
    
    // Event Listeners
    searchBtn.addEventListener('click', () => {
        const searchTerm = ipInput.value.trim();
        if (searchTerm) {
            fetchIPInfo(searchTerm);
        } else {
            // If search field is empty, fetch current IP info
            fetchIPInfo();
        }
    });
    
    ipInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
    
    // Fetch current IP info when page loads
    fetchIPInfo();
});
