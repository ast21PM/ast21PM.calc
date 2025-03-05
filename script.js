// Получаем элемент поля ввода
let display = document.getElementById('display');
// Получаем элемент калькулятора
let calculator = document.querySelector('.calculator');
// Получаем кнопку переключения темы
let themeToggle = document.getElementById('themeToggle');

function append(value) {
    // Разрешаем ввод функций, чисел, операций и специальных символов
    if (/[\d+\-*/.()]/.test(value) || ['sin', 'cos', 'tan', 'cot', 'sqrt', 'square', 'arcsin', 'arccos', 'π', 'i'].includes(value)) {
        if (['sin', 'cos', 'tan', 'cot', 'sqrt', 'arcsin', 'arccos'].includes(value)) {
            display.value += value + '('; // Добавляем функцию с открывающей скобкой
        } else if (value === 'square') {
            display.value += '^2'; // Добавляем возведение в квадрат, как в Desmos
        } else {
            display.value += value;
        }
    }
}

// Очищаем поле ввода
function clearDisplay() {
    display.value = '';
}

// Выполняем вычисление
function calculate(operation) {
    let expression = display.value.trim();
    let result;

    try {
        if (operation === '=') {
            // Обрабатываем выражение, заменяя π и i на значения
            expression = expression.replace(/π/g, Math.PI).replace(/i/g, 'i').replace(/\^2/g, '**2'); // Поддержка x² как **2
            // Проверяем, содержит ли выражение функцию
            if (['sin(', 'cos(', 'tan(', 'cot(', 'sqrt(', 'arcsin(', 'arccos('].some(func => expression.includes(func))) {
                let funcMatch = expression.match(/([a-z]+)\(([\d+\-*.]+)\)/i); // Ищем функцию и число в скобках
                if (funcMatch) {
                    let func = funcMatch[1].toLowerCase();
                    let number = parseFloat(funcMatch[2]) || 0;
                    switch (func) {
                        case 'sin': result = Math.sin(toRadians(number)); break;
                        case 'cos': result = Math.cos(toRadians(number)); break;
                        case 'tan': result = Math.tan(toRadians(number)); break;
                        case 'cot': result = 1 / Math.tan(toRadians(number)) || 0; break;
                        case 'sqrt': result = Math.sqrt(number); break;
                        case 'arcsin': result = toDegrees(Math.asin(number)); break;
                        case 'arccos': result = toDegrees(Math.acos(number)); break;
                        default: result = eval(expression); // Если не нашли функцию, используем eval
                    }
                } else {
                    result = eval(expression); // Если нет явной функции, пробуем вычислить как есть
                }
            } else {
                result = eval(expression); // Обычное вычисление
            }
        } else {
            let input = parseFloat(expression.replace(/π/g, Math.PI).replace(/\^2/g, '**2')) || 0;
            switch (operation) {
                case 'square': result = input * input; break;
                case 'sqrt': result = Math.sqrt(input); break;
                default: result = 'Ошибка';
            }
        }
        display.value = isNaN(result) || !isFinite(result) ? 'Ошибка' : result;
    } catch (error) {
        display.value = 'Ошибка';
    }
}

// Функция переключения темы с изменением иконки
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

    // Меняем иконку кнопки темы
    if (body.classList.contains('light')) {
        themeToggle.textContent = '🌞'; // Солнце для светлой темы
    } else {
        themeToggle.textContent = '🌙'; // Полумесяц для темной темы
    }
}

// Фикс дублирования цифр и работы Backspace
display.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        calculate('=');
    } else if (event.key === 'Backspace' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        return; // Позволяем стандартное поведение
    } else if (!/[0-9+\-*/.()πi]/.test(event.key)) {
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