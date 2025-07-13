# Google Maps Integration

An interactive web application that integrates Google Maps with features like location search, directions, and saved locations.

## Features

- **Interactive Map**: Pan and zoom with Google Maps
- **Location Search**: Find places and addresses
- **Directions**: Get driving directions between two points
- **Saved Locations**: Save and manage your favorite places
- **Responsive Design**: Works on desktop and mobile devices
- **Multiple Map Types**: Switch between roadmap, satellite, and terrain views

## Prerequisites

1. Google Maps JavaScript API key with the following APIs enabled:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API

## Setup

1. Get a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the required APIs listed above
3. Replace `YOUR_GOOGLE_MAPS_API_KEY` in `index.html` with your actual API key

## Running the Application

1. Open `index.html` in a web server (not directly from the filesystem due to CORS restrictions)
2. For local development, you can use Python's built-in server:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to `http://localhost:8000/google_maps/`

## How to Use

### Searching for Locations
1. Enter an address or place name in the search box
2. Click the search button or press Enter
3. The map will center on the found location and add a marker

### Getting Directions
1. Enter a starting point in the "From" field
2. Enter a destination in the "To" field
3. Click "Get Directions"
4. The route will be displayed on the map with turn-by-turn directions

### Saving Locations
1. Click anywhere on the map to add a marker
2. A modal will appear where you can name the location
3. Click "Save" to add it to your saved locations

### Managing Saved Locations
- Click on a saved location to center the map on it
- Click the location arrow to center the map
- Click the trash icon to remove a saved location

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/overview)
- [Bootstrap 5](https://getbootstrap.com/)
- [Font Awesome](https://fontawesome.com/)

## License

This project is open source and available under the [MIT License](LICENSE).

## Notes

- An internet connection is required to load the Google Maps API
- The application uses the browser's localStorage to save locations (cleared when browser data is cleared)
- For production use, consider implementing server-side storage for saved locations
