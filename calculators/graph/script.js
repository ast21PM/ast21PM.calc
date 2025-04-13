// Константы и инициализация
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const functionList = document.getElementById('functionList');
const functionButtons = document.getElementById('functionButtons');

// Проверка инициализации canvas
if (!canvas || !ctx) {
    console.error('Ошибка: canvas или контекст не инициализированы');
} else {
    console.log('Canvas инициализирован:', canvas.width, canvas.height);
}

let lastActiveInput = null;
let scale = 50; // Масштаб (пикселей на единицу)
let targetScale = scale;
let offsetX = 0; // Смещение по X
let offsetY = 0; // Смещение по Y
const initialState = { scale: 50, offsetX: 0, offsetY: 0 };

let isDragging = false;
let startX, startY;

// Устанавливаем размеры canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 20;
    console.log('Canvas resized:', canvas.width, canvas.height);
    drawGraph();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Функция для вычисления шага сетки
function getGridStep(scale) {
    const steps = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
    const pixelsPerUnit = scale;
    for (let step of steps) {
        if (pixelsPerUnit * step >= 30 && pixelsPerUnit * step <= 100) return step;
    }
    return 1;
}

// Рисуем оси и сетку
function drawAxes() {
    const xAxis = canvas.height / 2 + offsetY;
    const yAxis = canvas.width / 2 + offsetX;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log('Drawing axes:', xAxis, yAxis);

    // Сетка
    ctx.beginPath();
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    const gridStep = getGridStep(scale);
    const stepSize = gridStep * scale;

    const minX = Math.floor((-yAxis) / stepSize) * gridStep;
    const maxX = Math.ceil((canvas.width - yAxis) / stepSize) * gridStep;
    const minY = Math.floor((-xAxis) / stepSize) * gridStep;
    const maxY = Math.ceil((canvas.height - xAxis) / stepSize) * gridStep;

    for (let i = minX; i <= maxX; i += gridStep) {
        const x = yAxis + i * scale;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let i = minY; i <= maxY; i += gridStep) {
        const y = xAxis - i * scale;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // Оси
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1.5;
    ctx.moveTo(0, xAxis);
    ctx.lineTo(canvas.width, xAxis);
    ctx.moveTo(yAxis, 0);
    ctx.lineTo(yAxis, canvas.height);
    ctx.stroke();

    // Метки на осях
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = minX; i <= maxX; i += gridStep) {
        if (i === 0) continue;
        const x = yAxis + i * scale;
        ctx.fillText(i.toFixed(1), x, xAxis + 5);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = minY; i <= maxY; i += gridStep) {
        if (i === 0) continue;
        const y = xAxis - i * scale;
        ctx.fillText(i.toFixed(1), yAxis - 5, y);
    }

    // Обозначения осей
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('X', canvas.width - 10, xAxis - 5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Y', yAxis + 5, 10);
}

// Функция для вычисления факториала
function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
}

// Парсим выражение
function parseExpression(expr) {
    console.log('Parsing expression:', expr);
    // Удаляем "y =" из начала выражения
    expr = expr.replace(/^y\s*=\s*/, '');
    return expr.toLowerCase()
        .replace(/pi/g, 'Math.PI')
        .replace(/e(?!\^)/g, 'Math.E')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/cot/g, '(1/Math.tan)')
        .replace(/sinh/g, 'Math.sinh')
        .replace(/cosh/g, 'Math.cosh')
        .replace(/tanh/g, 'Math.tanh')
        .replace(/ln/g, 'Math.log')
        .replace(/log/g, 'Math.log10')
        .replace(/abs/g, 'Math.abs')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/e\^/g, 'Math.exp')
        .replace(/arcsin/g, 'Math.asin')
        .replace(/arccos/g, 'Math.acos')
        .replace(/arctan/g, 'Math.atan')
        .replace(/r=/g, '')
        .replace(/(\d+)!/g, (match, num) => factorial(parseInt(num)))
        .replace(/\^/g, '**');
}

// Определяем тип выражения
function getExpressionType(expr) {
    expr = expr.trim().toLowerCase();
    console.log('Expression type:', expr);
    if (expr.includes('{') && expr.includes('}')) {
        if (expr.includes('t')) return 'parametric';
        return 'piecewise';
    }
    if (expr.includes('=')) {
        if (expr.includes('r=')) return 'polar';
        if (expr.includes('x') && expr.includes('y') && !expr.startsWith('y')) return 'implicit';
        return 'explicit';
    }
    if (expr.includes('<') || expr.includes('>')) return 'inequality';
    if (expr.match(/^\(\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*\)$/)) return 'point';
    return 'explicit';
}

