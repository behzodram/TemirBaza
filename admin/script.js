import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    onValue, 
    set, 
    update,
    remove 
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import {
    getStorage,
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

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
        loadMetals();
        loadSettings();
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

        // Load metals first
        const metalsRef = ref(database, 'metals');
        onValue(metalsRef, (metalsSnapshot) => {
            const metals = metalsSnapshot.val() || {};
            const prices = snapshot.val() || {};

            Object.entries(metals).forEach(([id, metal]) => {
                const price = prices[id] || metal.defaultPrice || 0;
                const priceCard = document.createElement('div');
                priceCard.className = 'price-card';
                priceCard.innerHTML = `
                    <div class="price-header">${metal.name}</div>
                    <div class="price-input-group">
                        <input type="number" class="price-input" id="price-${id}" value="${price}" min="0">
                        <button class="update-btn" onclick="updatePrice('${id}')">Обновить</button>
                    </div>
                    <span class="category-badge badge-${metal.category}">
                        ${metal.category === 'black' ? 'Черный металл' : 'Цветной металл'}
                    </span>
                `;
                pricesGrid.appendChild(priceCard);
            });
        }, { onlyOnce: true });
    });
}

// Load Metals for management
function loadMetals() {
    const metalsRef = ref(database, 'metals');
    onValue(metalsRef, (snapshot) => {
        const metalsGrid = document.getElementById('metalsGrid');
        metalsGrid.innerHTML = '';

        const metals = snapshot.val() || {};

        // Add new metal button
        const addCard = document.createElement('div');
        addCard.className = 'metal-card add-metal';
        addCard.innerHTML = `
            <div class="add-metal-content" onclick="openAddMetalModal()">
                <span style="font-size: 48px;">+</span>
                <span>Добавить металл</span>
            </div>
        `;
        metalsGrid.appendChild(addCard);

        // Display existing metals
        Object.entries(metals).forEach(([id, metal]) => {
            const metalCard = document.createElement('div');
            metalCard.className = 'metal-card';
            metalCard.innerHTML = `
                <img src="${metal.imageUrl || 'images/placeholder.jpg'}" alt="${metal.name}" class="metal-image" style="width:100%;height:150px;object-fit:cover;border-radius:8px;">
                <div class="metal-info">
                    <h3>${metal.name}</h3>
                    <p>Категория: ${metal.category === 'black' ? 'Черный' : 'Цветной'}</p>
                    <p>Базовая цена: ${metal.defaultPrice} ₽/кг</p>
                    <p>Порядок: ${metal.order || 0}</p>
                    <div class="metal-actions">
                        <button class="edit-btn" onclick="editMetal('${id}')">✏️ Редактировать</button>
                        <button class="delete-btn" onclick="deleteMetal('${id}', '${metal.imagePath || ''}')">🗑️ Удалить</button>
                    </div>
                </div>
            `;
            metalsGrid.appendChild(metalCard);
        });
    });
}

// Load Site Settings
function loadSettings() {
    const settingsRef = ref(database, 'settings');
    onValue(settingsRef, (snapshot) => {
        const settings = snapshot.val() || {};
        const currentSettings = document.getElementById('currentSettings');
        
        // Update previews
        if (settings.heroImageUrl) {
            document.getElementById('heroPreview').src = settings.heroImageUrl;
            document.getElementById('heroPreview').style.display = 'block';
        }
        
        if (settings.faviconUrl) {
            document.getElementById('faviconPreview').src = settings.faviconUrl;
            document.getElementById('faviconPreview').style.display = 'block';
        }
        
        // Show current settings info
        currentSettings.innerHTML = `
            <p><strong>Hero изображение:</strong><br>
            ${settings.heroImageUrl ? '<a href="' + settings.heroImageUrl + '" target="_blank">' + settings.heroImageUrl.substring(0, 50) + '...</a>' : 'Не загружено'}</p>
            <p><strong>Favicon:</strong><br>
            ${settings.faviconUrl ? '<a href="' + settings.faviconUrl + '" target="_blank">' + settings.faviconUrl.substring(0, 50) + '...</a>' : 'Не загружено'}</p>
            <p><strong>Последнее обновление:</strong><br>
            ${settings.updatedAt ? new Date(settings.updatedAt).toLocaleString('ru-RU') : 'Нет данных'}</p>
        `;
    });
}

// Upload Hero Image
window.uploadHeroImage = async function() {
    const fileInput = document.getElementById('heroImage');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Выберите изображение');
        return;
    }
    
    showLoading(true);
    
    try {
        // Upload to Storage
        const timestamp = Date.now();
        const imagePath = `settings/hero_${timestamp}_${file.name}`;
        const imageStorageRef = storageRef(storage, imagePath);
        await uploadBytes(imageStorageRef, file);
        const imageUrl = await getDownloadURL(imageStorageRef);
        
        // Save to Database
        const settingsRef = ref(database, 'settings');
        await update(settingsRef, {
            heroImagePath: imagePath,
            heroImageUrl: imageUrl,
            updatedAt: new Date().toISOString()
        });
        
        showSuccess('Hero изображение обновлено');
        fileInput.value = ''; // Clear input
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при загрузке');
    } finally {
        showLoading(false);
    }
};

