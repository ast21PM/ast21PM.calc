// Функции для прелоадера
const loadingTexts = [
    'Загрузка курсов валют...',
    'Получение актуальных данных...',
    'Инициализация конвертера...',
    'Почти готово...'
];

function updateLoadingText(index) {
    if (index >= loadingTexts.length) return;
    
    const detail = document.querySelector('.loading-details .detail');
    detail.style.opacity = '0';
    
    setTimeout(() => {
        detail.textContent = loadingTexts[index];
        detail.style.opacity = '1';
        
        setTimeout(() => {
            updateLoadingText(index + 1);
        }, 500);
    }, 500);
}

function hidePreloader() {
    const preloader = document.querySelector('.preloader');
    preloader.classList.add('fade-out');
    setTimeout(() => {
        preloader.style.display = 'none';
    }, 500);
}

const themeSwitch = document.getElementById('themeSwitch');

function applyTheme(isLight) {
    const elementsToToggle = [
        document.body,
        document.querySelector('.converter'),
        document.querySelector('#amount'),
        document.querySelector('.convert-btn'),
        document.querySelector('.result'),
        document.querySelector('.history'),
        document.querySelector('.converter-header'),
        document.querySelector('.resize-handle'),
        ...document.querySelectorAll('.custom-select'),
        ...document.querySelectorAll('.nav-link'),
        document.querySelector('.swap-btn'),
        document.querySelector('.history-header'),
        document.querySelector('#currentRate'),
        ...document.querySelectorAll('.period-btn'),
        ...document.querySelectorAll('.amount-btn'),
        document.querySelector('.toggle-chart-btn'),
        ...document.querySelectorAll('.widget'),
        document.querySelector('.currency-widgets')
    ];

    elementsToToggle.forEach(element => {
        if (isLight) {
            element.classList.add('light');
        } else {
            element.classList.remove('light');
        }
    });

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
    const fromCurrency = document.getElementById('fromCurrency').dataset.value;
    const toCurrency = document.getElementById('toCurrency').dataset.value;
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
    'USD': 78.5067,
    'EUR': 90.9438,
    'RUB': 1,
    'CNY': 10.8979,
    'TRY': 1.9981,
    'KZT': 0.153357,
    'GBP': 106.5807,
    'JPY': 0.544429,
    'AUD': 51.0215,
    'CAD': 57.7340,
    'CHF': 96.6950,
    'NZD': 47.2375,
    'BRL': 14.1075,
    'INR': 0.912612,
    'MXN': 4.45,
    'ZAR': 4.37483,
    'SGD': 61.1756,
    'HKD': 10.0187,
    'NOK': 7.89766,
    'SEK': 8.24344,
    'AED': 21.3769
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

// Функция для получения пути к флагу валюты
function getFlagPath(currencyCode) {
    const flagMap = {
        'RUB': 'ru', 'USD': 'us', 'EUR': 'eu', 'CNY': 'cn', 'TRY': 'tr', 'KZT': 'kz',
        'GBP': 'gb', 'JPY': 'jp', 'AUD': 'au', 'CAD': 'ca', 'CHF': 'ch', 'NZD': 'nz',
        'BRL': 'br', 'INR': 'in', 'MXN': 'mx', 'ZAR': 'za', 'SGD': 'sg', 'HKD': 'hk',
        'NOK': 'no', 'SEK': 'se', 'AED': 'ae'
    };
    const file = flagMap[currencyCode];
    if (!file) return null;
    return `../../image/${file}.png`;
}

function getCurrencyName(currency) {
    const currencyNames = {
        'USD': 'Доллар США',
        'EUR': 'Евро',
        'RUB': 'Российский рубль',
        'CNY': 'Китайский юань',
        'TRY': 'Турецкая лира',
        'KZT': 'Казахстанский тенге',
        'GBP': 'Британский фунт',
        'JPY': 'Японская йена',
        'AUD': 'Австралийский доллар',
        'CAD': 'Канадский доллар',
        'CHF': 'Швейцарский франк',
        'NZD': 'Новозеландский доллар',
        'BRL': 'Бразильский реал',
        'INR': 'Индийская рупия',
        'MXN': 'Мексиканское песо',
        'ZAR': 'Южноафриканский рэнд',
        'SGD': 'Сингапурский доллар',
        'HKD': 'Гонконгский доллар',
        'NOK': 'Норвежская крона',
        'SEK': 'Шведская крона',
        'AED': 'Дирхам ОАЭ'
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
    const fromDropdown = document.getElementById('fromCurrencyDropdown');
    const toDropdown = document.getElementById('toCurrencyDropdown');

    function setupSelect(trigger, dropdown, defaultCurrency) {
        // Устанавливаем начальное значение
        trigger.dataset.value = defaultCurrency;
        trigger.querySelector('.flag').src = getFlagPath(defaultCurrency);
        trigger.querySelector('.flag').alt = `Флаг ${defaultCurrency}`;
        trigger.querySelector('.currency-text').textContent = `${defaultCurrency} - ${getCurrencyName(defaultCurrency)}`;

        // Очищаем выпадающий список
        dropdown.innerHTML = '';

        // Добавляем опции
        supportedCurrencies.forEach(currency => {
            if (rates[currency] !== undefined) {
                const option = document.createElement('div');
                option.classList.add('select-option');
                option.innerHTML = `
                    <img src="${getFlagPath(currency)}" alt="Флаг ${currency}" class="flag">
                    <span class="currency-text">${currency} - ${getCurrencyName(currency)}</span>
                `;
                option.dataset.value = currency;
                dropdown.appendChild(option);
            }
        });

        // Обработчик клика по триггеру
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const wrapper = trigger.parentElement;
            const isActive = wrapper.classList.contains('active');
            
            // Закрываем все другие выпадающие списки
            document.querySelectorAll('.select-wrapper').forEach(w => {
                if (w !== wrapper) {
                    w.classList.remove('active');
                }
            });
            
            // Переключаем текущий список
            wrapper.classList.toggle('active', !isActive);
        });

        // Добавляем обработчик для опций
        dropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.select-option');
            if (option) {
                const currency = option.dataset.value;
                trigger.dataset.value = currency;
                trigger.querySelector('.flag').src = getFlagPath(currency);
                trigger.querySelector('.flag').alt = `Флаг ${currency}`;
                trigger.querySelector('.currency-text').textContent = `${currency} - ${getCurrencyName(currency)}`;
                trigger.parentElement.classList.remove('active');
                updateRateInfo();
                if (document.getElementById('chartContainer').classList.contains('visible')) {
                    updateChart(document.querySelector('.period-btn.active').getAttribute('onclick').match(/'([^']+)'/)[1]);
                }
            }
        });
    }

    // Закрываем выпадающие списки при клике вне них
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.select-wrapper')) {
            document.querySelectorAll('.select-wrapper').forEach(wrapper => {
                wrapper.classList.remove('active');
            });
        }
    });

    setupSelect(fromCurrency, fromDropdown, 'EUR');
    setupSelect(toCurrency, toDropdown, 'RUB');
}