// Вычисляем значение функции
function evaluateFunction(funcStr, x, y = 0, t = 0) {
    try {
        let expr = parseExpression(funcStr);
        const type = getExpressionType(funcStr);
        console.log('Evaluating:', funcStr, 'Type:', type, 'x:', x);

        if (type === 'parametric') {
            const parts = expr.split(/,\s*/);
            const xExpr = parts[0].replace(/^{/, '').trim();
            const yExpr = parts[1].replace(/}$/, '').trim();
            const xVal = eval(`(function(t) { return ${xExpr}; })(${t})`);
            const yVal = eval(`(function(t) { return ${yExpr}; })(${t})`);
            return { x: xVal, y: yVal };
        }

        if (type === 'implicit') {
            const [left, right] = expr.split('=').map(s => s.trim());
            return { implicit: `${left} - (${right})` };
        }

        if (type === 'polar') {
            const r = eval(`(function(theta) { return ${expr}; })(${t})`);
            return { x: r * Math.cos(t), y: r * Math.sin(t) };
        }

        if (type === 'piecewise') {
            const parts = expr.replace(/[{}]/g, '').split(';');
            for (let part of parts) {
                const [condition, value] = part.split(':').map(s => s.trim());
                if (eval(`(function(x) { return ${condition}; })(${x})`)) {
                    return eval(`(function(x) { return ${value}; })(${x})`);
                }
            }
            return NaN;
        }

        if (type === 'point') {
            const [px, py] = expr.match(/-?\d+(\.\d+)?/g).map(Number);
            return { x: px, y: py };
        }

        // Для явных функций (explicit)
        const result = eval(`(function(x) { return ${expr}; })(${x})`);
        console.log('Evaluation result:', result);
        return Number.isFinite(result) ? result : NaN;
    } catch (e) {
        console.error('Ошибка в выражении:', funcStr, e);
        return NaN;
    }
}

// Преобразуем цвет из HEX в RGB
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r / 255, g / 255, b / 255, 1.0];
}

// Основная функция отрисовки графика
function drawGraph() {
    console.log('Drawing graph...');
    drawAxes();

    const functionInputs = document.querySelectorAll('.function-input');
    console.log('Function inputs:', functionInputs.length);
    if (functionInputs.length === 0) {
        console.warn('Нет функций для отрисовки');
        return;
    }

    functionInputs.forEach(input => {
        const funcStr = input.querySelector('input[type="text"]').value.trim();
        const color = input.querySelector('input[type="color"]').value;
        const rgbColor = hexToRgb(color);

        console.log('Function:', funcStr, 'Color:', color);
        if (!funcStr) {
            console.warn('Пустое выражение, пропускаем');
            return;
        }

        const xAxis = canvas.height / 2 + offsetY;
        const yAxis = canvas.width / 2 + offsetX;
        const step = Math.max(1 / scale, 0.01);

        const type = getExpressionType(funcStr);
        console.log('Function type:', type);

        switch (type) {
            case 'explicit':
                drawRegularFunction(funcStr, rgbColor, xAxis, yAxis, step);
                break;
            case 'implicit':
                drawImplicitFunction(funcStr, rgbColor, xAxis, yAxis, step);
                break;
            case 'parametric':
                drawParametricFunction(funcStr, rgbColor, xAxis, yAxis);
                break;
            case 'polar':
                drawPolarFunction(funcStr, rgbColor, xAxis, yAxis);
                break;
            case 'inequality':
                drawInequality(funcStr, rgbColor, xAxis, yAxis, step);
                break;
            case 'piecewise':
                drawPiecewiseFunction(funcStr, rgbColor, xAxis, yAxis, step);
                break;
            case 'point':
                drawPoint(funcStr, rgbColor, xAxis, yAxis);
                break;
            default:
                console.warn('Неизвестный тип функции:', type);
        }
    });
}

