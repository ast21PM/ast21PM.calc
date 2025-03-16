// Получаем элементы
let display = document.getElementById('display');
let calculator = document.getElementById('calculator');
let themeToggle = document.getElementById('themeToggle');
let resizeHandle = document.getElementById('resizeHandle');
let inputValue = document.getElementById('inputValue');
let resultValue = document.getElementById('resultValue');
let fromBase = document.getElementById('fromBase');
let toBase = document.getElementById('toBase');

// Дефолтные размеры
const DEFAULT_WIDTH = 650;
const DEFAULT_HEIGHT = 550;

// Массив для истории
let history = [];

// Дебаунсинг для updateConversion
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function updateConversion() {
    let value = inputValue.value.trim();
    let from = parseInt(fromBase.value);
    let to = parseInt(toBase.value);

    if (value === '') {
        resultValue.value = '';
        return;
    }

    try {
        // Преобразуем в десятичную систему
        let decimal = parseInt(value, from);
        if (isNaN(decimal)) {
            resultValue.value = 'Ошибка';
            return;
        }

        // Проверка на корректность результата
        if (decimal < 0) {
            resultValue.value = 'Ошибка: отрицательные числа не поддерживаются';
            return;
        }

        // Преобразуем в целевую систему
        let result = decimal.toString(to).toUpperCase();
        resultValue.value = result;
        updateHistory(`${value} (base ${from})`, result);
    } catch (e) {
        resultValue.value = 'Ошибка';
        updateHistory(`${value} (base ${from})`, 'Ошибка');
    }
}

function clearDisplay() {
    inputValue.value = '';
    resultValue.value = '';
    display.value = '';
}

function updateHistory(expression, result) {
    const historyDiv = document.getElementById('history');
    history.push({ expr: expression, res: result });
    historyDiv.innerHTML = history.map(item => `<div><span class="expression">${item.expr}</span><span class="equals">=</span><span class="result">${item.res}</span></div>`).join('');
}

function toggleTheme() {
    let body = document.body;
    let calc = document.querySelector('.calculator');
    let displayInput = document.getElementById('display');
    let buttons = document.querySelectorAll('button');
    let navLinks = document.querySelectorAll('.nav-link');
    let inputs = document.querySelectorAll('input');
    let selects = document.querySelectorAll('select');

    body.classList.toggle('light');
    calc.classList.toggle('light');
    displayInput.classList.toggle('light');
    buttons.forEach(button => button.classList.toggle('light'));
    navLinks.forEach(link => link.classList.toggle('light'));
    inputs.forEach(input => input.classList.toggle('light'));
    selects.forEach(select => select.classList.toggle('light'));

    const isLightTheme = body.classList.contains('light');
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
}

window.onload = function() {
    calculator.style.width = `${DEFAULT_WIDTH}px`;
    calculator.style.height = `${DEFAULT_HEIGHT}px`;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        toggleTheme();
        document.querySelector('.switch input').checked = true;
    }

    // Применяем дебаунсинг к updateConversion
    const debouncedUpdateConversion = debounce(updateConversion, 500);
    inputValue.addEventListener('input', debouncedUpdateConversion);
    fromBase.addEventListener('change', updateConversion);
    toBase.addEventListener('change', updateConversion);
};

let isDragging = false;
let currentX;
let currentY;
let xOffset = 0;
let yOffset = 0;

calculator.querySelector('.calculator-header').addEventListener('mousedown', startDragging);
calculator.querySelector('.calculator-header').addEventListener('dblclick', resetSize);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', stopDragging);

function startDragging(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        setTranslate(currentX, currentY, calculator);
    }
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
}

function stopDragging() {
    if (isDragging) {
        isDragging = false;
    }
}

let isResizing = false;
let initialXResize;
let initialYResize;
let initialWidth = DEFAULT_WIDTH;
let initialHeight = DEFAULT_HEIGHT;

resizeHandle.addEventListener('mousedown', startResizing);
resizeHandle.addEventListener('dblclick', resetSize);
document.addEventListener('mousemove', resize);
document.addEventListener('mouseup', stopResizing);

function startResizing(e) {
    initialXResize = e.clientX;
    initialYResize = e.clientY;
    isResizing = true;
}

function resize(e) {
    if (isResizing) {
        let dx = e.clientX - initialXResize;
        let dy = e.clientY - initialYResize;
        let newWidth = Math.max(initialWidth + dx, 300);
        let newHeight = Math.max(initialHeight + dy, 200);
        calculator.style.width = `${newWidth}px`;
        calculator.style.height = `${newHeight}px`;
    }
}

function stopResizing() {
    if (isResizing) {
        isResizing = false;
        initialWidth = parseInt(calculator.style.width, 10);
        initialHeight = parseInt(calculator.style.height, 10);
    }
}

function resetSize() {
    calculator.style.width = `${DEFAULT_WIDTH}px`;
    calculator.style.height = `${DEFAULT_HEIGHT}px`;
    initialWidth = DEFAULT_WIDTH;
    initialHeight = DEFAULT_HEIGHT;
    xOffset = 0;
    yOffset = 0;
    setTranslate(0, 0, calculator);
}