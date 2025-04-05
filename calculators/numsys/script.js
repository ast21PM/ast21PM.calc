let calculator = document.getElementById('calculator');
let themeToggle = document.getElementById('themeToggle');
let resizeHandle = document.getElementById('resizeHandle');
let inputValue = document.getElementById('inputValue');
let fromBase = document.getElementById('fromBase');
let toBase = document.getElementById('toBase');
let resultValue = document.getElementById('resultValue');
let explanation = document.getElementById('explanation');
let stepTableBody = document.getElementById('stepTableBody');
let resultSection = document.getElementById('resultSection');
let resultPanel = document.getElementById('resultPanel');
let loadingSpinner = document.getElementById('loadingSpinner');

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 650;

function validateInput(value, base) {
    const validChars = {
        2: '01',
        8: '01234567',
        10: '0123456789',
        16: '0123456789ABCDEF'
    };

    const allowedChars = validChars[base];
    if (!allowedChars) return { isValid: false, invalidChar: null };

    for (let char of value.toUpperCase()) {
        if (!allowedChars.includes(char)) {
            return { isValid: false, invalidChar: char };
        }
    }
    return { isValid: true, invalidChar: null };
}

function convertNumber() {
    let value = inputValue.value.trim().toUpperCase();
    let from = parseInt(fromBase.value);
    let to = parseInt(toBase.value);

    resultValue.textContent = '';
    explanation.textContent = '';
    stepTableBody.innerHTML = '';
    resultSection.classList.remove('visible');

    loadingSpinner.classList.add('active');

    if (value === '') {
        setTimeout(() => {
            loadingSpinner.classList.remove('active');
            resultValue.textContent = 'Ошибка: введите число';
            resultSection.classList.add('visible');
            expandCalculator();
        }, 1000);
        return;
    }

    const validation = validateInput(value, from);
    if (!validation.isValid) {
        setTimeout(() => {
            loadingSpinner.classList.remove('active');
            resultValue.textContent = `Ошибка: символ ${validation.invalidChar} недопустим для системы с основанием ${from}`;
            resultSection.classList.add('visible');
            expandCalculator();
        }, 1000);
        return;
    }

    try {
        let decimal = parseInt(value, from);
        if (isNaN(decimal)) {
            setTimeout(() => {
                loadingSpinner.classList.remove('active');
                resultValue.textContent = 'Ошибка: некорректное число';
                resultSection.classList.add('visible');
                expandCalculator();
            }, 1000);
            return;
        }

        if (decimal < 0) {
            setTimeout(() => {
                loadingSpinner.classList.remove('active');
                resultValue.textContent = 'Ошибка: отрицательные числа не поддерживаются';
                resultSection.classList.add('visible');
                expandCalculator();
            }, 1000);
            return;
        }

        let result = decimal.toString(to).toUpperCase();

        setTimeout(() => {
            loadingSpinner.classList.remove('active');

            resultValue.textContent = `${value} (base ${from}) = ${result} (base ${to})`;

            stepTableBody.innerHTML = '';

            if (from !== 10) {
                explanation.textContent = `Сначала переводим число ${value} из системы с основанием ${from} в десятичную систему.\nКаждый разряд числа умножаем на основание ${from} в степени n, где n — номер разряда (0 — младший разряд). Суммируем результаты.`;
                showStepsToDecimal(value, from);
            } else {
                explanation.textContent = `Число ${value} уже в десятичной системе.`;
            }

            if (to !== 10) {
                let explanationText = from !== 10 
                    ? `Теперь переводим полученное десятичное число ${decimal} в систему с основанием ${to}.\nДелим число на ${to}, записываем остатки, пока частное не станет 0. Остатки в обратном порядке дают результат.`
                    : `Переводим число ${decimal} из десятичной системы в систему с основанием ${to}.\nДелим число на ${to}, записываем остатки, пока частное не станет 0. Остатки в обратном порядке дают результат.`;
                explanation.textContent += `\n${explanationText}`;
                showStepsFromDecimal(decimal, to);
            }

            resultSection.classList.add('visible');
            expandCalculator();
        }, 1000);
    } catch (e) {
        setTimeout(() => {
            loadingSpinner.classList.remove('active');
            resultValue.textContent = 'Ошибка';
            resultSection.classList.add('visible');
            expandCalculator();
        }, 1000);
    }
}

