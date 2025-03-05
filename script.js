// Получаем элемент поля ввода
let display = document.getElementById('display');
// Получаем элемент калькулятора
let calculator = document.querySelector('.calculator');
// Получаем кнопку переключения темы
let themeToggle = document.getElementById('themeToggle');

function append(value) {
    // Разрешаем ввод функций, чисел, операций, букв и специальных символов
    if (/[\d+\-*/.()πi]/.test(value) || ['sin', 'cos', 'tan', 'cot', 'sqrt', 'square', 'arcsin', 'arccos', 'ln', 'log', 'abs', 'e'].includes(value) || /^[a-z]$/i.test(value)) {
        if (['sin', 'cos', 'tan', 'cot', 'sqrt', 'arcsin', 'arccos', 'ln', 'log', 'abs'].includes(value)) {
            display.value += value + '('; // Добавляем функцию с открывающей скобкой
        } else if (value === 'square') {
            display.value += '^2'; // Добавляем возведение в квадрат, как в Desmos
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
                        case 'cot': result = 1 / Math.tan(toRadians(number)) || 0; break;
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
                    } else {
                        result = eval(expression); // Если нет явной экспоненты, пробуем вычислить как есть
                    }
                } else {
                    result = eval(expression); // Если нет явной функции, пробуем вычислить как есть
                }
            } else {
                result = eval(expression); // Обычное вычисление
            }
        } else {
            let input = parseFloat(expression.replace(/π/g, Math.PI).replace(/e/g, 'Math.E').replace(/\^2/g, '**2').replace(/\^/g, '**')) || 0;
            switch (operation) {
                case 'square': result = input * input; break;
                case 'sqrt': result = Math.sqrt(input); break;
                default: result = 'Ошибка';
            }
        }
        display.value = isNaN(result) || !isFinite(result) ? 'Ошибка' : result.toFixed(10); // Ограничиваем до 10 знаков после запятой, как в Desmos
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
};

// Фикс дублирования цифр и работы Backspace
display.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        calculate('=');
    } else if (event.key === 'Backspace' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        return; // Позволяем стандартное поведение
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