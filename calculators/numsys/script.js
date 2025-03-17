// Получаем элементы
let calculator = document.getElementById('calculator');
let themeToggle = document.getElementById('themeToggle');
let resizeHandle = document.getElementById('resizeHandle');
let inputValue = document.getElementById('inputValue');
let fromBase = document.getElementById('fromBase');
let toBase = document.getElementById('toBase');
let resultValue = document.getElementById('resultValue');
let explanation = document.getElementById('explanation');
let stepTableBody = document.getElementById('stepTableBody');

// Дефолтные размеры
const DEFAULT_WIDTH = 650;
const DEFAULT_HEIGHT = 600; // Оставляем увеличенную высоту

function convertNumber() {
    let value = inputValue.value.trim().toUpperCase();
    let from = parseInt(fromBase.value);
    let to = parseInt(toBase.value);

    if (value === '') {
        resultValue.textContent = 'Ошибка: введите число';
        explanation.textContent = '';
        stepTableBody.innerHTML = '';
        return;
    }

    try {
        // Преобразуем в десятичную систему
        let decimal = parseInt(value, from);
        if (isNaN(decimal)) {
            resultValue.textContent = 'Ошибка: некорректное число';
            explanation.textContent = '';
            stepTableBody.innerHTML = '';
            return;
        }

        // Проверка на отрицательные числа
        if (decimal < 0) {
            resultValue.textContent = 'Ошибка: отрицательные числа не поддерживаются';
            explanation.textContent = '';
            stepTableBody.innerHTML = '';
            return;
        }

        // Преобразуем в целевую систему
        let result = decimal.toString(to).toUpperCase();
        resultValue.textContent = `${value} (base ${from}) = ${result} (base ${to})`;

        // Показываем шаги
        stepTableBody.innerHTML = '';

        // Шаг 1: Перевод в десятичную систему (если исходная система не 10)
        if (from !== 10) {
            explanation.textContent = `Сначала переводим число ${value} из системы с основанием ${from} в десятичную систему.\nКаждый разряд числа умножаем на основание ${from} в степени n, где n — номер разряда (0 — младший разряд). Суммируем результаты.`;
            showStepsToDecimal(value, from);
        } else {
            explanation.textContent = `Число ${value} уже в десятичной системе.`;
        }

        // Шаг 2: Перевод из десятичной в целевую систему (если целевая система не 10)
        if (to !== 10) {
            let explanationText = from !== 10 
                ? `Теперь переводим полученное десятичное число ${decimal} в систему с основанием ${to}.\nДелим число на ${to}, записываем остатки, пока частное не станет 0. Остатки в обратном порядке дают результат.`
                : `Переводим число ${decimal} из десятичной системы в систему с основанием ${to}.\nДелим число на ${to}, записываем остатки, пока частное не станет 0. Остатки в обратном порядке дают результат.`;
            explanation.textContent += `\n${explanationText}`;
            showStepsFromDecimal(decimal, to);
        }
    } catch (e) {
        resultValue.textContent = 'Ошибка';
        explanation.textContent = '';
        stepTableBody.innerHTML = '';
    }
}

// Функция для перевода из системы с основанием from в десятичную
function showStepsToDecimal(value, fromBase) {
    let digits = value.split('').reverse(); // Разбиваем число на разряды и переворачиваем (младший разряд справа)
    let decimal = 0;
    let steps = [];

    digits.forEach((digit, index) => {
        let digitValue = parseInt(digit, fromBase); // Преобразуем символ в число (например, A в 10 для base 16)
        let power = index;
        let contribution = digitValue * Math.pow(fromBase, power);
        decimal += contribution;
        steps.push({ digit: digit, power: power, contribution: contribution });
    });

    // Отображаем шаги в таблице
    stepTableBody.innerHTML = '<tr><th>Разряд</th><th>Значение</th><th>Степень</th><th>Результат</th></tr>';
    steps.forEach(step => {
        let row = document.createElement('tr');
        row.innerHTML = `
            <td>${step.digit}</td>
            <td>${step.digit} × ${fromBase}^${step.power}</td>
            <td>${fromBase}^${step.power}</td>
            <td>${step.contribution}</td>
        `;
        stepTableBody.appendChild(row);
    });

    // Добавляем итоговую строку
    let resultRow = document.createElement('tr');
    resultRow.innerHTML = `<td colspan="4">Сумма: ${decimal} (base 10)</td>`;
    stepTableBody.appendChild(resultRow);
}

// Функция для перевода из десятичной системы в систему с основанием to
function showStepsFromDecimal(decimal, targetBase) {
    let steps = [];
    let quotient = decimal;
    
    // Делим на основание, пока частное не станет 0
    while (quotient > 0) {
        let remainder = quotient % targetBase;
        steps.push({ quotient: quotient, newQuotient: Math.floor(quotient / targetBase), remainder: remainder.toString(targetBase).toUpperCase() });
        quotient = Math.floor(quotient / targetBase);
    }

    // Добавляем заголовок для второй таблицы
    let headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th>Деление</th><th>Целое частное</th><th>Остаток</th>';
    stepTableBody.appendChild(headerRow);

    // Отображаем шаги в таблице
    steps.forEach(step => {
        let row = document.createElement('tr');
        row.innerHTML = `
            <td>${step.quotient} / ${targetBase}</td>
            <td>${step.newQuotient}</td>
            <td>${step.remainder}</td>
        `;
        stepTableBody.appendChild(row);
    });

    // Добавляем итоговую строку
    let resultRow = document.createElement('tr');
    resultRow.innerHTML = `
        <td colspan="3">${decimal} (base 10) = ${decimal.toString(targetBase).toUpperCase()} (base ${targetBase})</td>
    `;
    stepTableBody.appendChild(resultRow);
}

// Новая функция для смены систем счисления местами
function swapBases() {
    let fromValue = fromBase.value;
    let toValue = toBase.value;
    fromBase.value = toValue;
    toBase.value = fromValue;
}

function toggleTheme() {
    let body = document.body;
    let calc = document.querySelector('.calculator');
    let buttons = document.querySelectorAll('button');
    let navLinks = document.querySelectorAll('.nav-link');
    let inputs = document.querySelectorAll('input');
    let selects = document.querySelectorAll('select');
    let resultSection = document.querySelector('.result-section');
    let table = document.querySelector('table');
    let th = document.querySelectorAll('th');
    let td = document.querySelectorAll('td');

    body.classList.toggle('light');
    calc.classList.toggle('light');
    buttons.forEach(button => button.classList.toggle('light'));
    navLinks.forEach(link => link.classList.toggle('light'));
    inputs.forEach(input => input.classList.toggle('light'));
    selects.forEach(select => select.classList.toggle('light'));
    if (resultSection) resultSection.classList.toggle('light');
    if (table) table.classList.toggle('light');
    th.forEach(header => header.classList.toggle('light'));
    td.forEach(cell => cell.classList.toggle('light'));

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
};

// Перетаскивание
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

// Изменение размера
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