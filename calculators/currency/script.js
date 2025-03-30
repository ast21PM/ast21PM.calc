// Переключение темы
const themeSwitch = document.getElementById('themeSwitch');

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
        document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.add('light'));
        document.querySelector('.toggle-chart-btn').classList.add('light');
        document.querySelectorAll('.widget').forEach(widget => widget.classList.add('light'));
        document.querySelector('.currency-widgets').classList.add('light');
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
        document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('light'));
        document.querySelector('.toggle-chart-btn').classList.remove('light');
        document.querySelectorAll('.widget').forEach(widget => widget.classList.remove('light'));
        document.querySelector('.currency-widgets').classList.remove('light');
    }
    updateChartColors();
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    const isLight = savedTheme === 'light';
    themeSwitch.checked = isLight;
    applyTheme(isLight);
});

themeSwitch.addEventListener('change', () => {
    const isLight = themeSwitch.checked;
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    applyTheme(isLight);
});

const converter = document.getElementById('converter');
const header = document.querySelector('.converter-header');
let isDragging = false;
let startX, startY;

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

document.getElementById('amount').addEventListener('input', (e) => {
    const value = e.target.value;
    if (!/^\d*\.?\d*$/.test(value)) {
        e.target.value = value.slice(0, -1);
    }
    if (value.startsWith('-')) {
        e.target.value = value.replace('-', '');
    }
});

function setAmount(value) {
    const amountInput = document.getElementById('amount');
    amountInput.value = value;
    const fromCurrency = document.getElementById('fromCurrency').value;
    const toCurrency = document.getElementById('toCurrency').value;
    if (fromCurrency && toCurrency && value > 0) {
        convertCurrency();
    }
}

let rates = {};
let chart;
let rateHistory = {};
const supportedCurrencies = [
    'USD', 'EUR', 'RUB', 'CNY', 'TRY', 'KZT', 'GBP', 'JPY', 'AUD', 'CAD',
    'CHF', 'NZD', 'BRL', 'INR', 'MXN', 'ZAR', 'SGD', 'HKD', 'NOK', 'SEK', 'AED'
];

const staticRates = {
    'USD': 84.64,
    'EUR': 91.43,
    'RUB': 1,
    'CNY': 11.58,
    'TRY': 2.23,
    'KZT': 0.17,
    'GBP': 110.00,
    'JPY': 0.56,
    'AUD': 56.00,
    'CAD': 62.00,
    'CHF': 98.00,
    'NZD': 51.00,
    'BRL': 15.00,
    'INR': 1.01,
    'MXN': 4.20,
    'ZAR': 4.50,
    'SGD': 63.00,
    'HKD': 10.90,
    'NOK': 7.80,
    'SEK': 8.00,
    'AED': 23.05
};

function generateFakeHistoricalData(baseRate, days) {
    const data = {};
    const endDate = new Date();
    for (let i = 0; i < days; i++) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const fluctuation = (Math.random() - 0.5) * 0.5;
        const rate = (baseRate + fluctuation).toFixed(6);
        data[dateStr] = {
            "1. open": rate,
            "2. high": (parseFloat(rate) + 0.1).toFixed(6),
            "3. low": (parseFloat(rate) - 0.1).toFixed(6),
            "4. close": rate
        };
    }
    return data;
}

function getFlagUrl(currency) {
    const countryCodes = {
        'USD': 'us', 'EUR': 'eu', 'RUB': 'ru', 'CNY': 'cn', 'TRY': 'tr', 'KZT': 'kz',
        'GBP': 'gb', 'JPY': 'jp', 'AUD': 'au', 'CAD': 'ca', 'CHF': 'ch', 'NZD': 'nz',
        'BRL': 'br', 'INR': 'in', 'MXN': 'mx', 'ZAR': 'za', 'SGD': 'sg', 'HKD': 'hk',
        'NOK': 'no', 'SEK': 'se', 'AED': 'ae'
    };
    return `../../image/${countryCodes[currency] || 'un'}.png`;
}

