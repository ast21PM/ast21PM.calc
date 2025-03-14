// Получаем элемент поля ввода
let display = document.getElementById('display');
// Получаем элемент калькулятора
let calculator = document.getElementById('calculator');
// Получаем кнопку переключения темы
let themeToggle = document.getElementById('themeToggle');
// Получаем ручку для изменения размера
let resizeHandle = document.getElementById('resizeHandle');

// Дефолтные размеры калькулятора (увеличиваем до 650px × 550px)
const DEFAULT_WIDTH = 650;
const DEFAULT_HEIGHT = 550;

// Массив для хранения истории вычислений
let history = [];

function append(value) {
    // Разрешаем ввод функций, чисел, операций, букв и специальных символов
    if (/[\d+\-*/.()πi]/.test(value) || ['sin', 'cos', 'tan', 'cot', 'sqrt', 'arcsin', 'arccos', 'arctan', 'ln', 'log', 'abs', 'e', 'e^x', 'a^n', 'factorial', 'square'].includes(value) || /^[a-z]$/i.test(value)) {
        if (['sin', 'cos', 'tan', 'cot', 'sqrt', 'arcsin', 'arccos', 'arctan', 'ln', 'log', 'abs', 'factorial'].includes(value)) {
            display.value += value + '('; // Добавляем функцию с открывающей скобкой
        } else if (value === 'square') {
            // Убираем условие, чтобы ^2 добавлялся всегда
            let lastChar = display.value.slice(-1);
            if (display.value === '' || !/[\d)]/.test(lastChar)) {
                display.value += '2^2'; // Если поле пустое или последний символ не число/скобка, добавляем 2^2
            } else {
                display.value += '^2'; // Иначе добавляем ^2 к текущему числу
            }
        } else if (value === 'e^x') {
            display.value += 'Math.exp('; // Добавляем экспоненту e^x
        } else if (value === 'a^n') {
            display.value += '^'; // Добавляем степень a^n
        } else {
            display.value += value;
        }
    }
}

// Очищаем поле ввода
function clearDisplay() {
    display.value = '';
}

// Форматирование числа: обрезаем до 5 знаков после запятой и убираем лишние нули
function formatNumber(number) {
    // Обрезаем до 5 знаков после запятой
    let fixed = number.toFixed(5);
    // Преобразуем в число и убираем лишние нули
    let parsed = parseFloat(fixed);
    // Если число целое, возвращаем его без десятичной части
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(5);
}

// Выполняем вычисление
function calculate(operation) {
    let expression = display.value.trim();
    let result;

    try {
        if (operation === '=') {
            // Обрабатываем выражение, заменяя π, i, e на значения
            let evalExpression = expression
                .replace(/π/g, Math.PI)
                .replace(/e/g, 'Math.E')
                .replace(/i/g, 'i')
                .replace(/\^2/g, '**2') // Поддержка возведения в квадрат
                .replace(/\^/g, '**');  // Поддержка произвольных степеней

            // Заменяем наши функции на их значения
            while (evalExpression.match(/([a-z]+)\(([^()]+)\)/i)) {
                evalExpression = evalExpression.replace(/([a-z]+)\(([^()]+)\)/gi, (match, func, arg) => {
                    let number = parseFloat(arg) || 0;
                    func = func.toLowerCase();
                    switch (func) {
                        case 'sin': return Math.sin(toRadians(number));
                        case 'cos': return Math.cos(toRadians(number));
                        case 'tan': return Math.tan(toRadians(number));
                        case 'cot': {
                            let tanValue = Math.tan(toRadians(number));
                            return tanValue === 0 ? 'Infinity' : 1 / tanValue;
                        }
                        case 'sqrt': return Math.sqrt(number);
                        case 'arcsin': return toDegrees(Math.asin(number));
                        case 'arccos': return toDegrees(Math.acos(number));
                        case 'arctan': return toDegrees(Math.atan(number));
                        case 'ln': return Math.log(number);
                        case 'log': return Math.log10(number);
                        case 'abs': return Math.abs(number);
                        case 'factorial': return factorial(number);
                        default: return match; // Если функция неизвестна, оставляем как есть
                    }
                });
            }

            // Обрабатываем Math.exp отдельно
            if (evalExpression.includes('Math.exp(')) {
                let expMatch = evalExpression.match(/Math\.exp\(([\d+\-*.]+)\)/);
                if (expMatch) {
                    evalExpression = evalExpression.replace(/Math\.exp\(([\d+\-*.]+)\)/, Math.exp(parseFloat(expMatch[1]) || 0));
                }
            }

            // Вычисляем итоговое выражение
            result = eval(evalExpression);
            display.value = isNaN(result) || !isFinite(result) ? 'Ошибка' : formatNumber(result);
            updateHistory(expression, display.value); // Передаем исходное выражение и результат
        }
    } catch (error) {
        display.value = 'Ошибка';
        updateHistory(expression, 'Ошибка'); // Передаем исходное выражение и ошибку
    }
}

// Обновляем историю вычислений
function updateHistory(expression, result) {
    const historyDiv = document.getElementById('history');
    // Сохраняем исходное выражение без замены символов (π, e и т.д.)
    const originalExpression = expression; // Уже получили исходное выражение из display.value.trim()
    history.push({ expr: originalExpression, res: result });
    historyDiv.innerHTML = history.map(item => `<div><span class="expression">${item.expr}</span><span class="equals">=</span><span class="result">${item.res}</span></div>`).join('');
}

