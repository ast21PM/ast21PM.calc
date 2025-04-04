let display = document.getElementById('display');
let calculator = document.getElementById('calculator');
let themeToggle = document.getElementById('themeToggle');
let resizeHandle = document.getElementById('resizeHandle');

const DEFAULT_WIDTH = 650;
const DEFAULT_HEIGHT = 550;

let history = [];

function append(value) {
    if (/[\d+\-*/.()πi%]/.test(value) || ['sin', 'cos', 'tan', 'cot', 'sqrt', 'arcsin', 'arccos', 'arctan', 'ln', 'log', 'abs', 'e', 'e^x', 'a^n', 'factorial', 'square'].includes(value) || /^[a-z]$/i.test(value)) {
        if (value === 'sqrt') {
            display.value += '√(';
        } else if (value === 'square') {
            let lastChar = display.value.slice(-1);
            if (display.value === '' || !/[\d)]/.test(lastChar)) {
                display.value += '2²';
            } else {
                display.value += '²';
            }
        } else if (value === 'e^x') {
            display.value += 'e^x(';
        } else if (value === 'a^n') {
            display.value += '^';
        } else if (['sin', 'cos', 'tan', 'cot', 'arcsin', 'arccos', 'arctan', 'ln', 'log', 'abs'].includes(value)) {
            display.value += value + '(';
        } else if (value === 'factorial') {
            display.value += '!';
        } else {
            display.value += value;
        }
    }
}

function clearDisplay() {
    display.value = '';
}

// Новая функция для удаления последнего символа
function backspace() {
    if (display.value === 'Ошибка') {
        display.value = ''; // Если на экране ошибка, очищаем полностью
    } else {
        display.value = display.value.slice(0, -1); // Удаляем последний символ
    }
}

function formatNumber(number) {
    let fixed = number.toFixed(5);
    let parsed = parseFloat(fixed);
    return Number.isInteger(parsed) ? parsed.toString() : parsed.toFixed(5);
}

function calculate(operation) {
    let expression = display.value.trim();
    let result;

    try {
        if (operation === '=') {
            let evalExpression = expression;

            // 1. Обработка возведения в квадрат (²)
            evalExpression = evalExpression.replace(/(\d*\.?\d+(?:[+-]?\d*\.?\d*i)?)²/g, (match, num) => {
                let complex = parseNumber(num);
                return `(${complex.multiply(complex).toString()})`; // Оборачиваем в скобки
            });

            // 2. Обработка факториала (!)
            evalExpression = evalExpression.replace(/(\d*\.?\d+)!/g, (match, num) => {
                return `(${factorial(parseFloat(num))})`; // Оборачиваем в скобки
            });

            // 3. Обработка функций (√, e^x, π, e, ^)
            evalExpression = evalExpression
                .replace(/√(\d+|\([^()]*\))/g, (match, arg) => {
                    let num = evaluateSimpleExpression(arg); // Вычисляем аргумент
                    return `(${Math.sqrt(num.real)})`; // Только реальная часть
                })
                .replace(/e\^x(\d+|\([^()]*\))/g, (match, arg) => {
                    let num = evaluateSimpleExpression(arg);
                    return `(${Math.exp(num.real)})`; // Только реальная часть
                })
                .replace(/π/g, `(${Math.PI})`)
                .replace(/e/g, `(${Math.E})`)
                .replace(/\^/g, '**');

            // 4. Обработка процентов (%)
            evalExpression = evalExpression.replace(/(\d*\.?\d+)%/g, (match, num) => {
                let percentage = parseFloat(num) / 100;
                let before = evalExpression.slice(0, evalExpression.indexOf(match)).trim();
                if (before && /[\+\-\*\/]$/.test(before)) {
                    let lastNumMatch = before.match(/(\d*\.?\d+(?:[+-]?\d*\.?\d*i)?)$/);
                    if (lastNumMatch) {
                        let base = parseNumber(lastNumMatch[0]);
                        let operator = before.slice(-1);
                        if (operator === '+' || operator === '-') {
                            return `(${base.toString()} * ${percentage})`;
                        } else if (operator === '*' || operator === '/') {
                            return `(${percentage})`;
                        }
                    }
                }
                return `(${percentage})`;
            });

            // 5. Обработка тригонометрических и других функций
            while (evalExpression.match(/([a-z]+)\(([^()]+)\)/i)) {
                evalExpression = evalExpression.replace(/([a-z]+)\(([^()]+)\)/gi, (match, func, arg) => {
                    func = func.toLowerCase();
                    let num = evaluateSimpleExpression(arg); // Вычисляем аргумент
                    if (func === 'abs') {
                        return `(${Math.sqrt(num.real * num.real + num.imag * num.imag)})`;
                    }
                    let number = num.real; // Используем только реальную часть для тригонометрии
                    switch (func) {
                        case 'sin': return `(${Math.sin(toRadians(number))})`;
                        case 'cos': return `(${Math.cos(toRadians(number))})`;
                        case 'tan': return `(${Math.tan(toRadians(number))})`;
                        case 'cot': {
                            let tanValue = Math.tan(toRadians(number));
                            return tanValue === 0 ? '(Infinity)' : (Math.abs(tanValue) === Infinity ? '(0)' : `(${1 / tanValue})`);
                        }
                        case 'arcsin': return `(${toDegrees(Math.asin(number))})`;
                        case 'arccos': return `(${toDegrees(Math.acos(number))})`;
                        case 'arctan': return `(${toDegrees(Math.atan(number))})`;
                        case 'ln': return `(${Math.log(number)})`;
                        case 'log': return `(${Math.log10(number)})`;
                        default: return match;
                    }
                });
            }

            result = evaluateSimpleExpression(evalExpression);
            display.value = result.toString();
            updateHistory(expression, display.value);
        }
    } catch (error) {
        display.value = 'Ошибка';
        updateHistory(expression, 'Ошибка');
    }
}

