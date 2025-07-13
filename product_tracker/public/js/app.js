// DOM Elements
const addProductForm = document.getElementById('addProductForm');
const productList = document.getElementById('productList');
const noProducts = document.getElementById('noProducts');
const loadingIndicator = document.getElementById('loadingIndicator');
const editProductForm = document.getElementById('editProductForm');
const saveEditBtn = document.getElementById('saveEditBtn');
const priceHistoryModal = new bootstrap.Modal(document.getElementById('priceHistoryModal'));
const editProductModal = new bootstrap.Modal(document.getElementById('editProductModal'));

// State
let products = JSON.parse(localStorage.getItem('trackedProducts')) || [];
let priceHistoryChart = null;

// Initialize the app
function init() {
    setupEventListeners();
    loadProducts();
    
    // Check for price updates periodically
    setInterval(checkForPriceUpdates, 3600000); // Check every hour
    
    // Initial check
    if (products.length > 0) {
        checkForPriceUpdates();
    }
}

// Set up event listeners
function setupEventListeners() {
    // Add product form submission
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProduct);
    }
    
    // Save edited product
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', saveEditedProduct);
    }
    
    // Sort options
    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const sortBy = e.target.dataset.sort;
            sortProducts(sortBy);
        });
    });
}

// Handle add product form submission
async function handleAddProduct(e) {
    e.preventDefault();
    
    const productUrl = document.getElementById('productUrl').value.trim();
    const productName = document.getElementById('productName').value.trim();
    const targetPrice = parseFloat(document.getElementById('targetPrice').value) || null;
    const checkFrequency = document.getElementById('checkFrequency').value;
    
    if (!productUrl) {
        showAlert('Please enter a valid product URL', 'danger');
        return;
    }
    
    // Check if product is already being tracked
    if (products.some(p => p.url === productUrl)) {
        showAlert('This product is already being tracked', 'warning');
        return;
    }
    
    // Show loading state
    const submitBtn = addProductForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
    
    try {
        // In a real app, you would fetch product details from a backend service
        // For now, we'll simulate this with a timeout
        const productDetails = await fetchProductDetails(productUrl);
        
        const product = {
            id: Date.now().toString(),
            name: productName || productDetails.name || 'Unnamed Product',
            url: productUrl,
            currentPrice: productDetails.price,
            originalPrice: productDetails.price,
            currency: productDetails.currency || '$',
            image: productDetails.image || 'https://via.placeholder.com/150',
            store: productDetails.store || new URL(productUrl).hostname.replace('www.', ''),
            targetPrice: targetPrice,
            checkFrequency: checkFrequency,
            lastChecked: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            priceHistory: [{
                date: new Date().toISOString(),
                price: productDetails.price,
                availability: true
            }],
            isAvailable: true
        };
        
        products.unshift(product);
        saveProducts();
        renderProducts();
        
        // Reset form
        addProductForm.reset();
        showAlert('Product added successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding product:', error);
        showAlert('Failed to add product. Please try again.', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Simulate fetching product details from a URL
async function fetchProductDetails(url) {
    // In a real app, this would be an API call to your backend
    // which would scrape the product page or use an API
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate different stores
            const hostname = new URL(url).hostname;
            let store = 'Unknown Store';
            let price = Math.floor(Math.random() * 900) + 100; // Random price between 100-1000
            
            if (hostname.includes('amazon')) {
                store = 'Amazon';
                price = Math.floor(price / 10) * 10; // Round to nearest 10
            } else if (hostname.includes('bestbuy')) {
                store = 'Best Buy';
                price = price - (price % 5); // Round to nearest 5
            } else if (hostname.includes('walmart')) {
                store = 'Walmart';
                price = price - (price % 1); // Whole numbers only
            } else if (hostname.includes('newegg')) {
                store = 'Newegg';
                price = price - (price % 1) + 0.99; // .99 pricing
            }
            
            resolve({
                name: `Product from ${store}`,
                price: price,
                currency: '$',
                store: store,
                image: 'https://via.placeholder.com/150',
                availability: true
            });
        }, 1000);
    });
}

// Load products from localStorage
function loadProducts() {
    if (products.length === 0) {
        loadingIndicator.classList.add('d-none');
        noProducts.classList.remove('d-none');
        return;
    }
    
    renderProducts();
}

