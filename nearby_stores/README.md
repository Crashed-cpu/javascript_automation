# Nearby Stores Finder

An interactive web application that helps users discover and explore stores and businesses near their current location or any specified area using the Google Maps and Places API.

## Features

- **Interactive Map**: View stores and businesses on an interactive Google Map
- **Search & Filter**: Search for specific stores or filter by category, distance, and rating
- **Store Details**: View detailed information about each store including photos, ratings, and opening hours
- **Get Directions**: Get turn-by-turn directions to any store
- **Save Favorites**: Save your favorite stores for quick access later
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Prerequisites

1. Google Maps JavaScript API key with the following APIs enabled:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API

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
3. Open your browser and navigate to `http://localhost:8000/nearby_stores/`

## How to Use

### Finding Stores
1. The app will automatically try to detect your location
2. Use the search bar to search for a specific location or address
3. Click the location button to center the map on your current location
4. Use the filters to narrow down results by category, distance, and rating

### Viewing Store Details
1. Click on any store marker on the map or in the list
2. View store information, photos, and opening hours
3. Click "Get Directions" to open Google Maps with directions to the store
4. Click "Save to Favorites" to add the store to your favorites

### Managing Favorites
1. Saved stores are stored in your browser's local storage
2. To remove a favorite, open the store details and click the "Saved to Favorites" button again

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
- The application uses the browser's localStorage to save favorites (cleared when browser data is cleared)
- For production use, consider implementing server-side storage for favorites and user preferences
