// Переключение темы
const themeSwitch = document.getElementById('themeSwitch');
themeSwitch.addEventListener('change', () => {
    document.body.classList.toggle('light');
    document.querySelector('.converter').classList.toggle('light');
    document.querySelector('#amount').classList.toggle('light');
    document.querySelector('.convert-btn').classList.toggle('light');
    document.querySelector('.result').classList.toggle('light');
    document.querySelector('.history').classList.toggle('light');
    document.querySelector('.converter-header').classList.toggle('light');
    document.querySelector('.resize-handle').classList.toggle('light');
    document.querySelectorAll('select').forEach(select => select.classList.toggle('light'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('light'));
    document.querySelector('.arrow').classList.toggle('light');
    document.querySelector('.history-header').classList.toggle('light');
    document.querySelector('#currentRate').classList.toggle('light');
    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.toggle('light'));
    updateChartColors();
});

// Перетаскивание конвертера
const converter = document.getElementById('converter');
const header = document.querySelector('.converter-header');
let isDragging = false;
let currentX, currentY;

header.addEventListener('mousedown', (e) => {
    isDragging = true;
    currentX = e.clientX - converter.offsetLeft;
    currentY = e.clientY - converter.offsetTop;
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        converter.style.left = (e.clientX - currentX) + 'px';
        converter.style.top = (e.clientY - currentY) + 'px';
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

// Изменение размера конвертера
const resizeHandle = document.querySelector('.resize-handle');
let isResizing = false;

resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (isResizing) {
        const newWidth = e.clientX - converter.offsetLeft;
        const newHeight = e.clientY - converter.offsetTop;
        if (newWidth >= 300) converter.style.width = newWidth + 'px';
        if (newHeight >= 500) converter.style.height = newHeight + 'px';
    }
});

document.addEventListener('mouseup', () => {
    isResizing = false;
});

// Получение курсов валют с API
const apiKey = 'fca73421f8bacaf481628f4d';
const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;

let rates = {};
let chart;

// Функция для получения флага по коду валюты
function getFlagUrl(currency) {
    const countryCodes = {
        'USD': 'us',
        'EUR': 'eu',
        'RUB': 'ru',
        'GBP': 'gb',
        'JPY': 'jp',
        'CNY': 'cn',
        'KZT': 'kz',
        'TRY': 'tr',
        'AED': 'ae',
        // Добавьте другие валюты по необходимости
    };
    const countryCode = countryCodes[currency] || 'un';
    return `https://flagcdn.com/20x15/${countryCode}.png`;
}

// Функция для получения названия валюты
function getCurrencyName(currency) {
    const currencyNames = {
        'USD': 'Доллар США',
        'EUR': 'Евро',
        'RUB': 'Российский рубль',
        'GBP': 'Британский фунт',
        'JPY': 'Японская иена',
        'CNY': 'Китайский юань',
        'KZT': 'Казахстанский тенге',
        'TRY': 'Турецкая лира',
        'AED': 'Дирхам ОАЭ',
        // Добавьте другие валюты по необходимости
    };
    return currencyNames[currency] || currency;
}

async function fetchCurrencies() {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.result === 'success') {
            rates = data.conversion_rates;
            populateCurrencies();
            updateRateInfo();
            updateChart('month');
        } else {
            alert('Ошибка при загрузке курсов валют. Проверьте API ключ.');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить курсы валют. Проверьте подключение к интернету.');
    }
}

function populateCurrencies() {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    const currencies = Object.keys(rates);

    currencies.forEach(currency => {
        const option1 = document.createElement('option');
        option1.value = currency;
        option1.textContent = `${currency} - ${getCurrencyName(currency)}`;
        option1.style.backgroundImage = `url(${getFlagUrl(currency)})`;
        fromCurrency.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = currency;
        option2.textContent = `${currency} - ${getCurrencyName(currency)}`;
        option2.style.backgroundImage = `url(${getFlagUrl(currency)})`;
        toCurrency.appendChild(option2);
    });

    fromCurrency.value = 'USD';
    toCurrency.value = 'RUB';
}

