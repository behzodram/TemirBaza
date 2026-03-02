
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCdrz8JMttKpswmvjmlIDivROJHS_uIMwU",
    authDomain: "mosekspometall.firebaseapp.com",
    databaseURL: "https://mosekspometall-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mosekspometall",
    storageBucket: "mosekspometall.firebasestorage.app",
    messagingSenderId: "974569748549",
    appId: "1:974569748549:web:ffebaa3b638e4572804b2c",
    measurementId: "G-7Y5PQQ5Y4Q"
};
    
// console.log("Main site Firebase connected:", app);
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "metallom2025";

// Login
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        loadOrders();
        loadPrices();
    } else {
        document.getElementById('errorMessage').style.display = 'block';
    }
});

// Load Orders
function loadOrders() {
    const ordersRef = ref(database, 'orders');
    onValue(ordersRef, (snapshot) => {
        const ordersGrid = document.getElementById('ordersGrid');
        ordersGrid.innerHTML = '';

        if (!snapshot.exists()) {
            ordersGrid.innerHTML = '<p style="text-align:center;color:#7f8c8d;grid-column:1/-1;">Нет заявок</p>';
            return;
        }

        const orders = [];
        snapshot.forEach((childSnapshot) => {
            orders.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        orders.reverse().forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            orderCard.onclick = () => showOrderDetail(order);
            orderCard.innerHTML = `
                        <div class="order-header">
                            <span class="order-id">ID: ${order.id.substring(0, 8)}</span>
                            <span class="order-date">${order.date}</span>
                        </div>
                        <div class="order-info">
                            <strong>Имя:</strong> <span>${order.name}</span>
                        </div>
                        <div class="order-info">
                            <strong>Телефон:</strong> <span>${order.phone}</span>
                        </div>
                        <div class="order-info">
                            <strong>Количество:</strong> <span>${order.quantity} кг</span>
                        </div>
                        <div class="order-info">
                            <strong>Адрес:</strong> <span>${order.address}</span>
                        </div>
                    `;
            ordersGrid.appendChild(orderCard);
        });
    });
}

// Show Order Detail
window.showOrderDetail = function (order) {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
                <div class="detail-row">
                    <div class="detail-label">ID Заявки</div>
                    <div class="detail-value">${order.id}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Дата и время</div>
                    <div class="detail-value">${order.date}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Имя клиента</div>
                    <div class="detail-value">${order.name}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Номер телефона</div>
                    <div class="detail-value"><a href="tel:${order.phone}">${order.phone}</a></div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Количество</div>
                    <div class="detail-value">${order.quantity} кг</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Адрес</div>
                    <div class="detail-value">${order.address}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Комментарий</div>
                    <div class="detail-value">${order.comment || 'Нет комментария'}</div>
                </div>
            `;
    document.getElementById('orderModal').style.display = 'block';
};

// Load Prices
function loadPrices() {
    const pricesRef = ref(database, 'prices');
    onValue(pricesRef, (snapshot) => {
        const pricesGrid = document.getElementById('pricesGrid');
        pricesGrid.innerHTML = '';

        const metals = [
            { id: 'iron', name: '🔩 Железный лом (А3)', category: 'black', default: 2500 },
            { id: 'cast_iron', name: '⚙️ Чугун', category: 'black', default: 2200 },
            { id: 'steel', name: '🔧 Стальной лом', category: 'black', default: 2800 },
            { id: 'rebar', name: '🏗️ Арматура', category: 'black', default: 2400 },
            { id: 'copper', name: '🟡 Медь', category: 'colored', default: 95000 },
            { id: 'brass', name: '🟠 Латунь', category: 'colored', default: 55000 },
            { id: 'aluminum', name: '⚪ Алюминий', category: 'colored', default: 28000 },
            { id: 'lead', name: '🔵 Свинец', category: 'colored', default: 18000 },
            { id: 'stainless', name: '⚫ Нержавейка', category: 'colored', default: 45000 }
        ];

        const prices = snapshot.val() || {};

        metals.forEach(metal => {
            const price = prices[metal.id] || metal.default;
            const priceCard = document.createElement('div');
            priceCard.className = 'price-card';
            priceCard.innerHTML = `
                        <div class="price-header">${metal.name}</div>
                        <div class="price-input-group">
                            <input type="number" class="price-input" id="price-${metal.id}" value="${price}" min="0">
                            <button class="update-btn" onclick="updatePrice('${metal.id}')">Обновить</button>
                        </div>
                        <span class="category-badge badge-${metal.category}">
                            ${metal.category === 'black' ? 'Черный металл' : 'Цветной металл'}
                        </span>
                    `;
            pricesGrid.appendChild(priceCard);
        });
    });
}

// Update Price
window.updatePrice = async function (metalId) {
    const priceInput = document.getElementById(`price-${metalId}`);
    const newPrice = parseInt(priceInput.value);

    if (isNaN(newPrice) || newPrice < 0) {
        alert('Пожалуйста, введите корректную цену');
        return;
    }

    try {
        const priceRef = ref(database, `prices/${metalId}`);
        await set(priceRef, newPrice);

        // Show success toast
        const toast = document.getElementById('successToast');
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при обновлении цены');
    }
};

// Make functions global
window.loadOrders = loadOrders;
window.loadPrices = loadPrices;


// Tab switching
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// Logout
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('loginForm').reset();
        document.getElementById('errorMessage').style.display = 'none';
    }
}

// Close modal
function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
}

// Close modal on outside click
window.onclick = function (event) {
    const modal = document.getElementById('orderModal');
    if (event.target == modal) {
        closeModal();
    }
}

window.showTab = showTab;
window.logout = logout;
window.closeModal = closeModal;
