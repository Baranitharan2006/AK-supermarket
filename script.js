// Data Management
let menuItems = [];
let cart = [];
let editingItemId = null;
let currentCustomer = null;
const DELIVERY_CHARGE = 50.00; // Delivery charge in rupees

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const savedCustomer = localStorage.getItem('currentCustomer');
    if (!savedCustomer) {
        window.location.href = 'login.html';
        return;
    }
    
    currentCustomer = JSON.parse(savedCustomer);
    displayCustomerInfo();
    
    // Check if user is shop owner
    checkShopOwnerAccess();
    
    initializeData();
    loadCartFromStorage();
    setupEventListeners();
    loadProducts();
    loadCart();
    
    // Only load admin sections if shop owner
    if (currentCustomer.isShopOwner) {
        loadMenuItems();
        loadSalesReport();
    }
});

// Initialize localStorage with default products if empty
function initializeData() {
    if (!localStorage.getItem('menuItems')) {
        const defaultProducts = [
            { id: 1, name: 'Tomato', category: 'Fresh Vegetables', price: 40.00, image: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=500&h=500&fit=crop&q=90' },
            { id: 2, name: 'Onion', category: 'Fresh Vegetables', price: 30.00, image: 'https://images.unsplash.com/photo-1618512496249-3b3a0d4b5b5e?w=500&h=500&fit=crop&q=90' },
            { id: 3, name: 'Potato', category: 'Fresh Vegetables', price: 25.00, image: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=500&h=500&fit=crop&q=90' },
            { id: 4, name: 'Basmati Rice', category: 'Rice', price: 120.00, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&h=500&fit=crop&q=90' },
            { id: 5, name: 'Sona Masoori Rice', category: 'Rice', price: 80.00, image: 'https://images.unsplash.com/photo-1536304993881-2016bc3334c8?w=500&h=500&fit=crop&q=90' },
            { id: 6, name: 'Fortune Sunflower Oil', category: 'Sunflower Oil', price: 180.00, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&h=500&fit=crop&q=90' },
            { id: 7, name: 'Amul Milk 1L', category: 'Milk', price: 60.00, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&h=500&fit=crop&q=90' },
            { id: 8, name: 'Farm Fresh Eggs (12)', category: 'Eggs', price: 90.00, image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&h=500&fit=crop&q=90' },
            { id: 9, name: 'Turmeric Powder', category: 'Masala Powders', price: 50.00, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&h=500&fit=crop&q=90' },
            { id: 10, name: 'Chilli Powder', category: 'Masala Powders', price: 45.00, image: 'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=500&h=500&fit=crop&q=90' },
            { id: 11, name: 'Pantene Shampoo', category: 'Shampoo', price: 150.00, image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=500&h=500&fit=crop&q=90' },
            { id: 12, name: 'Colgate Toothpaste', category: 'Toothpaste', price: 75.00, image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&h=500&fit=crop&q=90' },
            { id: 13, name: 'MDH Garam Masala', category: 'Garam Masala', price: 55.00, image: 'https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=500&h=500&fit=crop&q=90' }
        ];
        localStorage.setItem('menuItems', JSON.stringify(defaultProducts));
    }
    
    if (!localStorage.getItem('transactions')) {
        localStorage.setItem('transactions', JSON.stringify([]));
    }
    
    menuItems = JSON.parse(localStorage.getItem('menuItems'));
}

// Setup Event Listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    // Category filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const category = this.getAttribute('data-category');
            filterProducts(category);
        });
    });

    // Add item form
    document.getElementById('addItemForm').addEventListener('submit', handleAddItem);

    // Cart actions
    document.getElementById('clearCart').addEventListener('click', clearCart);
    document.getElementById('payNow').addEventListener('click', showPaymentModal);
    
    // Home delivery checkbox
    document.getElementById('homeDelivery').addEventListener('change', handleDeliveryToggle);

    // Payment modal
    document.getElementById('confirmPayment').addEventListener('click', confirmPayment);
    document.getElementById('printBill').addEventListener('click', printBill);
    document.getElementById('cancelPayment').addEventListener('click', closePaymentModal);
    document.querySelector('.close').addEventListener('click', closePaymentModal);

    // Sales report
    document.getElementById('filterReport').addEventListener('click', filterSalesReport);
    document.getElementById('resetReport').addEventListener('click', resetSalesReport);

    // Cancel edit
    document.getElementById('cancelEdit').addEventListener('click', cancelEdit);
}

// Check Shop Owner Access
function checkShopOwnerAccess() {
    if (currentCustomer && currentCustomer.isShopOwner) {
        // Show shop owner tabs - owner can see Manage Menu and Sales Report
        document.getElementById('manageMenuTab').style.display = 'inline-block';
        document.getElementById('salesReportTab').style.display = 'inline-block';
    } else {
        // Hide shop owner tabs completely for regular customers
        document.getElementById('manageMenuTab').style.display = 'none';
        document.getElementById('salesReportTab').style.display = 'none';
        
        // Hide shop owner sections completely
        const manageMenuSection = document.getElementById('manage-menu');
        const salesReportSection = document.getElementById('sales-report');
        if (manageMenuSection) manageMenuSection.style.display = 'none';
        if (salesReportSection) salesReportSection.style.display = 'none';
        
        // Ensure only shopping tab is active
        document.getElementById('shopping').classList.add('active');
        document.querySelector('[data-tab="shopping"]').classList.add('active');
    }
}

// Tab Switching
function switchTab(tabName) {
    // Check if customer is trying to access shop owner section
    if ((tabName === 'manage-menu' || tabName === 'sales-report') && 
        (!currentCustomer || !currentCustomer.isShopOwner)) {
        alert('Access denied. This section is only for shop owners.');
        return;
    }
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    if (tabName === 'sales-report') {
        // Always refresh sales report when switching to it to show latest transactions
        loadSalesReport();
    } else if (tabName === 'manage-menu') {
        loadMenuItems();
    }
}

// Load Products
function loadProducts(category = 'all') {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';

    let filteredProducts = menuItems;
    if (category !== 'all') {
        filteredProducts = menuItems.filter(item => item.category === category);
    }

    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        const imageUrl = product.image || `https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop`;
        productCard.innerHTML = `
            <img src="${imageUrl}" alt="${product.name}" class="product-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'">
            <div class="product-name">${product.name}</div>
            <div class="product-price">₹${product.price.toFixed(2)}</div>
        `;
        productCard.addEventListener('click', () => addToCart(product.id));
        productsGrid.appendChild(productCard);
    });
}

// Filter Products
function filterProducts(category) {
    loadProducts(category);
}

// Add to Cart
function addToCart(productId) {
    const product = menuItems.find(item => item.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    saveCart();
    loadCart();
}

// Display Customer Info
function displayCustomerInfo() {
    if (currentCustomer) {
        document.getElementById('customerNameDisplay').textContent = `Welcome, ${currentCustomer.name}`;
        document.getElementById('deliveryAddressText').textContent = currentCustomer.address || 'No address provided';
    }
}

// Handle Delivery Toggle
function handleDeliveryToggle() {
    const isDelivery = document.getElementById('homeDelivery').checked;
    const deliveryAddress = document.getElementById('deliveryAddress');
    const deliveryCharge = document.getElementById('deliveryCharge');
    const grandTotal = document.getElementById('grandTotal');
    
    if (isDelivery) {
        deliveryAddress.style.display = 'block';
        deliveryCharge.style.display = 'block';
        grandTotal.style.display = 'block';
        updateCartTotals();
    } else {
        deliveryAddress.style.display = 'none';
        deliveryCharge.style.display = 'none';
        grandTotal.style.display = 'none';
        updateCartTotals();
    }
}

// Update Cart Totals
function updateCartTotals() {
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const isDelivery = document.getElementById('homeDelivery').checked;
    
    document.getElementById('cartTotal').textContent = cartTotal.toFixed(2);
    
    if (isDelivery) {
        document.getElementById('deliveryChargeAmount').textContent = DELIVERY_CHARGE.toFixed(2);
        const grandTotal = cartTotal + DELIVERY_CHARGE;
        document.getElementById('grandTotalAmount').textContent = grandTotal.toFixed(2);
    }
}

// Load Cart
function loadCart() {
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        document.getElementById('cartTotal').textContent = '0.00';
        document.getElementById('deliveryCharge').style.display = 'none';
        document.getElementById('grandTotal').style.display = 'none';
        return;
    }

    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${item.price.toFixed(2)} each</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-total">₹${itemTotal.toFixed(2)}</div>
        `;
        cartItems.appendChild(cartItem);
    });

    updateCartTotals();
}

// Logout Function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('currentCustomer');
        window.location.href = 'login.html';
    }
}

// Update Quantity
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        cart = cart.filter(item => item.id !== productId);
    }

    saveCart();
    loadCart();
}

// Clear Cart
function clearCart() {
    if (cart.length === 0) return;
    if (confirm('Are you sure you want to clear the cart?')) {
        cart = [];
        saveCart();
        loadCart();
    }
}

// Save Cart
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load Cart from localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// Show Payment Modal
function showPaymentModal() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const isDelivery = document.getElementById('homeDelivery').checked;
    const deliveryCharge = isDelivery ? DELIVERY_CHARGE : 0;
    const total = cartTotal + deliveryCharge;
    
    document.getElementById('paymentAmount').textContent = total.toFixed(2);

    // Save transaction to sales report when Pay Now is clicked
    const transactionId = 'TXN' + Date.now();
    const now = new Date();

    const transaction = {
        id: transactionId,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        items: JSON.parse(JSON.stringify(cart)),
        customerName: currentCustomer ? currentCustomer.name : 'Guest',
        customerPhone: currentCustomer ? currentCustomer.phone : '',
        customerAddress: currentCustomer ? currentCustomer.address : '',
        isDelivery: isDelivery,
        deliveryCharge: deliveryCharge,
        subtotal: cartTotal,
        total: total,
        timestamp: now.getTime()
    };

    // Save transaction to sales report
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Refresh sales report if it's currently visible
    const salesReportTab = document.getElementById('sales-report');
    if (salesReportTab && salesReportTab.classList.contains('active')) {
        loadSalesReport();
    }

    // Generate QR Code (Static UPI QR)
    const qrData = 'upi://pay?pa=ak.supermarket@upi&pn=AK%20Supermarket&am=' + total.toFixed(2) + '&cu=INR';
    const qrcodeDiv = document.getElementById('qrcode');
    
    // Check if QRCode library is available
    if (typeof QRCode === 'undefined') {
        qrcodeDiv.innerHTML = '<p style="color: red; padding: 20px;">QR Code library not loaded. Please refresh the page.</p>';
        document.getElementById('qrModal').classList.add('active');
        return;
    }
    
    // Show loading state
    qrcodeDiv.innerHTML = '<div style="padding: 20px; text-align: center;"><p>Generating QR Code...</p></div>';
    
    // Open modal first
    document.getElementById('qrModal').classList.add('active');
    
    // Small delay to ensure modal is visible before generating QR code
    setTimeout(function() {
        // Clear previous content
        qrcodeDiv.innerHTML = '';
        
        // Create canvas element for QR code
        const canvas = document.createElement('canvas');
        
        // Use QRCode.toCanvas with proper error handling
        QRCode.toCanvas(canvas, qrData, {
            width: 250,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        }, function (error) {
            if (error) {
                console.error('QR Code error:', error);
                qrcodeDiv.innerHTML = '<p style="color: red; padding: 20px; text-align: center;">QR Code generation failed. Please try again.</p>';
            } else {
                // Clear and append canvas
                qrcodeDiv.innerHTML = '';
                qrcodeDiv.appendChild(canvas);
                // Center the canvas
                canvas.style.display = 'block';
                canvas.style.margin = '0 auto';
            }
        });
    }, 100);
}

// Close Payment Modal
function closePaymentModal() {
    document.getElementById('qrModal').classList.remove('active');
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('qrModal');
    if (event.target === modal) {
        closePaymentModal();
    }
});

// Confirm Payment
function confirmPayment() {
    if (cart.length === 0) {
        alert('Cart is already empty!');
        return;
    }

    // Transaction was already saved when Pay Now was clicked
    // Just clear the cart and close modal
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Clear cart
    cart = [];
    saveCart();
    loadCart();

    // Close modal
    closePaymentModal();

    // Refresh sales report if it's currently visible
    const salesReportTab = document.getElementById('sales-report');
    if (salesReportTab && salesReportTab.classList.contains('active')) {
        loadSalesReport();
    }

    alert('Payment confirmed!\n\nTotal Amount: ₹' + total.toFixed(2) + '\n\nTransaction has been added to Sales Report.');
}

// Print Bill
function printBill() {
    if (cart.length === 0) {
        alert('No items in cart to print!');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const now = new Date();
    
    // Get the latest transaction ID (from when Pay Now was clicked)
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    let transactionId = 'TXN' + Date.now();
    
    // Find the most recent transaction for this cart
    if (transactions.length > 0) {
        const latestTransaction = transactions[transactions.length - 1];
        // Check if it matches current cart
        if (latestTransaction && latestTransaction.items.length === cart.length) {
            transactionId = latestTransaction.id;
        }
    }

    // Populate bill
    document.getElementById('billDate').textContent = now.toLocaleString();
    document.getElementById('billTransactionId').textContent = transactionId;
    document.getElementById('billTotal').textContent = total.toFixed(2);

    const billItems = document.getElementById('billItems');
    billItems.innerHTML = '';
    cart.forEach(item => {
        const row = document.createElement('tr');
        const itemTotal = item.price * item.quantity;
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>₹${itemTotal.toFixed(2)}</td>
        `;
        billItems.appendChild(row);
    });

    // Print
    window.print();
}