// Отрисовка явной функции (например, y = x^2)
function drawRegularFunction(funcStr, color, xAxis, yAxis, step) {
    console.log('Drawing regular function:', funcStr);
    const minX = (0 - yAxis) / scale;
    const maxX = (canvas.width - yAxis) / scale;
    let positions = [];

    // Вычисляем точки графика
    const optimizedStep = step * 2;
    for (let x = minX; x <= maxX; x += optimizedStep) {
        const y = evaluateFunction(funcStr, x);
        if (!Number.isFinite(y)) {
            console.warn('Invalid y value at x=', x, 'y=', y);
            continue;
        }
        positions.push(x, y);
    }

    console.log('Positions:', positions);
    if (positions.length === 0) {
        console.warn('Нет валидных точек для отрисовки');
        return;
    }

    // Рисуем график
    ctx.beginPath();
    ctx.strokeStyle = color.join ? `rgb(${color[0]*255},${color[1]*255},${color[2]*255})` : color;
    ctx.lineWidth = 3;
    let firstPoint = true;
    for (let i = 0; i < positions.length; i += 2) {
        const px = positions[i] * scale + yAxis;
        const py = xAxis - positions[i + 1] * scale; // Учитываем, что ось Y направлена вниз
        if (firstPoint) {
            ctx.moveTo(px, py);
            firstPoint = false;
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();
}

// Отрисовка неявной функции
function drawImplicitFunction(funcStr, color, xAxis, yAxis, step) {
    ctx.fillStyle = color.join ? `rgb(${color[0]*255},${color[1]*255},${color[2]*255})` : color;
    const minX = (0 - yAxis) / scale;
    const maxX = (canvas.width - yAxis) / scale;
    const minY = (0 - xAxis) / scale;
    const maxY = (canvas.height - xAxis) / scale;

    const optimizedStep = step * 4;
    for (let x = minX; x <= maxX; x += optimizedStep) {
        for (let y = minY; y <= maxY; y += optimizedStep) {
            const value = evaluateFunction(funcStr, x, y);
            if (Math.abs(value.implicit ? eval(value.implicit) : value) < 0.01) {
                const px = x * scale + yAxis;
                const py = xAxis - y * scale;
                ctx.fillRect(px, py, 2, 2);
            }
        }
    }
}

// Отрисовка параметрической функции
function drawParametricFunction(funcStr, color, xAxis, yAxis) {
    const tMin = -10;
    const tMax = 10;
    const tStep = 0.01;
    let positions = [];

    for (let t = tMin; t <= tMax; t += tStep) {
        const point = evaluateFunction(funcStr, 0, 0, t);
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
        positions.push(point.x, point.y);
    }

    ctx.beginPath();
    ctx.strokeStyle = color.join ? `rgb(${color[0]*255},${color[1]*255},${color[2]*255})` : color;
    ctx.lineWidth = 3;
    let firstPoint = true;
    for (let i = 0; i < positions.length; i += 2) {
        const px = positions[i] * scale + yAxis;
        const py = xAxis - positions[i + 1] * scale;
        if (firstPoint) {
            ctx.moveTo(px, py);
            firstPoint = false;
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();
}

// Отрисовка полярной функции
function drawPolarFunction(funcStr, color, xAxis, yAxis) {
    const thetaMin = 0;
    const thetaMax = 2 * Math.PI;
    const thetaStep = 0.01;
    let positions = [];

    for (let theta = thetaMin; theta <= thetaMax; theta += thetaStep) {
        const point = evaluateFunction(funcStr, 0, 0, theta);
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) continue;
        positions.push(point.x, point.y);
    }

    ctx.beginPath();
    ctx.strokeStyle = color.join ? `rgb(${color[0]*255},${color[1]*255},${color[2]*255})` : color;
    ctx.lineWidth = 3;
    let firstPoint = true;
    for (let i = 0; i < positions.length; i += 2) {
        const px = positions[i] * scale + yAxis;
        const py = xAxis - positions[i + 1] * scale;
        if (firstPoint) {
            ctx.moveTo(px, py);
            firstPoint = false;
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();
}

// Отрисовка неравенства
function drawInequality(funcStr, color, xAxis, yAxis, step) {
    ctx.fillStyle = color.join ? `rgba(${color[0]*255},${color[1]*255},${color[2]*255},0.3)` : color;
    const minX = (0 - yAxis) / scale;
    const maxX = (canvas.width - yAxis) / scale;
    const minY = (0 - xAxis) / scale;
    const maxY = (canvas.height - xAxis) / scale;

    const optimizedStep = step * 4;
    for (let x = minX; x <= maxX; x += optimizedStep) {
        for (let y = minY; y <= maxY; y += optimizedStep) {
            const value = evaluateFunction(funcStr, x, y);
            if (value) {
                const px = x * scale + yAxis;
                const py = xAxis - y * scale;
                ctx.fillRect(px, py, 2, 2);
            }
        }
    }
}

// Отрисовка кусочной функции
function drawPiecewiseFunction(funcStr, color, xAxis, yAxis, step) {
    const minX = (0 - yAxis) / scale;
    const maxX = (canvas.width - yAxis) / scale;
    let positions = [];

    const optimizedStep = step * 2;
    for (let x = minX; x <= maxX; x += optimizedStep) {
        const y = evaluateFunction(funcStr, x);
        if (!Number.isFinite(y)) continue;
        positions.push(x, y);
    }

    ctx.beginPath();
    ctx.strokeStyle = color.join ? `rgb(${color[0]*255},${color[1]*255},${color[2]*255})` : color;
    ctx.lineWidth = 3;
    let firstPoint = true;
    for (let i = 0; i < positions.length; i += 2) {
        const px = positions[i] * scale + yAxis;
        const py = xAxis - positions[i + 1] * scale;
        if (firstPoint) {
            ctx.moveTo(px, py);
            firstPoint = false;
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.stroke();
}

// Отрисовка точки
function drawPoint(funcStr, color, xAxis, yAxis) {
    const point = evaluateFunction(funcStr, 0);
    const px = point.x * scale + yAxis;
    const py = xAxis - point.y * scale;

    ctx.beginPath();
    ctx.fillStyle = color.join ? `rgb(${color[0]*255},${color[1]*255},${color[2]*255})` : color;
    ctx.arc(px, py, 5, 0, 2 * Math.PI);
    ctx.fill();
}

// Анимация масштабирования
function animateScale() {
    const diff = targetScale - scale;
    if (Math.abs(diff) > 0.1) {
        scale += diff * 0.2;
        drawGraph();
        requestAnimationFrame(animateScale);
    } else {
        scale = targetScale;
        drawGraph();
    }
}

// Функции управления масштабом
function zoomIn() {
    targetScale = Math.min(targetScale * 1.2, 1000);
    animateScale();
}

function zoomOut() {
    targetScale = Math.max(targetScale / 1.2, 5);
    animateScale();
}

function resetView() {
    targetScale = initialState.scale;
    offsetX = initialState.offsetX;
    offsetY = initialState.offsetY;
    animateScale();
}

// События для масштабирования и перемещения
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    targetScale = Math.max(5, Math.min(1000, targetScale * factor));
    animateScale();
});

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        offsetX += e.clientX - startX;
        offsetY += e.clientY - startY;
        startX = e.clientX;
        startY = e.clientY;
        drawGraph();
    }
});

canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

// Добавление новой функции
function addFunctionInput(defaultValue = 'y = x^2') {
    const functionDiv = document.createElement('div');
    functionDiv.className = 'function-input';
    functionDiv.innerHTML = `
        <input type="text" placeholder="Введите функцию (например, y = x^2)" value="${defaultValue}" oninput="drawGraph()" onfocus="showFunctionButtons(this)" onblur="hideFunctionButtons()">
        <input type="color" value="#ff0000" onchange="drawGraph()">
        <button onclick="removeFunctionInput(this)" class="remove-btn">✖</button>
    `;
    functionList.appendChild(functionDiv);
    console.log('Function input added:', defaultValue);
    drawGraph();
}

// Удаление функции
function removeFunctionInput(button) {
    button.parentElement.remove();
    drawGraph();
}

// Добавление символа в поле ввода
function appendToFunction(char) {
    if (lastActiveInput) {
        lastActiveInput.value += char;
        lastActiveInput.focus();
        drawGraph();
    }
}

// Очистка всех функций
function clearFunctions() {
    functionList.innerHTML = '';
    addFunctionInput();
    drawGraph();
}

// Перемещение курсора
function moveCursor(direction) {
    if (lastActiveInput) {
        const pos = lastActiveInput.selectionStart;
        if (direction === 'left' && pos > 0) lastActiveInput.setSelectionRange(pos - 1, pos - 1);
        else if (direction === 'right' && pos < lastActiveInput.value.length) lastActiveInput.setSelectionRange(pos + 1, pos + 1);
        lastActiveInput.focus();
    }
}

// Показ панели
function showPanel(panelName) {
    document.querySelectorAll('.panel').forEach(panel => panel.style.display = 'none');
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.querySelector(`.${panelName}-panel`).style.display = 'grid';
    document.querySelector(`button[onclick="showPanel('${panelName}')"]`).classList.add('active');
}

// Показ кнопок для ввода
function showFunctionButtons(input) {
    lastActiveInput = input;
    functionButtons.classList.add('visible');
}

// Скрытие кнопок
function hideFunctionButtons() {
    setTimeout(() => {
        if (!functionButtons.contains(document.activeElement) && document.activeElement.tagName !== 'INPUT') {
            functionButtons.classList.remove('visible');
        }
    }, 200);
}

// Переключение темы
function toggleTheme() {
    document.body.classList.toggle('light');
    document.querySelectorAll('.function-panel, .function-header, button, .tab-button, .nav-link')
        .forEach(el => el.classList.toggle('light'));
    drawGraph();
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    addFunctionInput('y = x^2');
    drawGraph();
});