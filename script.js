let display = document.getElementById('display');
let calculator = document.getElementById('calculator');
let themeToggle = document.getElementById('themeToggle');
let resizeHandle = document.getElementById('resizeHandle');

const DEFAULT_WIDTH = 650;
const DEFAULT_HEIGHT = 550;

let history = [];

// Добавление символов в поле ввода
function append(value) {
    display.value += value;
}

// Очистка поля ввода
function clearDisplay() {
    display.value = '';
}

// Удаление последнего символа
function backspace() {
    display.value = display.value.slice(0, -1);
}

// Форматирование числа
function formatNumber(number) {
    if (typeof number === 'number') {
        return math.format(number, { precision: 14 });
    }
    return number.toString();
}

// Вычисление выражения
function calculate(operation) {
    let expression = display.value.trim();
    
    try {
        if (operation === '=') {
            // Заменяем специальные символы на их эквиваленты в Math.js
            expression = expression
                .replace(/π/g, 'pi')
                .replace(/\^2/g, '^2')
                .replace(/%/g, '/100');

            // Вычисляем выражение
            const result = math.evaluate(expression);
            display.value = formatNumber(result);
            updateHistory(expression, display.value);
        }
    } catch (error) {
        updateHistory(expression, 'Ошибка: ' + error.message);
    }
}

// Обновление истории
function updateHistory(expression, result) {
    const historyDiv = document.getElementById('history');
    history.push({ expr: expression, res: result });
    historyDiv.innerHTML = history.map(item => 
        `<div><span class="expression">${item.expr}</span><span class="equals">=</span><span class="result">${item.res}</span></div>`
    ).join('');
}

// Переключение темы
function toggleTheme() {
    let body = document.body;
    let calc = document.querySelector('.calculator');
    let displayInput = document.getElementById('display');
    let buttons = document.querySelectorAll('button');
    let navLinks = document.querySelectorAll('.nav-link');

    body.classList.toggle('light');
    calc.classList.toggle('light');
    displayInput.classList.toggle('light');
    buttons.forEach(button => button.classList.toggle('light'));
    navLinks.forEach(link => link.classList.toggle('light'));

    const isLightTheme = body.classList.contains('light');
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
}

// Показ панели
function showPanel(panel) {
    let panels = document.querySelectorAll('.panel');
    let tabButtons = document.querySelectorAll('.tab-button');

    panels.forEach(p => p.style.display = 'none');
    tabButtons.forEach(tb => tb.classList.remove('active'));

    if (panel === 'basic') {
        document.querySelector('.basic-panel').style.display = 'grid';
        document.querySelector('.tab-button[onclick*="basic"]').classList.add('active');
    } else if (panel === 'functions') {
        document.querySelector('.functions-panel').style.display = 'grid';
        document.querySelector('.tab-button[onclick*="functions"]').classList.add('active');
    }
}

// Инициализация при загрузке
window.onload = function() {
    showPanel('basic');
    calculator.style.width = `${DEFAULT_WIDTH}px`;
    calculator.style.height = `${DEFAULT_HEIGHT}px`;

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        toggleTheme();
        document.querySelector('.switch input').checked = true;
    }
};

// Перемещение курсора
function moveCursor(direction) {
    const input = display;
    const cursorPos = input.selectionStart || 0;

    if (direction === 'left' && cursorPos > 0) {
        input.setSelectionRange(cursorPos - 1, cursorPos - 1);
    } else if (direction === 'right' && cursorPos < input.value.length) {
        input.setSelectionRange(cursorPos + 1, cursorPos + 1);
    }
    input.focus();
}

// Перетаскивание калькулятора
let isDragging = false;
let currentX;
let currentY;
let xOffset = 0;
let yOffset = 0;
let initialX;
let initialY;

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

// Изменение размера калькулятора
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

// Сброс размера
function resetSize() {
    calculator.style.width = `${DEFAULT_WIDTH}px`;
    calculator.style.height = `${DEFAULT_HEIGHT}px`;
    initialWidth = DEFAULT_WIDTH;
    initialHeight = DEFAULT_HEIGHT;
    xOffset = 0;
    yOffset = 0;
    setTranslate(0, 0, calculator);
}

// Обработка клавиш
display.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        calculate('=');
    } else if (event.key === 'Backspace') {
        display.value = display.value.slice(0, -1);
        event.preventDefault();
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        return;
    } else if (!/[0-9+\-*/.()πie%!]/.test(event.key)) {
        event.preventDefault();
    }
});