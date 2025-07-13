# IP Address Tracker

A web application that allows users to track and display information about IP addresses and domains. The application displays the IP address, location, timezone, and ISP information, along with an interactive map showing the IP's location.

## Features

- Search for any IP address or domain name
- Display detailed IP information including:
  - IP Address
  - Location (City, Region, Country, Postal Code)
  - Timezone
  - Internet Service Provider (ISP)
- Interactive map showing the IP's location
- Responsive design that works on all devices
- Clean and modern user interface

## Technologies Used

- HTML5
- CSS3 (with Flexbox and CSS Grid)
- JavaScript (ES6+)
- [Leaflet.js](https://leafletjs.com/) - For interactive maps
- [IP Geolocation API](https://geo.ipify.org/) - For IP address information
- [Bootstrap 5](https://getbootstrap.com/) - For responsive design

## How to Use

1. Clone this repository or download the source code
2. Open `index.html` in your web browser
3. Enter an IP address or domain name in the search bar and press Enter or click the search button
4. View the IP information and location on the map

## API Key

This application uses the IP Geolocation API from [ipify](https://geo.ipify.org/). To use this application, you'll need to:

1. Sign up for a free API key at [https://geo.ipify.org/](https://geo.ipify.org/)
2. Replace `YOUR_API_KEY_HERE` in `app.js` with your actual API key

## Screenshot

![IP Tracker Screenshot](screenshot.png)

## Browser Support

The application works on all modern browsers including:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari
- Opera

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