// Функция переключения темы
function toggleTheme() {
    // Получаем тело документа
    let body = document.body;
    // Получаем калькулятор
    let calc = document.querySelector('.calculator');
    // Получаем поле ввода
    let displayInput = document.getElementById('display');
    // Получаем все кнопки
    let buttons = document.querySelectorAll('button');
    // Получаем навигационные ссылки
    let navLinks = document.querySelectorAll('.nav-link');

    // Переключаем классы для смены темы
    body.classList.toggle('light');
    calc.classList.toggle('light');
    displayInput.classList.toggle('light');
    buttons.forEach(button => button.classList.toggle('light'));
    navLinks.forEach(link => link.classList.toggle('light'));

    // Сохраняем текущую тему в localStorage
    const isLightTheme = body.classList.contains('light');
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
}

// Функция переключения панелей
function showPanel(panel) {
    // Получаем все панели
    let panels = document.querySelectorAll('.panel');
    // Получаем все кнопки вкладок
    let tabButtons = document.querySelectorAll('.tab-button');

    // Скрываем все панели
    panels.forEach(p => p.style.display = 'none');
    // Убираем активный класс у всех кнопок вкладок
    tabButtons.forEach(tb => tb.classList.remove('active'));

    // Показываем выбранную панель и активируем соответствующую кнопку
    if (panel === 'basic') {
        document.querySelector('.basic-panel').style.display = 'grid';
        document.querySelector('.tab-button[onclick*="basic"]').classList.add('active');
    } else if (panel === 'functions') {
        document.querySelector('.functions-panel').style.display = 'grid';
        document.querySelector('.tab-button[onclick*="functions"]').classList.add('active');
    } else if (panel === 'alpha') {
        document.querySelector('.alpha-panel').style.display = 'grid';
        document.querySelector('.tab-button[onclick*="alpha"]').classList.add('active');
    }
}

// Инициализация: показываем базовую панель по умолчанию
window.onload = function() {
    showPanel('basic');
    // Устанавливаем дефолтный размер при загрузке
    calculator.style.width = `${DEFAULT_WIDTH}px`;
    calculator.style.height = `${DEFAULT_HEIGHT}px`;

    // Применяем сохранённую тему
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        toggleTheme();
        document.querySelector('.switch input').checked = true;
    }
};

// Функция для перемещения курсора в поле ввода
function moveCursor(direction) {
    const input = display;
    const cursorPos = input.selectionStart || 0;

    if (direction === 'left' && cursorPos > 0) {
        input.setSelectionRange(cursorPos - 1, cursorPos - 1); // Перемещаем курсор влево
    } else if (direction === 'right' && cursorPos < input.value.length) {
        input.setSelectionRange(cursorPos + 1, cursorPos + 1); // Перемещаем курсор вправо
    }
    input.focus(); // Убеждаемся, что поле ввода в фокусе после перемещения
}

// Функция для перетаскивания калькулятора
let isDragging = false;
let currentX;
let currentY;
let xOffset = 0;
let yOffset = 0;

calculator.querySelector('.calculator-header').addEventListener('mousedown', startDragging);
calculator.querySelector('.calculator-header').addEventListener('dblclick', resetSize); // Двойной клик на заголовок
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', stopDragging);

function startDragging(e) {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    isDragging = true; // Разрешаем перетаскивание при клике на любой элемент в .calculator-header
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

// Функция для изменения размера калькулятора
let isResizing = false;
let initialXResize;
let initialYResize;
let initialWidth = DEFAULT_WIDTH; // Используем новый дефолтный размер
let initialHeight = DEFAULT_HEIGHT; // Используем новый дефолтный размер

resizeHandle.addEventListener('mousedown', startResizing);
resizeHandle.addEventListener('dblclick', resetSize); // Двойной клик на ручку изменения размера
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

        let newWidth = Math.max(initialWidth + dx, 300); // Минимальная ширина 300px
        let newHeight = Math.max(initialHeight + dy, 200); // Минимальная высота 200px

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

// Функция возврата к дефолтному размеру
function resetSize() {
    calculator.style.width = `${DEFAULT_WIDTH}px`;
    calculator.style.height = `${DEFAULT_HEIGHT}px`;
    initialWidth = DEFAULT_WIDTH;
    initialHeight = DEFAULT_HEIGHT;
    xOffset = 0; // Сбрасываем положение
    yOffset = 0;
    setTranslate(0, 0, calculator); // Возвращаем в центр
}

// Фикс дублирования цифр и работы Backspace
display.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        calculate('=');
    } else if (event.key === 'Backspace') {
        // Если в поле ввода только "Ошибка", очищаем полностью
        if (display.value === 'Ошибка') {
            display.value = '';
            event.preventDefault();
        }
        // Иначе разрешаем стандартное поведение (стирание по букве)
        return;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        return; // Позволяем стандартное поведение для стрелок
    } else if (!/[0-9+\-*/.()πie]/.test(event.key)) {
        event.preventDefault(); // Блокируем ненужные символы
    }
});

// Конвертация градусов в радианы
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

// Конвертация радиан в градусы
function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

// Функция для вычисления факториала
function factorial(n) {
    if (!Number.isInteger(n) || n < 0) return 'Ошибка';
    if (n === 0) return 1;
    return n * factorial(n - 1);
}