// Render products in the UI
function renderProducts() {
    if (products.length === 0) {
        productList.classList.add('d-none');
        noProducts.classList.remove('d-none');
        return;
    }
    
    loadingIndicator.classList.add('d-none');
    noProducts.classList.add('d-none');
    productList.classList.remove('d-none');
    
    productList.innerHTML = '';
    
    products.forEach(product => {
        const priceChange = calculatePriceChange(product);
        const productElement = createProductElement(product, priceChange);
        productList.appendChild(productElement);
    });
}

// Create a product element
function createProductElement(product, priceChange) {
    const li = document.createElement('li');
    li.className = 'product-item fade-in';
    li.dataset.id = product.id;
    
    const priceChangeClass = priceChange > 0 ? 'price-up' : (priceChange < 0 ? 'price-down' : 'price-same');
    const priceChangeText = priceChange > 0 ? `+${product.currency}${priceChange.toFixed(2)}` : 
                          (priceChange < 0 ? `${product.currency}${Math.abs(priceChange).toFixed(2)}` : 'No change');
    
    const lastChecked = new Date(product.lastChecked).toLocaleString();
    const isOnSale = product.currentPrice < (product.originalPrice * 0.9); // 10% off or more
    
    li.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="d-flex">
                <div class="me-3" style="width: 80px; height: 80px; background-color: #f8f9fa; border-radius: 8px; overflow: hidden;">
                    <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div>
                    <h5 class="product-name">${product.name}</h5>
                    <span class="product-store">${product.store}</span>
                    <div class="d-flex align-items-center">
                        <span class="product-price">${product.currency}${product.currentPrice.toFixed(2)}</span>
                        ${priceChange !== 0 ? `<span class="price-change ${priceChangeClass}">${priceChangeText}</span>` : ''}
                        ${isOnSale ? '<span class="badge bg-danger ms-2">Sale!</span>' : ''}
                    </div>
                    <div class="product-meta">
                        ${product.targetPrice ? 
                            `<span class="me-2">Target: <strong>${product.currency}${product.targetPrice.toFixed(2)}</strong></span>` 
                            : ''
                        }
                        <span>Last checked: ${lastChecked}</span>
                    </div>
                </div>
            </div>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary btn-icon" 
                        title="View Price History"
                        onclick="showPriceHistory('${product.id}')">
                    <i class="bi bi-graph-up"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary btn-icon" 
                        title="Edit Product"
                        onclick="editProduct('${product.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-icon" 
                        title="Remove Product"
                        onclick="removeProduct('${product.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return li;
}

// Calculate price change percentage
function calculatePriceChange(product) {
    if (!product.priceHistory || product.priceHistory.length < 2) return 0;
    
    const currentPrice = product.currentPrice;
    const previousPrice = product.priceHistory[1].price; // Get the previous price
    
    return currentPrice - previousPrice;
}

