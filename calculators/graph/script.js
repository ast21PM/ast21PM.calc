const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const functionList = document.getElementById('functionList');
const functionButtons = document.getElementById('functionButtons');

let lastActiveInput = null;
let scale = 50;
let targetScale = scale;
let offsetX = 0;
let offsetY = 0;
const initialState = { scale: 50, offsetX: 0, offsetY: 0 };

let isDragging = false;
let startX, startY;
let animationFrame = null;
let lastDrawTime = 0;
const DRAW_THROTTLE = 16; // ~60fps

// Инициализация canvas
function initCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawGraph();
}

// Обработчик изменения размера окна
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawGraph();
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', initCanvas);

// Функция для определения шага сетки
function getGridStep(scale) {
    const steps = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
    const pixelsPerUnit = scale;
    
    for (let step of steps) {
        const pixelsPerStep = step * pixelsPerUnit;
        if (pixelsPerStep >= 30 && pixelsPerStep <= 100) {
            return step;
        }
    }
    return scale > 500 ? 0.01 : 100;
}

// Отрисовка осей и сетки
function drawAxes() {
    const xAxis = canvas.height / 2 + offsetY;
    const yAxis = canvas.width / 2 + offsetX;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Сетка
    ctx.beginPath();
    ctx.strokeStyle = document.body.classList.contains('dark') ? '#3d3d54' : '#e0e0e0';
    ctx.lineWidth = 0.5;

    const gridStep = getGridStep(scale);
    const stepSize = gridStep * scale;

    // Вычисляем границы для отрисовки сетки
    const minX = Math.floor((-yAxis) / stepSize) * gridStep;
    const maxX = Math.ceil((canvas.width - yAxis) / stepSize) * gridStep;
    const minY = Math.floor((-xAxis) / stepSize) * gridStep;
    const maxY = Math.ceil((canvas.height - xAxis) / stepSize) * gridStep;

    // Горизонтальные линии сетки
    for (let i = minY; i <= maxY; i += gridStep) {
        const y = xAxis - i * scale;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }

    // Вертикальные линии сетки
    for (let i = minX; i <= maxX; i += gridStep) {
        const x = yAxis + i * scale;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    ctx.stroke();

    // Оси
    ctx.beginPath();
    ctx.strokeStyle = document.body.classList.contains('dark') ? '#666' : '#333';
    ctx.lineWidth = 1.5;
    ctx.moveTo(0, xAxis);
    ctx.lineTo(canvas.width, xAxis);
    ctx.moveTo(yAxis, 0);
    ctx.lineTo(yAxis, canvas.height);
    ctx.stroke();

    // Подписи осей
    ctx.font = '12px Arial';
    ctx.fillStyle = document.body.classList.contains('dark') ? '#aaa' : '#666';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Подписи на оси X
    for (let i = minX; i <= maxX; i += gridStep) {
        if (Math.abs(i) < gridStep / 2) continue;
        const x = yAxis + i * scale;
        ctx.beginPath();
        ctx.moveTo(x, xAxis - 5);
        ctx.lineTo(x, xAxis + 5);
        ctx.stroke();

        const label = Number.isInteger(i) ? i.toString() : i.toFixed(2);
        ctx.fillText(label, x, xAxis + 15);
    }

    // Подписи на оси Y
    for (let i = minY; i <= maxY; i += gridStep) {
        if (Math.abs(i) < gridStep / 2) continue;
        const y = xAxis - i * scale;
        ctx.beginPath();
        ctx.moveTo(yAxis - 5, y);
        ctx.lineTo(yAxis + 5, y);
        ctx.stroke();

        const label = Number.isInteger(i) ? i.toString() : i.toFixed(2);
        ctx.textAlign = 'right';
        ctx.fillText(label, yAxis - 10, y);
    }
}

// Функция для вычисления факториала
function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
}

// Функция для вычисления значения функции
function evaluateFunction(funcStr, x) {
    try {
        let expr = funcStr.toLowerCase()
            .replace(/pi/g, 'Math.PI')
            .replace(/e(?!\^)/g, 'Math.E')
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/cot/g, '(1/Math.tan)')
            .replace(/sec/g, '(1/Math.cos)')
            .replace(/csc/g, '(1/Math.sin)')
            .replace(/ln/g, 'Math.log')
            .replace(/log/g, 'Math.log10')
            .replace(/abs/g, 'Math.abs')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/e\^/g, 'Math.exp')
            .replace(/arcsin/g, 'Math.asin')
            .replace(/arccos/g, 'Math.acos')
            .replace(/arctan/g, 'Math.atan')
            .replace(/(\d+)!/g, (match, num) => factorial(parseInt(num)))
            .replace(/\^/g, '**')
            .replace(/y\s*=\s*/, '');

        // Проверяем, является ли функция неявной (содержит y)
        if (expr.includes('y')) {
            // Для неявных функций (например, x^2 + y^2 = 1)
            // Решаем уравнение относительно y
            const parts = expr.split('=');
            if (parts.length === 2) {
                const leftSide = parts[0].trim();
                const rightSide = parts[1].trim();
                expr = `${rightSide} - (${leftSide})`;
            }
        }

        const result = eval(`(function(x) { return ${expr}; })(${x})`);
        return Number.isFinite(result) ? result : NaN;
    } catch (e) {
        console.error('Ошибка в выражении:', funcStr, e);
        return NaN;
    }
}

