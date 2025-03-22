// Переключение темы
const themeSwitch = document.getElementById('themeSwitch');

// Функция для применения темы
function applyTheme(isLight) {
    if (isLight) {
        document.body.classList.add('light');
        document.querySelector('.converter').classList.add('light');
        document.querySelector('#amount').classList.add('light');
        document.querySelector('.convert-btn').classList.add('light');
        document.querySelector('.result').classList.add('light');
        document.querySelector('.history').classList.add('light');
        document.querySelector('.converter-header').classList.add('light');
        document.querySelector('.resize-handle').classList.add('light');
        document.querySelectorAll('select').forEach(select => select.classList.add('light'));
        document.querySelectorAll('.nav-link').forEach(link => link.classList.add('light'));
        document.querySelector('.swap-btn').classList.add('light');
        document.querySelector('.history-header').classList.add('light');
        document.querySelector('#currentRate').classList.add('light');
        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.add('light'));
        document.querySelector('.toggle-chart-btn').classList.add('light');
    } else {
        document.body.classList.remove('light');
        document.querySelector('.converter').classList.remove('light');
        document.querySelector('#amount').classList.remove('light');
        document.querySelector('.convert-btn').classList.remove('light');
        document.querySelector('.result').classList.remove('light');
        document.querySelector('.history').classList.remove('light');
        document.querySelector('.converter-header').classList.remove('light');
        document.querySelector('.resize-handle').classList.remove('light');
        document.querySelectorAll('select').forEach(select => select.classList.remove('light'));
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('light'));
        document.querySelector('.swap-btn').classList.remove('light');
        document.querySelector('.history-header').classList.remove('light');
        document.querySelector('#currentRate').classList.remove('light');
        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('light'));
        document.querySelector('.toggle-chart-btn').classList.remove('light');
    }
    updateChartColors();
}

// При загрузке страницы проверяем сохраненное состояние темы
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    const isLight = savedTheme === 'light';
    themeSwitch.checked = isLight;
    applyTheme(isLight);
});

// При изменении темы сохраняем состояние в localStorage
themeSwitch.addEventListener('change', () => {
    const isLight = themeSwitch.checked;
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    applyTheme(isLight);
});

// Перетаскивание конвертера
const converter = document.getElementById('converter');
const header = document.querySelector('.converter-header');
let isDragging = false;
let startX, startY;

// Устанавливаем начальную позицию
function setInitialPosition() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const converterWidth = converter.offsetWidth;
    const converterHeight = converter.offsetHeight;
    converter.style.left = `${(windowWidth - converterWidth) / 2}px`;
    converter.style.top = `${(windowHeight - converterHeight) / 2}px`;
}

setInitialPosition();

header.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - parseInt(converter.style.left || 0);
    startY = e.clientY - parseInt(converter.style.top || 0);
    converter.style.transition = 'none';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (isDragging) {
        let newX = e.clientX - startX;
        let newY = e.clientY - startY;
        newX = Math.max(0, Math.min(newX, window.innerWidth - converter.offsetWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - converter.offsetHeight));
        converter.style.left = newX + 'px';
        converter.style.top = newY + 'px';
    }
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        converter.style.transition = 'background 0.3s ease, box-shadow 0.3s ease';
    }
});

header.addEventListener('dblclick', () => {
    setInitialPosition();
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
        if (newWidth >= 600) converter.style.width = newWidth + 'px';
        if (newHeight >= 500) converter.style.height = newHeight + 'px';
    }
});

document.addEventListener('mouseup', () => {
    isResizing = false;
});

// Ограничение ввода отрицательных чисел
document.getElementById('amount').addEventListener('input', (e) => {
    if (e.target.value < 0) e.target.value = 0;
});

// Данные валют и графиков
const apiKey = '2LSSPK4AC1IHUWGS';
let rates = {};
let chart;
let rateHistory = {};
const supportedCurrencies = [
    'USD', 'EUR', 'RUB', 'CNY', 'TRY', 'KZT', 'GBP', 'JPY', 'AUD', 'CAD', 
    'CHF', 'NZD', 'BRL', 'INR', 'MXN', 'ZAR', 'SGD', 'HKD', 'NOK', 'SEK'
];