// Новая функция для вычисления простых выражений
function evaluateSimpleExpression(expr) {
    expr = expr.replace(/\s/g, '');
    let terms = [];
    let current = '';
    for (let i = 0; i < expr.length; i++) {
        if ((expr[i] === '+' || expr[i] === '-') && !isInsideMultiplyDivide(expr, i)) {
            if (current) terms.push(current);
            current = expr[i];
        } else {
            current += expr[i];
        }
    }
    if (current) terms.push(current);

    let result = parseTerm(terms[0]);
    for (let i = 1; i < terms.length; i++) {
        let term = parseTerm(terms[i].slice(1));
        if (terms[i][0] === '+') result = result.add(term);
        else result = result.subtract(term);
    }
    return result;
}

function isInsideMultiplyDivide(expr, index) {
    let depth = 0;
    for (let i = 0; i < index; i++) {
        if (expr[i] === '(') depth++;
        if (expr[i] === ')') depth--;
        if ((expr[i] === '*' || expr[i] === '/') && depth === 0) return true;
    }
    return false;
}

function parseTerm(term) {
    if (term.includes('*') || term.includes('/')) {
        let factors = term.split(/([*/])/);
        let result = parseNumber(factors[0]);
        for (let i = 1; i < factors.length; i += 2) {
            let op = factors[i];
            let next = parseNumber(factors[i + 1]);
            if (op === '*') result = result.multiply(next);
            else if (op === '/') result = result.divide(next);
        }
        return result;
    }
    return parseNumber(term);
}

function parseNumber(str) {
    if (!str) return new Complex(0, 0);
    if (str === 'i') return new Complex(0, 1);
    str = str.replace(/[()]/g, ''); // Убираем лишние скобки
    let real = 0, imag = 0;
    let match = str.match(/([+-]?)(\d*\.?\d*)(i?)/);
    if (match) {
        let sign = match[1] === '-' ? -1 : 1;
        let num = parseFloat(match[2]) || (match[2] === '' ? 1 : 0);
        if (match[3] === 'i') imag = sign * num;
        else real = sign * num;
    }
    return new Complex(real, imag);
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

    body.classList.toggle('light');
    calc.classList.toggle('light');
    displayInput.classList.toggle('light');
    buttons.forEach(button => button.classList.toggle('light'));
    navLinks.forEach(link => link.classList.toggle('light'));

    const isLightTheme = body.classList.contains('light');
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
}

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
    } else if (panel === 'alpha') {
        document.querySelector('.alpha-panel').style.display = 'grid';
        document.querySelector('.tab-button[onclick*="alpha"]').classList.add('active');
    }
}

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

display.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        calculate('=');
    } else if (event.key === 'Backspace') {
        if (display.value === 'Ошибка') {
            display.value = '';
            event.preventDefault();
        }
        return;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        return;
    } else if (!/[0-9+\-*/.()πie%!]/.test(event.key)) {
        event.preventDefault();
    }
});

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}

function factorial(n) {
    if (!Number.isInteger(n) || n < 0) return 'Ошибка';
    if (n === 0) return 1;
    return n * factorial(n - 1);
}

class Complex {
    constructor(real, imag) {
        this.real = real || 0;
        this.imag = imag || 0;
    }

    add(other) {
        return new Complex(this.real + other.real, this.imag + other.imag);
    }

    subtract(other) {
        return new Complex(this.real - other.real, this.imag - other.imag);
    }

    multiply(other) {
        const real = this.real * other.real - this.imag * other.imag;
        const imag = this.real * other.imag + this.imag * other.real;
        return new Complex(real, imag);
    }

    divide(other) {
        const denominator = other.real * other.real + other.imag * other.imag;
        if (denominator === 0) throw new Error('Division by zero');
        const real = (this.real * other.real + this.imag * other.imag) / denominator;
        const imag = (this.imag * other.real - this.real * other.imag) / denominator;
        return new Complex(real, imag);
    }

    toString() {
        if (this.imag === 0) return formatNumber(this.real);
        if (this.real === 0) return this.imag === 1 ? 'i' : (this.imag === -1 ? '-i' : `${formatNumber(this.imag)}i`);
        return `${formatNumber(this.real)}${this.imag >= 0 ? '+' : ''}${this.imag === 1 ? 'i' : (this.imag === -1 ? '-i' : `${formatNumber(this.imag)}i`)}`;
    }
}