// Menu Management - Load Items
function loadMenuItems() {
    menuItems = JSON.parse(localStorage.getItem('menuItems') || '[]');
    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = '';

    menuItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';
        const imageUrl = item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop';
        itemCard.innerHTML = `
            <img src="${imageUrl}" alt="${item.name}" class="item-card-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'">
            <div class="item-card-info">
                <div class="item-card-name">${item.name}</div>
                <div class="item-card-category">${item.category}</div>
                <div class="item-card-price">₹${item.price.toFixed(2)}</div>
            </div>
            <div class="item-card-actions">
                <button class="btn btn-primary" onclick="editItem(${item.id})">Edit</button>
                <button class="btn btn-danger" onclick="deleteItem(${item.id})">Delete</button>
            </div>
        `;
        itemsList.appendChild(itemCard);
    });
}

// Handle Add Item Form
function handleAddItem(e) {
    e.preventDefault();

    const name = document.getElementById('itemName').value;
    const category = document.getElementById('itemCategory').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const imageUrl = document.getElementById('itemImageUrl').value;
    const imageFile = document.getElementById('itemImage').files[0];
    
    // Get image - prioritize uploaded file, then URL, then empty
    let image = imageUrl;
    
    // If file is selected, convert to base64
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Image = e.target.result;
            saveItemWithImage(name, category, price, base64Image);
        };
        reader.readAsDataURL(imageFile);
        return; // Wait for file to be read
    }
    
    // If no file, use URL or empty
    saveItemWithImage(name, category, price, image);
}