// Отрисовка графика
function drawGraph() {
    drawAxes();
    const functionInputs = document.querySelectorAll('.function-input');
    
    functionInputs.forEach(input => {
        const funcStr = input.querySelector('input[type="text"]').value.trim();
        const color = input.querySelector('input[type="color"]').value;

        if (!funcStr) return;

        const xAxis = canvas.height / 2 + offsetY;
        const yAxis = canvas.width / 2 + offsetX;
        
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        const step = Math.max(1, Math.floor(1 / scale * 50));
        let previousY = null;
        let firstPoint = true;

        for (let px = 0; px < canvas.width; px += step) {
            const x = (px - yAxis) / scale;
            const y = evaluateFunction(funcStr, x);
            
            if (!Number.isFinite(y)) {
                firstPoint = true;
                continue;
            }

            const py = xAxis - y * scale;
            
            if (firstPoint) {
                ctx.moveTo(px, py);
                firstPoint = false;
            } else if (previousY !== null && Math.abs(py - previousY) < canvas.height) {
                ctx.lineTo(px, py);
            } else {
                ctx.moveTo(px, py);
            }
            previousY = py;
        }
        ctx.stroke();
    });
}

// Функция для добавления примера
function addExample(funcStr) {
    addFunctionInput(funcStr);
}

// Функция для добавления поля ввода функции
function addFunctionInput(defaultValue = 'y = x') {
    const functionDiv = document.createElement('div');
    functionDiv.className = 'function-input';
    functionDiv.innerHTML = `
        <input type="text" placeholder="Введите функцию (например, y = x + 1)" value="${defaultValue}" oninput="drawGraph()" onfocus="showFunctionButtons(this)" onblur="hideFunctionButtons()">
        <input type="color" value="#${Math.floor(Math.random()*16777215).toString(16)}" onchange="drawGraph()">
        <button onclick="removeFunctionInput(this)" class="remove-btn">✖</button>
    `;
    functionList.appendChild(functionDiv);
    drawGraph();
}

// Функция для удаления поля ввода функции
function removeFunctionInput(button) {
    button.parentElement.remove();
    drawGraph();
}

// Функция для добавления символа в поле ввода
function appendToFunction(char) {
    if (lastActiveInput && lastActiveInput.tagName === 'INPUT' && lastActiveInput.type === 'text') {
        lastActiveInput.value += char;
        lastActiveInput.focus();
        drawGraph();
    }
}

// Функция для очистки всех функций
function clearFunctions() {
    functionList.innerHTML = '';
    addFunctionInput();
    drawGraph();
}

// Функция для перемещения курсора
function moveCursor(direction) {
    if (lastActiveInput && lastActiveInput.tagName === 'INPUT' && lastActiveInput.type === 'text') {
        const pos = lastActiveInput.selectionStart;
        if (direction === 'left' && pos > 0) {
            lastActiveInput.setSelectionRange(pos - 1, pos - 1);
        } else if (direction === 'right' && pos < lastActiveInput.value.length) {
            lastActiveInput.setSelectionRange(pos + 1, pos + 1);
        }
        lastActiveInput.focus();
    }
}

// Функция для переключения панели
function showPanel(panelName) {
    document.querySelectorAll('.panel').forEach(panel => panel.style.display = 'none');
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.querySelector(`.${panelName}-panel`).style.display = 'grid';
    document.querySelector(`button[onclick="showPanel('${panelName}')"]`).classList.add('active');
}

// Функция для показа кнопок функций
function showFunctionButtons(input) {
    lastActiveInput = input;
    functionButtons.classList.add('visible');
}

// Функция для скрытия кнопок функций
function hideFunctionButtons() {
    setTimeout(() => {
        const isFocusInsidePanel = functionButtons.contains(document.activeElement);
        if (!isFocusInsidePanel && document.activeElement.tagName !== 'INPUT') {
            functionButtons.classList.remove('visible');
        }
    }, 200);
}

// Функция для переключения темы
function toggleTheme() {
    document.body.classList.toggle('dark');
    drawGraph();
}

// Функция для анимации масштаба
function animateScale() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    
    const animate = () => {
        const diff = targetScale - scale;
        if (Math.abs(diff) > 0.1) {
            scale += diff * 0.2;
            drawGraph();
            animationFrame = requestAnimationFrame(animate);
        } else {
            scale = targetScale;
            drawGraph();
            animationFrame = null;
        }
    };
    animationFrame = requestAnimationFrame(animate);
}

// Функции масштабирования
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

// Обработчики событий мыши
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    canvas.style.cursor = 'grabbing';
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

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    canvas.style.cursor = 'grab';
});

// Обработчик колесика мыши
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    targetScale = Math.max(5, Math.min(1000, targetScale * factor));
    animateScale();
});

// Обработчики touch-событий
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isDragging = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isDragging) {
        offsetX += e.touches[0].clientX - startX;
        offsetY += e.touches[0].clientY - startY;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        drawGraph();
    }
});

canvas.addEventListener('touchend', () => isDragging = false);
canvas.addEventListener('touchcancel', () => isDragging = false);

// Инициализация
addFunctionInput('y = x');
drawGraph();