function getFlagUrl(currency) {
    const countryCodes = { 
        'USD': 'us', 'EUR': 'eu', 'RUB': 'ru', 'CNY': 'cn', 'TRY': 'tr', 'KZT': 'kz',
        'GBP': 'gb', 'JPY': 'jp', 'AUD': 'au', 'CAD': 'ca', 'CHF': 'ch', 'NZD': 'nz',
        'BRL': 'br', 'INR': 'in', 'MXN': 'mx', 'ZAR': 'za', 'SGD': 'sg', 'HKD': 'hk',
        'NOK': 'no', 'SEK': 'se'
    };
    return `https://flagcdn.com/20x15/${countryCodes[currency] || 'un'}.png`;
}

function getCurrencyName(currency) {
    const currencyNames = {
        'USD': 'Доллар США', 'EUR': 'Евро', 'RUB': 'Российский рубль', 'CNY': 'Китайский юань',
        'TRY': 'Турецкая лира', 'KZT': 'Казахстанский тенге', 'GBP': 'Британский фунт',
        'JPY': 'Японская иена', 'AUD': 'Австралийский доллар', 'CAD': 'Канадский доллар',
        'CHF': 'Швейцарский франк', 'NZD': 'Новозеландский доллар', 'BRL': 'Бразильский реал',
        'INR': 'Индийская рупия', 'MXN': 'Мексиканское песо', 'ZAR': 'Южноафриканский рэнд',
        'SGD': 'Сингапурский доллар', 'HKD': 'Гонконгский доллар', 'NOK': 'Норвежская крона',
        'SEK': 'Шведская крона'
    };
    return currencyNames[currency] || currency;
}

async function fetchCurrencies() {
    try {
        rates['RUB'] = 1;
        for (let currency of supportedCurrencies) {
            if (currency !== 'RUB') {
                const response = await fetch(`https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${currency}&to_symbol=RUB&apikey=${apiKey}`);
                const data = await response.json();
                if (data["Time Series FX (Daily)"]) {
                    const timeSeries = data["Time Series FX (Daily)"];
                    const latestDate = Object.keys(timeSeries)[0];
                    rates[currency] = parseFloat(timeSeries[latestDate]["4. close"]);
                    rateHistory[`${currency}/RUB`] = timeSeries;
                } else {
                    console.warn(`Данные для ${currency}/RUB недоступны`);
                }
            }
        }
        populateCurrencies();
        updateRateInfo();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить курсы валют. Проверьте лимит API.');
    }
}

function populateCurrencies() {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');

    supportedCurrencies.forEach(currency => {
        if (rates[currency] !== undefined) {
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
        }
    });

    fromCurrency.value = 'RUB';
    toCurrency.value = 'USD';
}

function updateRateInfo() {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;

    if (!rates[fromCurrency] || !rates[toCurrency]) {
        document.getElementById('currentRate').textContent = `Курс недоступен`;
        document.getElementById('rateChange').textContent = '';
        return;
    }

    let rate;
    if (fromCurrency === 'RUB') {
        rate = (1 / rates[toCurrency]).toFixed(4);
    } else if (toCurrency === 'RUB') {
        rate = rates[fromCurrency].toFixed(4);
    } else {
        rate = (rates[fromCurrency] / rates[toCurrency]).toFixed(4);
    }

    document.getElementById('currentRate').textContent = `1 ${fromCurrency} = ${rate} ${toCurrency}`;

    const rateChange = document.getElementById('rateChange');
    const pair = fromCurrency === 'RUB' ? `${toCurrency}/RUB` : `${fromCurrency}/RUB`;
    if (rateHistory[pair]) {
        const timeSeries = rateHistory[pair];
        const dates = Object.keys(timeSeries).sort();
        const latestRate = parseFloat(timeSeries[dates[0]]["4. close"]);
        const previousRate = parseFloat(timeSeries[dates[1]]["4. close"]);
        const change = latestRate - previousRate;
        const percentage = ((change / previousRate) * 100).toFixed(2);
        rateChange.textContent = `${change > 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(2)} (${percentage}%)`;
        rateChange.classList.remove('up', 'down');
        rateChange.classList.add(change >= 0 ? 'up' : 'down');
    } else {
        rateChange.textContent = 'Изменение недоступно';
    }
}

function swapCurrencies() {
    const fromCurrency = document.getElementById('fromCurrency');
    const toCurrency = document.getElementById('toCurrency');
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    updateRateInfo();
    if (document.getElementById('chartContainer').style.display === 'block') {
        updateChart(document.querySelector('.period-btn.active').getAttribute('onclick').match(/'([^']+)'/)[1]);
    }
}