// Save item with image
function saveItemWithImage(name, category, price, image) {
    if (editingItemId !== null) {
        // Update existing item
        const item = menuItems.find(item => item.id === editingItemId);
        if (item) {
            item.name = name;
            item.category = category;
            item.price = price;
            item.image = image || item.image; // Keep existing image if new one is empty
        }
        editingItemId = null;
        document.getElementById('cancelEdit').style.display = 'none';
    } else {
        // Add new item
        const newId = menuItems.length > 0 ? Math.max(...menuItems.map(i => i.id)) + 1 : 1;
        menuItems.push({
            id: newId,
            name: name,
            category: category,
            price: price,
            image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop'
        });
    }

    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    document.getElementById('addItemForm').reset();
    clearImagePreview();
    loadMenuItems();
    loadProducts();
}

// Edit Item
function editItem(itemId) {
    const item = menuItems.find(item => item.id === itemId);
    if (!item) return;

    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemImageUrl').value = (item.image && !item.image.startsWith('data:image')) ? item.image : '';
    
    // Clear file input and preview
    document.getElementById('itemImage').value = '';
    clearImagePreview();
    
    // Show preview if image exists
    if (item.image) {
        const preview = document.getElementById('previewImg');
        preview.src = item.image;
        document.getElementById('imagePreview').style.display = 'block';
    }

    editingItemId = itemId;
    document.getElementById('cancelEdit').style.display = 'inline-block';

    // Scroll to form
    document.querySelector('.add-item-form').scrollIntoView({ behavior: 'smooth' });
}

