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

function append(value) {
    // Разрешаем ввод функций, чисел, операций, букв и специальных символов
    if (/[\d+\-*/.()πi]/.test(value) || ['sin', 'cos', 'tan', 'cot', 'sqrt', 'arcsin', 'arccos', 'ln', 'log', 'abs', 'e', 'e^x', 'a^n'].includes(value) || /^[a-z]$/i.test(value)) {
        if (['sin', 'cos', 'tan', 'cot', 'sqrt', 'arcsin', 'arccos', 'ln', 'log', 'abs'].includes(value)) {
            display.value += value + '('; // Добавляем функцию с открывающей скобкой
        } else if (value === 'square') {
            display.value += '^2'; // Добавляем возведение в квадрат, как в Desmos
        } else if (value === 'e^x') {
            display.value += 'Math.exp('; // Добавляем экспоненту e^x
        } else if (value === 'a^n') {
            display.value += '^'; // Добавляем степень a^n (требуется два аргумента: основание и показатель)
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
            expression = expression.replace(/π/g, Math.PI).replace(/i/g, 'i').replace(/e/g, 'Math.E').replace(/\^2/g, '**2').replace(/\^/g, '**'); // Поддержка степеней
            // Проверяем, содержит ли выражение функцию
            if (['sin(', 'cos(', 'tan(', 'cot(', 'sqrt(', 'arcsin(', 'arccos(', 'ln(', 'log(', 'abs('].some(func => expression.includes(func))) {
                let funcMatch = expression.match(/([a-z]+)\(([\d+\-*.]+)\)/i); // Ищем функцию и число в скобках
                if (funcMatch) {
                    let func = funcMatch[1].toLowerCase();
                    let number = parseFloat(funcMatch[2]) || 0;
                    switch (func) {
                        case 'sin': result = Math.sin(toRadians(number)); break;
                        case 'cos': result = Math.cos(toRadians(number)); break;
                        case 'tan': result = Math.tan(toRadians(number)); break;
                        case 'cot': {
                            let tanValue = Math.tan(toRadians(number));
                            result = tanValue === 0 ? 'Не определено' : 1 / tanValue; // Проверяем деление на ноль
                            break;
                        }
                        case 'sqrt': result = Math.sqrt(number); break;
                        case 'arcsin': result = toDegrees(Math.asin(number)); break;
                        case 'arccos': result = toDegrees(Math.acos(number)); break;
                        case 'ln': result = Math.log(number); break;
                        case 'log': result = Math.log10(number); break;
                        case 'abs': result = Math.abs(number); break;
                        default: result = eval(expression); // Если не нашли функцию, используем eval
                    }
                } else if (expression.includes('Math.exp(')) {
                    let expMatch = expression.match(/Math\.exp\(([\d+\-*.]+)\)/);
                    if (expMatch) {
                        let expNumber = parseFloat(expMatch[1]) || 0;
                        result = Math.exp(expNumber); // Вычисляем e^x
                    } else if (expression === 'Math.exp(') {
                        result = Math.E; // Если нет числа, возвращаем просто e
                    } else {
                        // Если нет скобок и числа, считаем e^x как e в степени последнего числа
                        let lastNumberMatch = expression.match(/(\d+\.?\d*)$/);
                        if (lastNumberMatch) {
                            let lastNumber = parseFloat(lastNumberMatch[0]);
                            result = Math.exp(lastNumber);
                        } else {
                            result = Math.E; // По умолчанию e, если нет числа
                        }
                    }
                } else {
                    result = eval(expression); // Если нет явной функции, пробуем вычислить как есть
                }
            } else {
                // Обработка степеней (a^n)
                let powerMatch = expression.match(/(\d+\.?\d*)\*\*(\d+\.?\d*)/); // Ищем a**n
                if (powerMatch) {
                    let base = parseFloat(powerMatch[1]);
                    let exponent = parseFloat(powerMatch[2]);
                    result = Math.pow(base, exponent);
                } else {
                    result = eval(expression); // Обычное вычисление
                }
            }
        } else {
            let input = parseFloat(expression.replace(/π/g, Math.PI).replace(/e/g, 'Math.E').replace(/\^2/g, '**2').replace(/\^/g, '**')) || 0;
            switch (operation) {
                case 'square': result = input * input; break;
                case 'sqrt': result = Math.sqrt(input); break;
                default: result = 'Ошибка';
            }
        }
        display.value = isNaN(result) || !isFinite(result) ? 'Ошибка' : (typeof result === 'string' ? result : formatNumber(result));
    } catch (error) {
        display.value = 'Ошибка';
    }
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

    // Переключаем классы для смены темы
    body.classList.toggle('light');
    calc.classList.toggle('light');
    displayInput.classList.toggle('light');
    buttons.forEach(button => button.classList.toggle('light'));
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