function getCurrencyName(currency) {
    const currencyNames = {
        'USD': 'Доллар США', 'EUR': 'Евро', 'RUB': 'Российский рубль', 'CNY': 'Китайский юань',
        'TRY': 'Турецкая лира', 'KZT': 'Казахстанский тенге', 'GBP': 'Британский фунт',
        'JPY': 'Японская иена', 'AUD': 'Австралийский доллар', 'CAD': 'Канадский доллар',
        'CHF': 'Швейцарский франк', 'NZD': 'Новозеландский доллар', 'BRL': 'Бразильский реал',
        'INR': 'Индийская рупия', 'MXN': 'Мексиканское песо', 'ZAR': 'Южноафриканский рэнд',
        'SGD': 'Сингапурский доллар', 'HKD': 'Гонконгский доллар', 'NOK': 'Норвежская крона',
        'SEK': 'Шведская крона', 'AED': 'Дирхам ОАЭ'
    };
    return currencyNames[currency] || currency;
}

function updateCurrencyWidgets() {
    const widgetCurrencies = ['USD', 'EUR', 'CNY', 'KZT', 'TRY', 'AED'];
    widgetCurrencies.forEach(currency => {
        const rateElement = document.getElementById(`rate-${currency}`);
        if (rates[currency]) {
            rateElement.textContent = rates[currency].toFixed(2);
        } else {
            rateElement.textContent = 'Н/Д';
        }
    });
}