// Upload Favicon
window.uploadFavicon = async function() {
    const fileInput = document.getElementById('faviconImage');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Выберите изображение');
        return;
    }
    
    showLoading(true);
    
    try {
        // Upload to Storage
        const timestamp = Date.now();
        const imagePath = `settings/favicon_${timestamp}_${file.name}`;
        const imageStorageRef = storageRef(storage, imagePath);
        await uploadBytes(imageStorageRef, file);
        const imageUrl = await getDownloadURL(imageStorageRef);
        
        // Save to Database
        const settingsRef = ref(database, 'settings');
        await update(settingsRef, {
            faviconPath: imagePath,
            faviconUrl: imageUrl,
            updatedAt: new Date().toISOString()
        });
        
        showSuccess('Favicon обновлен');
        fileInput.value = ''; // Clear input
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при загрузке');
    } finally {
        showLoading(false);
    }
};

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
        showSuccess('Цена обновлена');
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при обновлении цены');
    }
};

// Add/Edit Metal Modal
window.openAddMetalModal = function() {
    document.getElementById('modalTitle').textContent = 'Добавить металл';
    document.getElementById('metalId').value = '';
    document.getElementById('metalName').value = '';
    document.getElementById('metalCategory').value = 'black';
    document.getElementById('metalPrice').value = '';
    document.getElementById('metalOrder').value = '0';
    document.getElementById('currentImage').style.display = 'none';
    document.getElementById('metalImage').required = true;
    document.getElementById('metalModal').style.display = 'block';
};

window.editMetal = async function(metalId) {
    const metalsRef = ref(database, `metals/${metalId}`);
    onValue(metalsRef, (snapshot) => {
        const metal = snapshot.val();
        document.getElementById('modalTitle').textContent = 'Редактировать металл';
        document.getElementById('metalId').value = metalId;
        document.getElementById('metalName').value = metal.name;
        document.getElementById('metalCategory').value = metal.category;
        document.getElementById('metalPrice').value = metal.defaultPrice;
        document.getElementById('metalOrder').value = metal.order || 0;
        
        const currentImage = document.getElementById('currentImage');
        if (metal.imageUrl) {
            currentImage.src = metal.imageUrl;
            currentImage.style.display = 'block';
        } else {
            currentImage.style.display = 'none';
        }
        
        document.getElementById('metalImage').required = false;
        document.getElementById('metalModal').style.display = 'block';
    }, { onlyOnce: true });
};

// Save Metal
document.getElementById('metalForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('saveMetalBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Сохранение...';

    const metalId = document.getElementById('metalId').value;
    const name = document.getElementById('metalName').value;
    const category = document.getElementById('metalCategory').value;
    const defaultPrice = parseInt(document.getElementById('metalPrice').value);
    const order = parseInt(document.getElementById('metalOrder').value) || 0;
    const imageFile = document.getElementById('metalImage').files[0];

    try {
        let imagePath = '';
        let imageUrl = '';

        // Upload image if selected
        if (imageFile) {
            const timestamp = Date.now();
            imagePath = `metals/${timestamp}_${imageFile.name}`;
            const imageStorageRef = storageRef(storage, imagePath);
            await uploadBytes(imageStorageRef, imageFile);
            imageUrl = await getDownloadURL(imageStorageRef);
        }

        const metalData = {
            name,
            category,
            defaultPrice,
            order,
            updatedAt: new Date().toISOString()
        };

        if (imagePath) {
            metalData.imagePath = imagePath;
            metalData.imageUrl = imageUrl;
        }

        if (metalId) {
            // Update existing metal
            const metalRef = ref(database, `metals/${metalId}`);
            await update(metalRef, metalData);
        } else {
            // Add new metal
            const newId = `metal_${Date.now()}`;
            const metalRef = ref(database, `metals/${newId}`);
            await set(metalRef, metalData);
        }

        closeMetalModal();
        showSuccess('Металл сохранен');
        loadMetals();
        loadPrices();
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при сохранении');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Сохранить';
    }
});

// Delete Metal
window.deleteMetal = async function(metalId, imagePath) {
    if (!confirm('Вы уверены, что хотите удалить этот металл?')) {
        return;
    }

    try {
        // Delete image from Storage if exists
        if (imagePath) {
            try {
                const imageStorageRef = storageRef(storage, imagePath);
                await deleteObject(imageStorageRef);
            } catch (error) {
                console.error('Error deleting image:', error);
            }
        }

        // Delete metal from Database
        const metalRef = ref(database, `metals/${metalId}`);
        await remove(metalRef);

        // Delete price if exists
        const priceRef = ref(database, `prices/${metalId}`);
        await remove(priceRef);

        showSuccess('Металл удален');
        loadMetals();
        loadPrices();
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при удалении');
    }
};

// Helper Functions
function showLoading(show) {
    document.getElementById('loadingSpinner').style.display = show ? 'flex' : 'none';
}

function showSuccess(message) {
    const toast = document.getElementById('successToast');
    toast.textContent = `✅ ${message}`;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Close Metal Modal
function closeMetalModal() {
    document.getElementById('metalModal').style.display = 'none';
    document.getElementById('metalForm').reset();
    document.getElementById('currentImage').style.display = 'none';
}

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

// Close modals on outside click
window.onclick = function (event) {
    const orderModal = document.getElementById('orderModal');
    const metalModal = document.getElementById('metalModal');
    
    if (event.target == orderModal) {
        closeModal();
    }
    if (event.target == metalModal) {
        closeMetalModal();
    }
}

window.showTab = showTab;
window.logout = logout;
window.closeModal = closeModal;
window.closeMetalModal = closeMetalModal;