// Show price history in modal
function showPriceHistory(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.priceHistory || product.priceHistory.length === 0) {
        showAlert('No price history available for this product', 'info');
        return;
    }
    
    // Update modal title
    document.getElementById('priceHistoryModalLabel').textContent = `Price History: ${product.name}`;
    
    // Prepare data for chart
    const labels = product.priceHistory.map(entry => 
        new Date(entry.date).toLocaleDateString()
    ).reverse();
    
    const prices = product.priceHistory.map(entry => entry.price).reverse();
    
    // Create or update chart
    const ctx = document.getElementById('priceHistoryChart').getContext('2d');
    
    if (priceHistoryChart) {
        priceHistoryChart.destroy();
    }
    
    priceHistoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price',
                data: prices,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toFixed(2)}`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return `$${value}`;
                        }
                    }
                }
            }
        }
    });
    
    // Update price history table
    const tableBody = document.getElementById('priceHistoryTable');
    tableBody.innerHTML = '';
    
    product.priceHistory.slice().reverse().forEach((entry, index) => {
        const row = document.createElement('tr');
        const date = new Date(entry.date).toLocaleString();
        const price = `${product.currency}${entry.price.toFixed(2)}`;
        
        let change = '';
        if (index < product.priceHistory.length - 1) {
            const prevPrice = product.priceHistory[product.priceHistory.length - 2 - index + 1]?.price;
            if (prevPrice !== undefined) {
                const diff = entry.price - prevPrice;
                if (diff > 0) {
                    change = `<span class="text-danger">+${product.currency}${diff.toFixed(2)}</span>`;
                } else if (diff < 0) {
                    change = `<span class="text-success">${product.currency}${diff.toFixed(2)}</span>`;
                } else {
                    change = 'No change';
                }
            }
        }
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${price}</td>
            <td>${change || '-'}</td>
            <td>${entry.availability ? 
                '<span class="badge bg-success">In Stock</span>' : 
                '<span class="badge bg-danger">Out of Stock</span>'}
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Show the modal
    priceHistoryModal.show();
}

// Edit product
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editTargetPrice').value = product.targetPrice || '';
    document.getElementById('editCheckFrequency').value = product.checkFrequency;
    
    editProductModal.show();
}

// Save edited product
function saveEditedProduct() {
    const productId = document.getElementById('editProductId').value;
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    product.name = document.getElementById('editProductName').value.trim() || product.name;
    product.targetPrice = parseFloat(document.getElementById('editTargetPrice').value) || null;
    product.checkFrequency = document.getElementById('editCheckFrequency').value;
    
    saveProducts();
    renderProducts();
    editProductModal.hide();
    
    showAlert('Product updated successfully', 'success');
}

// Remove product
function removeProduct(productId) {
    if (!confirm('Are you sure you want to remove this product from tracking?')) {
        return;
    }
    
    products = products.filter(p => p.id !== productId);
    saveProducts();
    renderProducts();
    
    showAlert('Product removed from tracking', 'info');
}

// Check for price updates
async function checkForPriceUpdates() {
    if (products.length === 0) return;
    
    const updates = [];
    
    for (const product of products) {
        try {
            // In a real app, this would be an API call to check the current price
            const currentTime = new Date();
            const lastChecked = new Date(product.lastChecked);
            const hoursSinceLastCheck = (currentTime - lastChecked) / (1000 * 60 * 60);
            
            // Only check if enough time has passed based on the check frequency
            if (hoursSinceLastCheck < (product.checkFrequency / 3600)) continue;
            
            const productDetails = await fetchProductDetails(product.url);
            
            const priceChanged = productDetails.price !== product.currentPrice;
            const availabilityChanged = productDetails.availability !== product.isAvailable;
            
            if (priceChanged || availabilityChanged) {
                // Update product data
                const oldPrice = product.currentPrice;
                product.currentPrice = productDetails.price;
                product.isAvailable = productDetails.availability;
                product.lastChecked = currentTime.toISOString();
                
                // Add to price history
                product.priceHistory.unshift({
                    date: currentTime.toISOString(),
                    price: productDetails.price,
                    availability: productDetails.availability
                });
                
                // Keep only the last 30 price history entries
                if (product.priceHistory.length > 30) {
                    product.priceHistory = product.priceHistory.slice(0, 30);
                }
                
                updates.push({
                    product,
                    oldPrice,
                    newPrice: productDetails.price,
                    availability: productDetails.availability
                });
            }
            
            // Add a small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`Error checking product ${product.id}:`, error);
        }
    }
    
    if (updates.length > 0) {
        saveProducts();
        renderProducts();
        
        // Show notifications for price drops
        updates.forEach(update => {
            if (update.newPrice < update.oldPrice) {
                const priceDrop = update.oldPrice - update.newPrice;
                const message = `Price dropped for ${update.product.name} by $${priceDrop.toFixed(2)}!`;
                showAlert(message, 'success');
            }
            
            // Notify if product is back in stock
            if (update.availability && !update.product.isAvailable) {
                showAlert(`${update.product.name} is back in stock!`, 'success');
            }
        });
    }
}

// Sort products
function sortProducts(sortBy) {
    const [field, order] = sortBy.split('-');
    
    products.sort((a, b) => {
        let comparison = 0;
        
        switch (field) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
                
            case 'price':
                comparison = a.currentPrice - b.currentPrice;
                break;
                
            case 'date':
                comparison = new Date(a.createdAt) - new Date(b.createdAt);
                break;
                
            default:
                return 0;
        }
        
        return order === 'desc' ? -comparison : comparison;
    });
    
    renderProducts();
}

// Save products to localStorage
function saveProducts() {
    localStorage.setItem('trackedProducts', JSON.stringify(products));
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.role = 'alert';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}

// Make functions available globally
window.showPriceHistory = showPriceHistory;
window.editProduct = editProduct;
window.removeProduct = removeProduct;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
