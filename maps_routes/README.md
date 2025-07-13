# Maps Routes Planner

An advanced route planning application built with Google Maps JavaScript API that allows users to create, save, and manage custom routes with multiple stops.

## Features

- **Interactive Map**: Pan and zoom with Google Maps
- **Multi-Stop Routing**: Plan routes with multiple destinations
- **Route Optimization**: Automatically optimize the order of stops for the most efficient path
- **Elevation Profile**: View elevation changes along your route
- **Travel Modes**: Choose between driving, walking, bicycling, or transit
- **Route Options**: Avoid highways, avoid tolls, and more
- **Save Routes**: Save your favorite routes for future reference
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

1. Google Maps JavaScript API key with the following APIs enabled:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API
   - Elevation API

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
3. Open your browser and navigate to `http://localhost:8000/maps_routes/`

## How to Use

### Creating a Route
1. Click "Add Stop" or search for a location in the search bar
2. Add multiple stops to your route
3. Drag and drop stops to reorder them
4. Click "Calculate Route" to see the optimized path

### Saving a Route
1. After creating a route, click "Save Route"
2. Enter a name for your route
3. Optionally, set it as your default route
4. Click "Save"

### Loading a Saved Route
1. In the "Saved Routes" section, click the map icon next to a saved route
2. The route will be loaded on the map
3. You can modify the route and save it again if needed

### Route Options
- **Travel Mode**: Choose between driving, walking, bicycling, or transit
- **Avoid Highways**: Check to avoid highways
- **Avoid Tolls**: Check to avoid toll roads

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Dependencies

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/overview)
- [Bootstrap 5](https://getbootstrap.com/)
- [Font Awesome](https://fontawesome.com/)
- [Google Charts](https://developers.google.com/chart) (for elevation profile)
- [SortableJS](https://sortablejs.github.io/Sortable/) (for drag and drop functionality)

## License

This project is open source and available under the [MIT License](LICENSE).

## Notes

- An internet connection is required to load the Google Maps API
- The application uses the browser's localStorage to save routes (cleared when browser data is cleared)
- For production use, consider implementing server-side storage for saved routes
