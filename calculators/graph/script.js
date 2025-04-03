// Получаем элементы
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const functionList = document.getElementById('functionList');
const functionButtons = document.getElementById('functionButtons');

// Переменная для хранения последнего активного поля ввода
let lastActiveInput = null;

// Параметры графика
let scale = 50; // Масштаб (пикселей на единицу)
let targetScale = scale; // Целевой масштаб для анимации
let offsetX = 0; // Смещение по оси X
let offsetY = 0; // Смещение по оси Y
let scaleHistory = []; // История масштаба и смещений для кнопки "вернуться назад"

// Переменные для перемещения графика
let isDragging = false;
let startX, startY;

// Устанавливаем размеры канваса на весь экран
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log('Canvas resized to:', canvas.width, 'x', canvas.height); // Отладка
    drawGraph();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Сохранение текущего состояния масштаба и смещений
function saveState() {
    scaleHistory.push({ scale, offsetX, offsetY });
}

// Функция для очистки канваса и рисования осей
function drawAxes() {
    const xAxis = canvas.height / 2 + offsetY; // Учитываем смещение по Y
    const yAxis = canvas.width / 2 + offsetX;  // Учитываем смещение по X

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем сетку
    ctx.beginPath();
    ctx.strokeStyle = '#e0e0e0'; // Светло-серый цвет для сетки, как у Mathway
    ctx.lineWidth = 0.5;

    // Вертикальные линии сетки (каждые 5 единиц)
    const gridStep = 5; // Деления через каждые 5 единиц
    for (let i = Math.floor((-yAxis / scale) / gridStep) * gridStep; i <= Math.ceil((canvas.width - yAxis) / scale / gridStep) * gridStep; i += gridStep) {
        const x = yAxis + i * scale;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }

    // Горизонтальные линии сетки (каждые 5 единиц)
    for (let i = Math.floor((-xAxis / scale) / gridStep) * gridStep; i <= Math.ceil((canvas.height - xAxis) / scale / gridStep) * gridStep; i += gridStep) {
        const y = xAxis - i * scale;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();

    // Рисуем оси
    ctx.beginPath();
    ctx.strokeStyle = '#666'; // Серый цвет для осей
    ctx.lineWidth = 1.5;

    // Ось X
    ctx.moveTo(0, xAxis);
    ctx.lineTo(canvas.width, xAxis);
    ctx.stroke();

    // Ось Y
    ctx.moveTo(yAxis, 0);
    ctx.lineTo(yAxis, canvas.height);
    ctx.stroke();

    // Деления на осях
    ctx.font = '12px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Деления на оси X (каждые 5 единиц)
    for (let i = Math.floor((-yAxis / scale) / gridStep) * gridStep; i <= Math.ceil((canvas.width - yAxis) / scale / gridStep) * gridStep; i += gridStep) {
        const x = yAxis + i * scale;
        ctx.beginPath();
        ctx.moveTo(x, xAxis - 5);
        ctx.lineTo(x, xAxis + 5);
        ctx.stroke();
        if (i !== 0) {
            ctx.fillText(i, x, xAxis + 20);
        }
    }

    // Деления на оси Y (каждые 5 единиц)
    for (let i = Math.floor((-xAxis / scale) / gridStep) * gridStep; i <= Math.ceil((canvas.height - xAxis) / scale / gridStep) * gridStep; i += gridStep) {
        const y = xAxis - i * scale;
        ctx.beginPath();
        ctx.moveTo(yAxis - 5, y);
        ctx.lineTo(yAxis + 5, y);
        ctx.stroke();
        if (i !== 0) {
            ctx.fillText(i, yAxis - 25, y);
        }
    }
    console.log('Axes drawn');
}

// Функция для вычисления факториала
function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
}

// Функция для парсинга и вычисления значения функции
function evaluateFunction(funcStr, x) {
    try {
        let expr = funcStr.replace(/pi/g, 'Math.PI')
                         .replace(/e(?!\^)/g, 'Math.E')
                         .replace(/sin/g, 'Math.sin')
                         .replace(/cos/g, 'Math.cos')
                         .replace(/tan/g, 'Math.tan')
                         .replace(/cot/g, '(1/Math.tan)')
                         .replace(/ln/g, 'Math.log')
                         .replace(/log/g, 'Math.log10')
                         .replace(/abs/g, 'Math.abs')
                         .replace(/sqrt/g, 'Math.sqrt')
                         .replace(/e\^/g, 'Math.exp')
                         .replace(/arcsin/g, 'Math.asin')
                         .replace(/arccos/g, 'Math.acos')
                         .replace(/arctan/g, 'Math.atan')
                         .replace(/(\d+)!/g, (match, num) => factorial(parseInt(num)))
                         .replace(/\^/g, '**');

        expr = expr.replace(/y\s*=\s*/, '');

        const result = eval(`(function(x) { return ${expr}; })(${x})`);
        if (isNaN(result) || !isFinite(result)) {
            console.warn(`Invalid result for x=${x} in expression "${expr}": ${result}`);
            return NaN;
        }
        return result;
    } catch (e) {
        console.error('Ошибка в выражении:', funcStr, e);
        return NaN;
    }
}

