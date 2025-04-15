let display = document.getElementById('display');
let calculator = document.getElementById('calculator');
let themeToggle = document.getElementById('themeToggle');
let resizeHandle = document.getElementById('resizeHandle');

const DEFAULT_WIDTH = 650;
const DEFAULT_HEIGHT = 550;

let history = [];

// Приоритеты операций
const precedence = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '^': 3
};

// Проверка, является ли токен числом
function isNumber(token) {
    return !isNaN(parseFloat(token)) && isFinite(token);
}

// Преобразование в постфиксную запись (ОПЗ)
function toPostfix(expression) {
    const output = [];
    const stack = [];
    const tokens = expression.match(/(\d+\.?\d*(?:[+-]?\d*\.?\d*i)?|\w+\(|\)|[+\-*/^])/g) || [];

    tokens.forEach(token => {
        if (isNumber(token) || token.match(/^[a-z]+$/i) || token.match(/\d*\.?\d*[+-]?\d*\.?\d*i/)) {
            output.push(token);
        } else if (token === '(' || token.endsWith('(')) {
            stack.push(token);
        } else if (token === ')') {
            while (stack.length && stack[stack.length - 1] !== '(' && !stack[stack.length - 1].endsWith('(')) {
                output.push(stack.pop());
            }
            stack.pop(); // Удаляем '(' или функцию
        } else if (token in precedence) {
            while (stack.length && precedence[stack[stack.length - 1]] >= precedence[token]) {
                output.push(stack.pop());
            }
            stack.push(token);
        }
    });

    while (stack.length) {
        output.push(stack.pop());
    }

    return output;
}

// Вычисление постфиксного выражения
function calculatePostfix(postfix) {
    const stack = [];

    postfix.forEach(token => {
        if (isNumber(token)) {
            stack.push(new Complex(parseFloat(token), 0));
        } else if (token.match(/\d*\.?\d*[+-]?\d*\.?\d*i/)) {
            stack.push(parseNumber(token));
        } else if (token in precedence) {
            const b = stack.pop();
            const a = stack.pop();
            switch (token) {
                case '+': stack.push(a.add(b)); break;
                case '-': stack.push(a.subtract(b)); break;
                case '*': stack.push(a.multiply(b)); break;
                case '/': stack.push(a.divide(b)); break;
                case '^': stack.push(a.pow(b)); break;
            }
        } else if (token.match(/^[a-z]+$/i)) {
            const arg = stack.pop();
            switch (token.toLowerCase()) {
                case 'sin': stack.push(new Complex(Math.sin(toRadians(arg.real)), 0)); break;
                case 'cos': stack.push(new Complex(Math.cos(toRadians(arg.real)), 0)); break;
                case 'tan': stack.push(new Complex(Math.tan(toRadians(arg.real)), 0)); break;
                case 'cot': {
                    const tanValue = Math.tan(toRadians(arg.real));
                    stack.push(new Complex(tanValue === 0 ? Infinity : 1 / tanValue, 0));
                    break;
                }
                case 'arcsin': stack.push(new Complex(toDegrees(Math.asin(arg.real)), 0)); break;
                case 'arccos': stack.push(new Complex(toDegrees(Math.acos(arg.real)), 0)); break;
                case 'arctan': stack.push(new Complex(toDegrees(Math.atan(arg.real)), 0)); break;
                case 'ln': stack.push(new Complex(Math.log(arg.real), 0)); break;
                case 'log': stack.push(new Complex(Math.log10(arg.real), 0)); break;
                case 'abs': stack.push(new Complex(Math.sqrt(arg.real * arg.real + arg.imag * arg.imag), 0)); break;
                case 'sqrt': stack.push(new Complex(Math.sqrt(arg.real), 0)); break;
            }
        }
    });

    return stack[0];
}

// Новая функция evaluateSimpleExpression
function evaluateSimpleExpression(expr) {
    expr = expr.replace(/\s/g, ''); // Удаляем пробелы
    const postfix = toPostfix(expr);
    return calculatePostfix(postfix);
}

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

function backspace() {
    if (display.value === 'Ошибка') {
        display.value = '';
    } else {
        display.value = display.value.slice(0, -1);
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

            // Обработка специальных символов и функций
            evalExpression = evalExpression
                .replace(/(\d*\.?\d+(?:[+-]?\d*\.?\d*i)?)²/g, (match, num) => {
                    let complex = parseNumber(num);
                    return `(${complex.multiply(complex).toString()})`;
                })
                .replace(/(\d*\.?\d+)!/g, (match, num) => {
                    return `(${factorial(parseFloat(num))})`;
                })
                .replace(/√/g, 'sqrt(')
                .replace(/e\^x/g, 'exp(')
                .replace(/π/g, 'Math.PI')
                .replace(/e/g, 'Math.E')
                .replace(/\^/g, '^');

            // Преобразование процентов
            evalExpression = evalExpression.replace(/(\d+)%/g, (match, num) => {
                return `(${num / 100})`;
            });

            // Вычисление выражения
            result = evaluateSimpleExpression(evalExpression);
            display.value = result.toString();
            updateHistory(expression, display.value);
        }
    } catch (error) {
        display.value = error.message || 'Ошибка';
        updateHistory(expression, display.value);
    }
}

function parseNumber(str) {
    if (!str) return new Complex(0, 0);
    if (str === 'i') return new Complex(0, 1);
    str = str.replace(/[()]/g, '');
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

    pow(exp) {
        if (exp.imag === 0 && Number.isInteger(exp.real)) {
            let result = new Complex(1, 0);
            let base = new Complex(this.real, this.imag);
            let n = Math.abs(exp.real);
            for (let i = 0; i < n; i++) {
                result = result.multiply(base);
            }
            if (exp.real < 0) return new Complex(1, 0).divide(result);
            return result;
        }
        throw new Error('Complex exponentiation not implemented');
    }

    toString() {
        if (this.imag === 0) return formatNumber(this.real);
        if (this.real === 0) return this.imag === 1 ? 'i' : (this.imag === -1 ? '-i' : `${formatNumber(this.imag)}i`);
        return `${formatNumber(this.real)}${this.imag >= 0 ? '+' : ''}${this.imag === 1 ? 'i' : (this.imag === -1 ? '-i' : `${formatNumber(this.imag)}i`)}`;
    }
}