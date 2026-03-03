import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, onValue, push, set } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";
import { getStorage, ref as storageRef, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

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

// Format price in rubles
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Create metal card
function createMetalCard(metal, price) {
    return `
        <div class="metal-card">
            <img src="${metal.imageUrl || 'images/placeholder.jpg'}" alt="${metal.name}" class="metal-image" loading="lazy">
            <div class="metal-info">
                <div class="metal-name">${metal.name}</div>
                <div class="metal-price" id="price-${metal.id}">
                    ${price ? formatPrice(price) : '<span class="price-loading">Загрузка...</span>'}
                    <span class="metal-unit">₽ / кг</span>
                </div>
                <span class="metal-category category-${metal.category}">
                    ${metal.category === 'black' ? 'Черный металл' : 'Цветной металл'}
                </span>
            </div>
        </div>
    `;
}

// Load site settings (hero image and favicon)
function loadSiteSettings() {
    const settingsRef = ref(database, 'settings');
    onValue(settingsRef, (snapshot) => {
        const settings = snapshot.val() || {};
        
        // Update hero background
        const heroSection = document.getElementById('hero');
        if (settings.heroImageUrl) {
            heroSection.style.background = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('${settings.heroImageUrl}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
        }
        
        // Update favicon
        if (settings.faviconUrl) {
            const favicon = document.getElementById('favicon');
            favicon.href = settings.faviconUrl;
        }
    });
}

// Load metals from Firebase
const metalGrid = document.getElementById('metalGrid');

// Listen to metals changes
const metalsRef = ref(database, 'metals');
onValue(metalsRef, (snapshot) => {
    const metalsData = snapshot.val() || {};
    metalGrid.innerHTML = ''; // Clear grid
    
    // Convert object to array and sort by order
    const metals = Object.entries(metalsData).map(([id, data]) => ({
        id,
        ...data
    })).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    metals.forEach(metal => {
        metalGrid.innerHTML += createMetalCard(metal, null);
        
        // Load image from Storage if imagePath exists
        if (metal.imagePath && !metal.imageUrl) {
            const imageRef = storageRef(storage, metal.imagePath);
            getDownloadURL(imageRef)
                .then((url) => {
                    const img = document.querySelector(`#price-${metal.id}`).closest('.metal-card').querySelector('.metal-image');
                    if (img) {
                        img.src = url;
                        // Update the metal object with URL
                        metal.imageUrl = url;
                    }
                })
                .catch((error) => {
                    console.error('Error loading image:', error);
                });
        }
    });
});

// Listen to price changes
const pricesRef = ref(database, 'prices');
onValue(pricesRef, (snapshot) => {
    const prices = snapshot.val() || {};

    // Get metals again to update prices
    const metalsRef = ref(database, 'metals');
    onValue(metalsRef, (metalsSnapshot) => {
        const metalsData = metalsSnapshot.val() || {};
        const metals = Object.entries(metalsData).map(([id, data]) => ({
            id,
            ...data
        }));

        metals.forEach(metal => {
            const price = prices[metal.id] || metal.defaultPrice || 0;
            const priceElement = document.getElementById(`price-${metal.id}`);

            if (priceElement) {
                priceElement.innerHTML = `
                    ${formatPrice(price)}
                    <span class="metal-unit">₽ / кг</span>
                `;
            }
        });
    }, { onlyOnce: true }); // Get metals once to avoid infinite loop
});

// Load site settings on page load
loadSiteSettings();

// Order form submission
document.getElementById('orderForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const successMsg = document.getElementById('successMessage');
    const errorMsg = document.getElementById('errorMessage');

    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';

    const formData = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        quantity: document.getElementById('quantity').value,
        address: document.getElementById('address').value,
        comment: document.getElementById('comment').value,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleString('ru-RU', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    };

    try {
        const ordersRef = ref(database, 'orders');
        const newOrderRef = push(ordersRef);
        await set(newOrderRef, formData);

        successMsg.style.display = 'block';
        document.getElementById('orderForm').reset();

        setTimeout(() => {
            closeModal();
            successMsg.style.display = 'none';
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        errorMsg.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить Заявку';
    }
});

function openModal() {
    document.getElementById('orderModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('orderModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
}

window.onclick = function (event) {
    const modal = document.getElementById('orderModal');
    if (event.target == modal) {
        closeModal();
    }
}

window.openModal = openModal;
window.closeModal = closeModal;