// Обновление информации о курсе
function updateRateInfo() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const rateFrom = rates[fromCurrency];
    const rateTo = rates[toCurrency];
    const rate = (rateTo / rateFrom).toFixed(2);

    document.getElementById('currentRate').textContent = `1 ${fromCurrency} = ${rate} ${toCurrency}`;

    // Фиктивное изменение курса (для примера)
    const change = -6.94; // Замените на реальные данные, если есть API
    const percentage = -7.6; // Замените на реальные данные
    const rateChange = document.getElementById('rateChange');
    rateChange.textContent = `↓ ${Math.abs(change)} ₽ ${percentage}% за месяц`;
    rateChange.classList.remove('up', 'down');
    rateChange.classList.add(change < 0 ? 'down' : 'up');
}

// Функция для обновления графика
function updateChart(period) {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    const rateFrom = rates[fromCurrency];
    const rateTo = rates[toCurrency];
    const currentRate = rateTo / rateFrom;

    // Фиктивные данные для графика (замените на реальные данные из API)
    let labels, data;
    if (period === 'month') {
        labels = ['20 февр.', '26 февр.', '4 мар.', '10 мар.', '14 мар.', '20 мар.'];
        data = [92.46, 91.50, 90.00, 87.50, 85.00, currentRate]; // Примерные данные
    } else if (period === 'year') {
        labels = ['Мар 2024', 'Июн 2024', 'Сен 2024', 'Дек 2024', 'Мар 2025'];
        data = [95.00, 93.00, 90.00, 88.00, currentRate];
    } else {
        labels = ['2023', '2024', '2025'];
        data = [75.00, 85.00, currentRate];
    }

    // Обновление активной кнопки
    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.period-btn[onclick="updateChart('${period}')"]`).classList.add('active');

    // Создание или обновление графика
    const ctx = document.getElementById('exchangeChart').getContext('2d');
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${fromCurrency}/${toCurrency}`,
                data: data,
                borderColor: '#ff4d4d',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                pointRadius: 0,
            }]
        },
        options: {
            scales: {
                x: {
                    ticks: {
                        color: document.body.classList.contains('light') ? '#000000' : '#ffffff',
                        font: { size: 10 }
                    },
                    grid: { display: false }
                },
                y: {
                    ticks: {
                        color: document.body.classList.contains('light') ? '#000000' : '#ffffff',
                        font: { size: 10 }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: { display: false }
            },
            maintainAspectRatio: false
        }
    });
}

// Обновление цветов графика при смене темы
function updateChartColors() {
    if (chart) {
        chart.options.scales.x.ticks.color = document.body.classList.contains('light') ? '#000000' : '#ffffff';
        chart.options.scales.y.ticks.color = document.body.classList.contains('light') ? '#000000' : '#ffffff';
        chart.options.scales.y.grid.color = document.body.classList.contains('light') ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
        chart.update();
    }
}

// Функция конвертации
function convertCurrency() {
    const amount = parseFloat(document.getElementById('amount').value);
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;

    if (isNaN(amount) || amount <= 0) {
        alert('Пожалуйста, введите корректную сумму.');
        return;
    }

    const rateFrom = rates[fromCurrency];
    const rateTo = rates[toCurrency];
    const amountInUSD = amount / rateFrom;
    const convertedAmount = amountInUSD * rateTo;

    const result = convertedAmount.toFixed(2);
    document.getElementById('result').textContent = `${amount} ${fromCurrency} = ${result} ${toCurrency}`;

    // Добавление в историю
    const historyContent = document.querySelector('.history-content');
    const historyEntry = document.createElement('div');
    historyEntry.innerHTML = `
        <span class="expression">${amount} ${fromCurrency}</span>
        <span class="equals">=</span>
        <span class="result">${result} ${toCurrency}</span>
    `;
    historyContent.appendChild(historyEntry);
    historyContent.scrollTop = historyContent.scrollHeight;
}

// Обновление при изменении валют
document.getElementById('fromCurrency').addEventListener('change', () => {
    updateRateInfo();
    updateChart(document.querySelector('.period-btn.active').getAttribute('onclick').match(/'([^']+)'/)[1]);
});

document.getElementById('toCurrency').addEventListener('change', () => {
    updateRateInfo();
    updateChart(document.querySelector('.period-btn.active').getAttribute('onclick').match(/'([^']+)'/)[1]);
});

// Загрузка валют при старте
fetchCurrencies();