// Функция для рисования графика
function drawGraph() {
    console.log('Drawing graph...');
    drawAxes();

    const functionInputs = document.querySelectorAll('.function-input');
    console.log('Function inputs found:', functionInputs.length);

    functionInputs.forEach(input => {
        const funcStr = input.querySelector('input[type="text"]').value.trim();
        const color = input.querySelector('input[type="color"]').value;

        console.log('Processing function:', funcStr, 'with color:', color);

        if (funcStr) {
            const xAxis = canvas.height / 2 + offsetY;
            const yAxis = canvas.width / 2 + offsetX;

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;

            let firstPoint = true;
            for (let px = 0; px < canvas.width; px++) {
                const x = (px - yAxis) / scale;
                const y = evaluateFunction(funcStr, x);
                if (isNaN(y) || !isFinite(y)) continue;

                const py = xAxis - y * scale;
                if (firstPoint) {
                    ctx.moveTo(px, py);
                    firstPoint = false;
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.stroke();
            console.log('Graph drawn for:', funcStr);
        }
    });
}

// Анимация масштабирования
function animateScale() {
    const diff = targetScale - scale;
    if (Math.abs(diff) > 0.1) {
        scale += diff * 0.1; // Плавное приближение к целевому масштабу
        drawGraph();
        requestAnimationFrame(animateScale);
    } else {
        scale = targetScale; // Устанавливаем точное значение
        drawGraph();
    }
}

// Функции для управления масштабом
function zoomIn() {
    saveState();
    targetScale *= 1.2; // Увеличиваем целевой масштаб
    requestAnimationFrame(animateScale);
}

function zoomOut() {
    saveState();
    targetScale /= 1.2; // Уменьшаем целевой масштаб
    requestAnimationFrame(animateScale);
}

function resetView() {
    if (scaleHistory.length > 0) {
        const lastState = scaleHistory.pop();
        targetScale = lastState.scale;
        offsetX = lastState.offsetX;
        offsetY = lastState.offsetY;
    } else {
        targetScale = 50; // Исходный масштаб
        offsetX = 0;
        offsetY = 0;
    }
    requestAnimationFrame(animateScale);
}

// Масштабирование колесом мыши
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    saveState();
    if (e.deltaY < 0) {
        targetScale *= 1.1; // Приближение
    } else {
        targetScale /= 1.1; // Отдаление
    }
    requestAnimationFrame(animateScale);
});

// Перемещение графика мышью
canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        offsetX += dx;
        offsetY += dy;
        startX = e.clientX;
        startY = e.clientY;
        drawGraph();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
});

// Функция для добавления нового поля ввода функции
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

// Функции для работы с вводом
function appendToFunction(char) {
    if (lastActiveInput && lastActiveInput.tagName === 'INPUT' && lastActiveInput.type === 'text') {
        lastActiveInput.value += char;
        lastActiveInput.focus();
        drawGraph();
    }
}

function clearFunctions() {
    functionList.innerHTML = '';
    addFunctionInput();
    drawGraph();
}

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

// Функция переключения панелей
function showPanel(panelName) {
    document.querySelectorAll('.panel').forEach(panel => panel.style.display = 'none');
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.querySelector(`.${panelName}-panel`).style.display = 'grid';
    document.querySelector(`button[onclick="showPanel('${panelName}')"]`).classList.add('active');
}

// Функция для показа панели кнопок
function showFunctionButtons(input) {
    lastActiveInput = input;
    functionButtons.classList.add('visible');
}

// Функция для скрытия панели кнопок
function hideFunctionButtons() {
    setTimeout(() => {
        const isFocusInsidePanel = functionButtons.contains(document.activeElement);
        if (!isFocusInsidePanel && document.activeElement.tagName !== 'INPUT') {
            functionButtons.classList.remove('visible');
        }
    }, 200);
}

functionButtons.addEventListener('mousedown', (e) => {
    e.preventDefault();
});

// Функция переключения темы
function toggleTheme() {
    document.body.classList.toggle('light');
    document.querySelectorAll('.function-panel, .function-header, button, .tab-button, .nav-link')
        .forEach(el => el.classList.toggle('light'));
    drawGraph();
}

// Инициализация
addFunctionInput('y = x');
drawGraph();