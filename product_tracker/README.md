# Product Price Tracker

A web application that helps you track product prices across different online stores and notifies you of price drops and availability changes.

## Features

- **Price Tracking**: Monitor product prices across multiple online stores
- **Price History**: View historical price data with an interactive chart
- **Price Drop Alerts**: Get notified when prices drop below your target
- **Availability Tracking**: Monitor product stock status
- **Multi-Store Support**: Track products from various online retailers
- **Responsive Design**: Works on desktop and mobile devices
- **No Backend Required**: All data is stored in your browser's localStorage

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Charts**: Chart.js
- **Icons**: Bootstrap Icons
- **No Backend**: Runs entirely in the browser

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server or backend required

### Installation

1. Clone the repository or download the source code
2. Open `public/index.html` in your web browser

## Usage

1. **Add a Product**
   - Enter the product URL
   - Optionally, add a custom name and target price
   - Click "Add Product"

2. **Monitor Prices**
   - View current price and price changes
   - Check price history with interactive charts
   - Set target prices for price drop alerts

3. **Manage Products**
   - Edit product details
   - Remove products you no longer want to track
   - Sort products by name, price, or date added

## How It Works

1. The application simulates price checking by generating random price changes
2. In a production environment, this would connect to a backend service that:
   - Scrapes e-commerce websites for current prices
   - Uses APIs from retailers when available
   - Handles rate limiting and CAPTCHAs

## File Structure

```
product_tracker/
├── public/                # Frontend files
│   ├── css/              # Stylesheets
│   │   └── styles.css    # Custom styles
│   ├── js/               # JavaScript files
│   │   └── app.js        # Main application logic
│   └── index.html        # Main HTML file
└── README.md             # This file
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Limitations

- This is a frontend-only implementation. For a production application, you would need:
  - Backend server for actual price checking
  - Database for persistent storage
  - User authentication
  - Email/SMS notifications

## Future Enhancements

- **Real Price Tracking**: Integrate with e-commerce APIs or web scraping services
- **Email Notifications**: Get alerts when prices drop
- **Browser Extension**: Add products directly from shopping websites
- **Price Comparison**: Compare prices across multiple stores
- **User Accounts**: Sync tracked products across devices
- **Export Data**: Export price history to CSV/Excel

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