async function fetchCurrencies() {
    try {
        rates = { ...staticRates };

        for (let currency of supportedCurrencies) {
            if (currency !== 'RUB') {
                const baseRate = staticRates[currency];
                rateHistory[`${currency}/RUB`] = generateFakeHistoricalData(baseRate, 365 * 25);
            }
        }

        populateCurrencies();
        updateRateInfo();
        updateCurrencyWidgets();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Произошла ошибка при загрузке данных.');
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

    fromCurrency.value = 'EUR';
    toCurrency.value = 'RUB';
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
        rate = (1 / rates[toCurrency]).toFixed(6);
    } else if (toCurrency === 'RUB') {
        rate = rates[fromCurrency].toFixed(6);
    } else {
        rate = (rates[fromCurrency] / rates[toCurrency]).toFixed(6);
    }

    document.getElementById('currentRate').textContent = `1 ${fromCurrency} = ${rate} ${toCurrency}`;

    const rateChange = document.getElementById('rateChange');
    const pair = `${fromCurrency}/${toCurrency}`;
    if (rateHistory[pair]) {
        const timeSeries = rateHistory[pair];
        const dates = Object.keys(timeSeries).sort();
        const latestRate = parseFloat(timeSeries[dates[0]]["4. close"]);
        const previousRate = parseFloat(timeSeries[dates[1]]["4. close"]);
        const change = latestRate - previousRate;
        const percentage = ((change / previousRate) * 100).toFixed(2);
        rateChange.textContent = `${change > 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(6)} (${percentage}%)`;
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
    const amount = parseFloat(document.getElementById('amount').value);
    if (!isNaN(amount) && amount > 0) {
        convertCurrency();
    }
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

    if (toCurrency !== 'RUB') {
        from = fromCurrency;
        to = 'RUB';
        invert = fromCurrency === 'RUB';
    } else {
        from = fromCurrency;
        to = toCurrency;
        invert = fromCurrency === 'RUB';
    }

    const timeSeries = rateHistory[`${from === 'RUB' ? to : from}/RUB`];
    if (!timeSeries) {
        alert('Данные для графика недоступны.');
        return;
    }

    let labels = [], chartData = [], pointRadii = [], fullDates = [];
    const entries = Object.entries(timeSeries);
    const limit = period === 'month' ? 30 : period === 'year' ? 365 : entries.length;

    const monthNames = ['янв.', 'февр.', 'мар.', 'апр.', 'мая', 'июня', 'июля', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'];
    const fullMonthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

    if (period === 'year') {
        let lastMonth = -1;
        let lastYear = -1;

        for (let i = 0; i < Math.min(limit, entries.length); i++) {
            const [date, values] = entries[i];
            const dateObj = new Date(date);
            const month = dateObj.getMonth();
            const year = dateObj.getFullYear();
            const day = dateObj.getDate();

            if (dateObj.getDate() === 1 || i === 0) {
                if (i === 0 || month !== lastMonth) {
                    labels.push(`${monthNames[month]} ${year}`);
                } else {
                    labels.push('');
                }
            } else {
                labels.push('');
            }

            fullDates.push(`${day} ${fullMonthNames[month]} ${year} г.`);

            lastMonth = month;
            lastYear = year;

            let rate = parseFloat(values["4. close"]);
            if (invert) {
                rate = 1 / rate;
            } else if (toCurrency !== 'RUB' && toCurrency !== to) {
                const rateToRUB = rates[toCurrency];
                rate = rate / rateToRUB;
            }
            chartData.push(rate);

            let isTurningPoint = false;
            if (i > 0 && i < chartData.length - 1) {
                const prevRate = chartData[i - 1];
                const nextRate = parseFloat(entries[i + 1][1]["4. close"]);
                if (invert) nextRate = 1 / nextRate;
                const changePrev = Math.abs(rate - prevRate) / prevRate;
                const changeNext = Math.abs(nextRate - rate) / rate;
                if (changePrev > 0.005 || changeNext > 0.005) {
                    isTurningPoint = true;
                }
            }
            pointRadii.push(isTurningPoint ? 3 : 0);
        }
    } else if (period === 'month') {
        let lastMonth = -1;

        for (let i = 0; i < Math.min(limit, entries.length); i++) {
            const [date, values] = entries[i];
            const dateObj = new Date(date);
            const month = dateObj.getMonth();
            const year = dateObj.getFullYear();
            const day = dateObj.getDate();

            if (month !== lastMonth) {
                labels.push(`${monthNames[month]} ${year}`);
                lastMonth = month;
            } else {
                labels.push('');
            }

            fullDates.push(`${day} ${fullMonthNames[month]} ${year} г.`);

            let rate = parseFloat(values["4. close"]);
            if (invert) {
                rate = 1 / rate;
            } else if (toCurrency !== 'RUB' && toCurrency !== to) {
                const rateToRUB = rates[toCurrency];
                rate = rate / rateToRUB;
            }
            chartData.push(rate);

            let isTurningPoint = false;
            if (i > 0 && i < chartData.length - 1) {
                const prevRate = chartData[i - 1];
                const nextRate = parseFloat(entries[i + 1][1]["4. close"]);
                if (invert) nextRate = 1 / nextRate;
                const changePrev = Math.abs(rate - prevRate) / prevRate;
                const changeNext = Math.abs(nextRate - rate) / rate;
                if (changePrev > 0.005 || changeNext > 0.005) {
                    isTurningPoint = true;
                }
            }
            pointRadii.push(isTurningPoint ? 3 : 0);
        }
    } else {
        const startYear = 2000;
        const endYear = 2025;
        const interval = 5;
        const yearData = {};

        entries.forEach(([date, values]) => {
            const year = new Date(date).getFullYear();
            if (!yearData[year]) {
                yearData[year] = { sum: 0, count: 0 };
            }
            let rate = parseFloat(values["4. close"]);
            if (invert) rate = 1 / rate;
            yearData[year].sum += rate;
            yearData[year].count += 1;
        });

        for (let year = startYear; year <= endYear; year += interval) {
            if (yearData[year]) {
                const avgRate = yearData[year].sum / yearData[year].count;
                labels.push(year.toString());
                chartData.push(avgRate);
                pointRadii.push(3);
                fullDates.push(`${year}`);
            } else {
                labels.push(year.toString());
                chartData.push(null);
                pointRadii.push(0);
                fullDates.push(`${year}`);
            }
        }
    }

    labels.reverse();
    chartData.reverse();
    pointRadii.reverse();
    fullDates.reverse();

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
                borderColor: '#00ff00',
                backgroundColor: 'rgba(0, 255, 0, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointRadius: pointRadii,
                pointHoverRadius: 5,
                pointBackgroundColor: '#00ff00',
            }]
        },
        options: {
            scales: {
                x: {
                    ticks: {
                        color: document.body.classList.contains('light') ? '#333333' : '#ffffff',
                        font: { size: 12 },
                        maxRotation: 0,
                        minRotation: 0
                    },
                    grid: { display: false }
                },
                y: {
                    ticks: {
                        color: document.body.classList.contains('light') ? '#333333' : '#ffffff',
                        font: { size: 12 },
                        callback: function(value) {
                            return value.toFixed(2);
                        }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    mode: 'nearest',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            return fullDates[context[0].dataIndex];
                        },
                        label: function(context) {
                            const rate = context.parsed.y.toFixed(2);
                            return `1 ${fromCurrency} = ${rate} ${toCurrency}`;
                        }
                    }
                }
            },
            maintainAspectRatio: false,
            interaction: {
                mode: 'nearest',
                intersect: false
            }
        }
    });
}

function updateChartColors() {
    if (chart) {
        chart.options.scales.x.ticks.color = document.body.classList.contains('light') ? '#333333' : '#ffffff';
        chart.options.scales.y.ticks.color = document.body.classList.contains('light') ? '#333333' : '#ffffff';
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
    const result = convertedAmount.toFixed(6);
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