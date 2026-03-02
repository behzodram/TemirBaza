import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

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


// Metal data with default prices
const metals = [
    {
        id: 'iron',
        name: '🔩 Железный лом (А3)',
        image: 'images/photo1.jpg',
        category: 'black',
        defaultPrice: 2500
    },
    {
        id: 'cast_iron',
        name: '⚙️ Чугун',
        image: 'images/photo2.jpg',
        category: 'black',
        defaultPrice: 2200
    },
    {
        id: 'steel',
        name: '🔧 Стальной лом',
        image: 'images/photo3.jpg',
        category: 'black',
        defaultPrice: 2800
    },
    {
        id: 'rebar',
        name: '🏗️ Арматура',
        image: 'images/photo4.jpg',
        category: 'black',
        defaultPrice: 2400
    },
    {
        id: 'copper',
        name: '🟡 Медь',
        image: 'images/photo5.jpg',
        category: 'colored',
        defaultPrice: 95000
    },
    {
        id: 'brass',
        name: '🟠 Латунь',
        image: 'images/photo6.jpg',
        category: 'colored',
        defaultPrice: 55000
    },
    {
        id: 'aluminum',
        name: '⚪ Алюминий',
        image: 'images/photo7.jpg',
        category: 'colored',
        defaultPrice: 28000
    },
    {
        id: 'lead',
        name: '🔵 Свинец',
        image: 'images/photo8.jpg',
        category: 'colored',
        defaultPrice: 18000
    },
    {
        id: 'stainless',
        name: '⚫ Нержавейка',
        image: 'images/photo9.jpg',
        category: 'colored',
        defaultPrice: 45000
    }
];

// Format price in rubles
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Create metal card
function createMetalCard(metal, price) {
    return `
                <div class="metal-card">
                    <img src="${metal.image}" alt="${metal.name}" class="metal-image">
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

// Initialize metal cards
const metalGrid = document.getElementById('metalGrid');
metals.forEach(metal => {
    metalGrid.innerHTML += createMetalCard(metal, null);
});

// Listen to price changes in real-time
const pricesRef = ref(database, 'prices');
onValue(pricesRef, (snapshot) => {
    const prices = snapshot.val() || {};

    metals.forEach(metal => {
        const price = prices[metal.id] || metal.defaultPrice;
        const priceElement = document.getElementById(`price-${metal.id}`);

        if (priceElement) {
            priceElement.innerHTML = `
                        ${formatPrice(price)}
                        <span class="metal-unit">₽ / кг</span>
                    `;
        }
    });
});

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