// Cancel Edit
function cancelEdit() {
    editingItemId = null;
    document.getElementById('addItemForm').reset();
    clearImagePreview();
    document.getElementById('cancelEdit').style.display = 'none';
}

// Preview Image
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('previewImg');
            preview.src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Clear Image Preview
function clearImagePreview() {
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '';
    document.getElementById('itemImage').value = '';
}

// Delete Item
function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    menuItems = menuItems.filter(item => item.id !== itemId);
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
    loadMenuItems();
    loadProducts();
}

// Load Sales Report
function loadSalesReport(filterMonth = null) {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const tableBody = document.getElementById('reportTableBody');
    const totalSalesEl = document.getElementById('totalSales');
    const totalTransactionsEl = document.getElementById('totalTransactions');

    // Sort transactions by timestamp (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => {
        return (b.timestamp || 0) - (a.timestamp || 0);
    });

    let filteredTransactions = sortedTransactions;
    if (filterMonth) {
        filteredTransactions = sortedTransactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getFullYear() === filterMonth.year &&
                   transactionDate.getMonth() === filterMonth.month;
        });
    }

    tableBody.innerHTML = '';

    if (filteredTransactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #999;">No transactions found</td></tr>';
        totalSalesEl.textContent = '0.00';
        totalTransactionsEl.textContent = '0';
        return;
    }

    let totalSales = 0;
    filteredTransactions.forEach(transaction => {
        totalSales += transaction.total;
        const row = document.createElement('tr');
        const itemsList = transaction.items.map(item => `${item.name} (${item.quantity})`).join(', ');
        const customerInfo = transaction.customerName ? 
            `${transaction.customerName}${transaction.isDelivery ? ' (Home Delivery)' : ''}` : 
            'Guest';
        const customerAddress = transaction.customerAddress ? 
            `<br><small style="color: #666;">Address: ${transaction.customerAddress}</small>` : 
            '';
        row.innerHTML = `
            <td>${transaction.date}</td>
            <td>${transaction.time}</td>
            <td>${itemsList}<br><small style="color: #666;">Customer: ${customerInfo}</small>${customerAddress}</td>
            <td>₹${transaction.total.toFixed(2)}${transaction.deliveryCharge > 0 ? `<br><small style="color: #666;">(Delivery: ₹${transaction.deliveryCharge.toFixed(2)})</small>` : ''}</td>
            <td>${transaction.id}</td>
        `;
        tableBody.appendChild(row);
    });

    totalSalesEl.textContent = totalSales.toFixed(2);
    totalTransactionsEl.textContent = filteredTransactions.length;
}

// Filter Sales Report
function filterSalesReport() {
    const monthInput = document.getElementById('reportMonth').value;
    if (!monthInput) {
        loadSalesReport();
        return;
    }

    const [year, month] = monthInput.split('-').map(Number);
    loadSalesReport({ year, month: month - 1 }); // month is 0-indexed in JS
}

// Reset Sales Report
function resetSalesReport() {
    document.getElementById('reportMonth').value = '';
    loadSalesReport();
}

