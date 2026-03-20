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
    if (value.includes('.') || value.includes(',')) {
        return { isValid: false, isFloat: true };
    }

    const allChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const allowedChars = allChars.substring(0, base);

    if (!allowedChars) return { isValid: false, invalidChar: null };

    for (let char of value.toUpperCase()) {
        if (!allowedChars.includes(char)) {
            return { isValid: false, invalidChar: char };
        }
    }
    return { isValid: true, invalidChar: null, isFloat: false };
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
            if (validation.isFloat) {
                resultValue.textContent = 'Ошибка: дробные числа не поддерживаются';
            } else {
                resultValue.textContent = `Ошибка: символ ${validation.invalidChar} недопустим для системы с основанием ${from}`;
            }
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

function toggleThemeSpecific() {
    let calc = document.querySelector('.calculator');
    let buttons = document.querySelectorAll('button');
    let navLinks = document.querySelectorAll('.nav-link');
    let inputs = document.querySelectorAll('input');
    let selects = document.querySelectorAll('select');
    let resultSectionEl = document.querySelector('.result-section');
    let table = document.querySelector('table');
    let th = document.querySelectorAll('th');
    let td = document.querySelectorAll('td');

    calc.classList.toggle('light');
    buttons.forEach(button => button.classList.toggle('light'));
    navLinks.forEach(link => link.classList.toggle('light'));
    inputs.forEach(input => input.classList.toggle('light'));
    selects.forEach(select => select.classList.toggle('light'));
    if (resultSectionEl) resultSectionEl.classList.toggle('light');
    if (table) table.classList.toggle('light');
    th.forEach(header => header.classList.toggle('light'));
    td.forEach(cell => cell.classList.toggle('light'));
}

function toggleThemeWrapper() {
    toggleTheme(toggleThemeSpecific);
}
window.toggleTheme = toggleThemeWrapper;

// Функция инициализации конвертера
function initializeConverter() {
    calculator.style.width = `${DEFAULT_WIDTH}px`;
    calculator.style.height = `${DEFAULT_HEIGHT}px`;
    
    // Добавляем обработчики событий
    inputValue.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
    
    // Устанавливаем начальные значения
    fromBase.value = '10';
    toBase.value = '2';
    
    // Очищаем результаты
    resultValue.textContent = '';
    explanation.textContent = '';
    stepTableBody.innerHTML = '';
}

window.resetSpecificLayout = function() {
    calculator.classList.remove('expanded');
    resultPanel.style.width = '0';
    resultValue.textContent = '';
    explanation.textContent = '';
    stepTableBody.innerHTML = '';
    resultSection.classList.remove('visible');
    document.querySelector('.number-panel').style.width = '100%';
};

// Модифицируем window.onload
window.onload = function() {
    updateLoadingText(0);
    
    setTimeout(() => {
        try {
            initializeConverter();
            
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'light') {
                toggleThemeWrapper();
                document.querySelector('.switch input').checked = true;
            }

            setupWindowDraggable(
                calculator,
                calculator.querySelector('.calculator-header'),
                resizeHandle,
                DEFAULT_WIDTH,
                DEFAULT_HEIGHT
            );
        } catch (error) {
            console.error('Error during initialization:', error);
        } finally {
            hidePreloader();
        }
    }, 2000);
};