function updateRateInfo() {
    const fromCurrency = document.getElementById('fromCurrency').dataset.value;
    const toCurrency = document.getElementById('toCurrency').dataset.value;

    if (!rates[fromCurrency] || !rates[toCurrency]) {
        document.getElementById('currentRate').textContent = `Курс недоступен`;
        document.getElementById('rateChange').textContent = '';
        return;
    }

    let rate;
    if (fromCurrency === 'RUB') {
        rate = (1 / rates[toCurrency]).toFixed(2); // Округление до 2 знаков
    } else if (toCurrency === 'RUB') {
        rate = rates[fromCurrency].toFixed(2); // Округление до 2 знаков
    } else {
        rate = (rates[fromCurrency] / rates[toCurrency]).toFixed(2); // Округление до 2 знаков
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
    
    const tempValue = fromCurrency.dataset.value;
    const tempFlagSrc = fromCurrency.querySelector('.flag').src;
    const tempFlagAlt = fromCurrency.querySelector('.flag').alt;
    const tempText = fromCurrency.querySelector('.currency-text').textContent;

    fromCurrency.dataset.value = toCurrency.dataset.value;
    fromCurrency.querySelector('.flag').src = toCurrency.querySelector('.flag').src;
    fromCurrency.querySelector('.flag').alt = toCurrency.querySelector('.flag').alt;
    fromCurrency.querySelector('.currency-text').textContent = toCurrency.querySelector('.currency-text').textContent;

    toCurrency.dataset.value = tempValue;
    toCurrency.querySelector('.flag').src = tempFlagSrc;
    toCurrency.querySelector('.flag').alt = tempFlagAlt;
    toCurrency.querySelector('.currency-text').textContent = tempText;

    // Закрываем выпадающие списки
    document.querySelectorAll('.select-wrapper').forEach(wrapper => {
        wrapper.classList.remove('active');
    });

    updateRateInfo();
    const amount = parseFloat(document.getElementById('amount').value);
    if (!isNaN(amount) && amount > 0) {
        convertCurrency();
    }
    if (document.getElementById('chartContainer').classList.contains('visible')) {
        updateChart(document.querySelector('.period-btn.active').getAttribute('onclick').match(/'([^']+)'/)[1]);
    }
}

function toggleChart() {
    const chartContainer = document.getElementById('chartContainer');
    const toggleBtn = document.querySelector('.toggle-chart-btn');
    if (!chartContainer.classList.contains('visible')) {
        chartContainer.classList.add('visible');
        toggleBtn.textContent = 'Скрыть график';
        updateChart('month');
    } else {
        chartContainer.classList.remove('visible');
        toggleBtn.textContent = 'Показать график';
        if (chart) chart.destroy();
    }
}

async function updateChart(period) {
    const fromCurrency = document.getElementById('fromCurrency').dataset.value;
    const toCurrency = document.getElementById('toCurrency').dataset.value;
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

    // Добавляем пояснение о расчётах через RUB
    const chartContainer = document.getElementById('chartContainer');
    let note = chartContainer.querySelector('.chart-note');
    if (!note) {
        note = document.createElement('p');
        note.classList.add('chart-note');
        note.style.fontSize = '12px';
        note.style.color = document.body.classList.contains('light') ? '#666666' : '#aaaaaa';
        note.style.marginTop = '10px';
        note.style.textAlign = 'center';
        chartContainer.appendChild(note);
    }
    note.textContent = 'Примечание: Курсы для пар, не включающих RUB, рассчитываются через RUB.';
}

function updateChartColors() {
    if (chart) {
        chart.options.scales.x.ticks.color = document.body.classList.contains('light') ? '#333333' : '#ffffff';
        chart.options.scales.y.ticks.color = document.body.classList.contains('light') ? '#333333' : '#ffffff';
        chart.options.scales.y.grid.color = document.body.classList.contains('light') ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
        chart.update();

        // Обновляем цвет пояснения
        const note = document.querySelector('.chart-note');
        if (note) {
            note.style.color = document.body.classList.contains('light') ? '#666666' : '#aaaaaa';
        }
    }
}

function convertCurrency() {
    const amount = parseFloat(document.getElementById('amount').value);
    const fromCurrency = document.getElementById('fromCurrency').dataset.value;
    const toCurrency = document.getElementById('toCurrency').dataset.value;

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
    const result = convertedAmount.toFixed(2); // Округление до 2 знаков
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

// Инициализируем конвертер при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    try {
        fetchCurrencies();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Модифицируем window.onload
window.onload = function() {
    // Запускаем анимацию загрузки
    updateLoadingText(0);
    
    // Имитируем загрузку
    setTimeout(() => {
        try {
            // Проверяем сохраненную тему
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                toggleTheme();
                document.querySelector('.switch input').checked = true;
            }
        } catch (error) {
            console.error('Error during initialization:', error);
        } finally {
            // Скрываем прелоадер в любом случае
            hidePreloader();
        }
    }, 2000);
};