function toggleChart() {
    const chartContainer = document.getElementById('chartContainer');
    const toggleBtn = document.querySelector('.toggle-chart-btn');
    if (chartContainer.style.display === 'none') {
        chartContainer.style.display = 'block';
        toggleBtn.textContent = 'Скрыть график';
        updateChart('month');
    } else {
        chartContainer.style.display = 'none';
        toggleBtn.textContent = 'Показать график';
        if (chart) chart.destroy();
    }
}

async function updateChart(period) {
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    let from = fromCurrency, to = toCurrency;
    let invert = false;

    if (fromCurrency === 'RUB') {
        from = toCurrency;
        to = fromCurrency;
        invert = true;
    } else if (toCurrency !== 'RUB') {
        from = fromCurrency;
        to = 'RUB';
    }

    const response = await fetch(`https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${from}&to_symbol=${to}&apikey=${apiKey}`);
    const data = await response.json();

    if (!data["Time Series FX (Daily)"]) {
        alert('Ошибка загрузки графика. Проверьте лимит запросов API.');
        return;
    }

    const timeSeries = data["Time Series FX (Daily)"];
    let labels = [], chartData = [];
    const entries = Object.entries(timeSeries);
    const limit = period === 'month' ? 30 : period === 'year' ? 365 : entries.length;

    for (let i = 0; i < Math.min(limit, entries.length); i++) {
        const [date, values] = entries[i];
        labels.push(date.slice(8, 10) + '.' + date.slice(5, 7));
        let rate = parseFloat(values["4. close"]);
        if (invert) {
            rate = 1 / rate;
        } else if (toCurrency !== 'RUB' && toCurrency !== to) {
            const rateToRUB = rates[toCurrency];
            rate = rate / rateToRUB;
        }
        chartData.push(rate);
    }
    labels.reverse();
    chartData.reverse();

    document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.period-btn[onclick="updateChart('${period}')"]`).classList.add('active');

    const ctx = document.getElementById('exchangeChart').getContext('2d');
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${fromCurrency}/${toCurrency}`,
                data: chartData,
                borderColor: '#ff4d4d',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                pointRadius: 3,
            }]
        },
        options: {
            scales: {
                x: { ticks: { color: document.body.classList.contains('light') ? '#000000' : '#ffffff', font: { size: 12 }, maxRotation: 45, minRotation: 45 }, grid: { display: false } },
                y: { ticks: { color: document.body.classList.contains('light') ? '#000000' : '#ffffff', font: { size: 12 } }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
            },
            plugins: { legend: { display: false } },
            maintainAspectRatio: false
        }
    });
}

function updateChartColors() {
    if (chart) {
        chart.options.scales.x.ticks.color = document.body.classList.contains('light') ? '#000000' : '#ffffff';
        chart.options.scales.y.ticks.color = document.body.classList.contains('light') ? '#000000' : '#ffffff';
        chart.options.scales.y.grid.color = document.body.classList.contains('light') ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
        chart.update();
    }
}

function convertCurrency() {
    const amount = parseFloat(document.getElementById('amount').value);
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;

    if (isNaN(amount) || amount <= 0) {
        alert('Пожалуйста, введите корректную сумму больше 0.');
        return;
    }

    if (!rates[fromCurrency] || !rates[toCurrency]) {
        alert('Курс для выбранной валютной пары недоступен.');
        return;
    }

    let rate;
    if (fromCurrency === 'RUB') {
        rate = 1 / rates[toCurrency];
    } else if (toCurrency === 'RUB') {
        rate = rates[fromCurrency];
    } else {
        rate = rates[fromCurrency] / rates[toCurrency];
    }

    const convertedAmount = amount * rate;
    const result = convertedAmount.toFixed(2);
    document.getElementById('result').textContent = `${amount} ${fromCurrency} = ${result} ${toCurrency}`;

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

document.getElementById('fromCurrency').addEventListener('change', () => {
    updateRateInfo();
    if (document.getElementById('chartContainer').style.display === 'block') {
        updateChart(document.querySelector('.period-btn.active').getAttribute('onclick').match(/'([^']+)'/)[1]);
    }
});

document.getElementById('toCurrency').addEventListener('change', () => {
    updateRateInfo();
    if (document.getElementById('chartContainer').style.display === 'block') {
        updateChart(document.querySelector('.period-btn.active').getAttribute('onclick').match(/'([^']+)'/)[1]);
    }
});

fetchCurrencies();