function expandCalculator() {
    calculator.classList.add('expanded');

    setTimeout(() => {
        const numberPanel = document.querySelector('.number-panel');
        const resultSection = document.querySelector('.result-section');

        numberPanel.style.width = 'auto';
        numberPanel.style.minWidth = '350px'; 

        const numberPanelWidth = numberPanel.scrollWidth;

        numberPanel.style.width = `${numberPanelWidth}px`;

        const resultSectionWidth = resultSection.scrollWidth;
        const minResultWidth = 350;
        const resultWidth = Math.max(resultSectionWidth + 20, minResultWidth);

        const newCalculatorWidth = numberPanelWidth + resultWidth + 40;

        calculator.style.width = `${newCalculatorWidth}px`;

        resultPanel.style.width = `${resultWidth}px`;
    }, 50);
}

function showStepsToDecimal(value, fromBase) {
    let digits = value.split('').reverse();
    let decimal = 0;
    let steps = [];

    digits.forEach((digit, index) => {
        let digitValue = parseInt(digit, fromBase);
        let power = index;
        let contribution = digitValue * Math.pow(fromBase, power);
        decimal += contribution;
        steps.push({ digit: digit, power: power, contribution: contribution });
    });

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

    let resultRow = document.createElement('tr');
    resultRow.innerHTML = `<td colspan="4">Сумма: ${decimal} (base 10)</td>`;
    stepTableBody.appendChild(resultRow);
}

function showStepsFromDecimal(decimal, targetBase) {
    let steps = [];
    let quotient = decimal;

    while (quotient > 0) {
        let remainder = quotient % targetBase;
        steps.push({ quotient: quotient, newQuotient: Math.floor(quotient / targetBase), remainder: remainder.toString(targetBase).toUpperCase() });
        quotient = Math.floor(quotient / targetBase);
    }

    stepTableBody.innerHTML = '<tr><th>Деление</th><th>Целое частное</th><th>Остаток</th></tr>';
    steps.forEach(step => {
        let row = document.createElement('tr');
        row.innerHTML = `
            <td>${step.quotient} / ${targetBase}</td>
            <td>${step.newQuotient}</td>
            <td>${step.remainder}</td>
        `;
        stepTableBody.appendChild(row);
    });

    let resultRow = document.createElement('tr');
    resultRow.innerHTML = `
        <td colspan="3">${decimal} (base 10) = ${decimal.toString(targetBase).toUpperCase()} (base ${targetBase})</td>
    `;
    stepTableBody.appendChild(resultRow);
}

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
let initialWidth;
let initialHeight;

resizeHandle.addEventListener('mousedown', startResizing);
resizeHandle.addEventListener('dblclick', resetSize);
document.addEventListener('mousemove', resize);
document.addEventListener('mouseup', stopResizing);

function startResizing(e) {
    e.preventDefault();
    const rect = calculator.getBoundingClientRect();
    initialWidth = rect.width;
    initialHeight = rect.height;
    initialXResize = e.clientX;
    initialYResize = e.clientY;
    isResizing = true;
}

function resize(e) {
    if (isResizing) {
        e.preventDefault();
        const dx = e.clientX - initialXResize;
        const dy = e.clientY - initialYResize;

        const newWidth = Math.max(initialWidth + dx, 350);
        const newHeight = Math.max(initialHeight + dy, 300);

        calculator.style.width = `${newWidth}px`;
        calculator.style.height = `${newHeight}px`;
    }
}

function stopResizing() {
    if (isResizing) {
        isResizing = false;
        const rect = calculator.getBoundingClientRect();
        initialWidth = rect.width;
        initialHeight = rect.height;
    }
}

function resetSize() {
    calculator.style.width = `${DEFAULT_WIDTH}px`;
    calculator.style.height = `${DEFAULT_HEIGHT}px`;
    
    calculator.classList.remove('expanded');
    
    resultPanel.style.width = '0';
    
    resultValue.textContent = '';
    explanation.textContent = '';
    stepTableBody.innerHTML = '';
    
    resultSection.classList.remove('visible');
    
    document.querySelector('.number-panel').style.width = '100%';
    
    initialWidth = DEFAULT_WIDTH;
    initialHeight = DEFAULT_HEIGHT;
    xOffset = 0;
    yOffset = 0;
    setTranslate(0, 0, calculator);
}