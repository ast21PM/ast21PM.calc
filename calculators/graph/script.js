// Функции для прелоадера
const loadingTexts = [
    'Инициализация построителя графиков...',
    'Подготовка математических функций...',
    'Настройка интерфейса...',
    'Почти готово...'
];

function updateLoadingText(index) {
    if (index >= loadingTexts.length) return;
    
    const detail = document.querySelector('.loading-details .detail');
    detail.style.opacity = '0';
    
    setTimeout(() => {
        detail.textContent = loadingTexts[index];
        detail.style.opacity = '1';
        
        setTimeout(() => {
            updateLoadingText(index + 1);
        }, 500);
    }, 500);
}

function hidePreloader() {
    const preloader = document.querySelector('.preloader');
    preloader.classList.add('fade-out');
    setTimeout(() => {
        preloader.style.display = 'none';
    }, 500);
}

// Функция инициализации построителя графиков
function initializeGraphBuilder() {
    // Инициализация всех необходимых компонентов
    setupEventListeners();
    setupPlotlyDefaults();
    clearGraph();
    
    // Проверяем сохраненную тему
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        toggleTheme();
        document.querySelector('.switch input').checked = true;
    }
}

// Модифицируем window.onload
window.onload = function() {
    // Запускаем анимацию загрузки
    updateLoadingText(0);
    
    // Имитируем загрузку
    setTimeout(() => {
        try {
            // Инициализируем построитель графиков
            initializeGraphBuilder();
        } catch (error) {
            console.error('Error during initialization:', error);
        } finally {
            // Скрываем прелоадер в любом случае
            hidePreloader();
        }
    }, 2000);
};

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
let lastFunctions = []; // Сохраняем последние функции для оптимизации
let debounceTimer = null; // Таймер для debounce
let lastWheelTime = 0;
const WHEEL_THROTTLE = 16; // Уменьшаем до 16мс для более плавного масштабирования

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
    ctx.strokeStyle = document.body.classList.contains('light') ? '#e0e0e0' : '#3d3d54';
    ctx.lineWidth = 0.5;

    const gridStep = getGridStep(scale);
    const stepSize = gridStep * scale;

    const minX = Math.floor((-yAxis) / stepSize) * gridStep;
    const maxX = Math.ceil((canvas.width - yAxis) / stepSize) * gridStep;
    const minY = Math.floor((-xAxis) / stepSize) * gridStep;
    const maxY = Math.ceil((canvas.height - xAxis) / stepSize) * gridStep;

    for (let i = minY; i <= maxY; i += gridStep) {
        const y = xAxis - i * scale;
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }

    for (let i = minX; i <= maxX; i += gridStep) {
        const x = yAxis + i * scale;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    ctx.stroke();

    // Оси
    ctx.beginPath();
    ctx.strokeStyle = document.body.classList.contains('light') ? '#333' : '#666';
    ctx.lineWidth = 1.5;
    ctx.moveTo(0, xAxis);
    ctx.lineTo(canvas.width, xAxis);
    ctx.moveTo(yAxis, 0);
    ctx.lineTo(yAxis, canvas.height);
    ctx.stroke();

    // Подписи осей
    ctx.font = '12px Arial';
    ctx.fillStyle = document.body.classList.contains('light') ? '#666' : '#aaa';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

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

// Парсинг функции
function parseFunction(funcStr) {
    let originalExpr = funcStr.trim().toLowerCase();
    let expr;

    // Удаляем "y =" для явных функций
    if (originalExpr.startsWith('y =')) {
        originalExpr = originalExpr.replace('y =', '').trim();
    }

    if (originalExpr.includes('=')) {
        const parts = originalExpr.split('=');
        if (parts.length === 2) {
            let left = parts[0].trim();
            let right = parts[1].trim();
            if (left.includes('y') || right.includes('y')) {
                // Неявная функция: f(x,y) = g(x,y)
                expr = `(${left}) - (${right})`;
                expr = processExpr(expr);
                try {
                    const func = new Function('x', 'y', `return ${expr};`);
                    return { type: 'implicit', evaluator: func };
                } catch (e) {
                    console.error('Ошибка парсинга неявной функции:', e);
                    return { type: 'error', message: 'Неверное выражение' };
                }
            } else {
                return { type: 'error', message: 'Неверное выражение' };
            }
        } else {
            return { type: 'error', message: 'Неверное выражение' };
        }
    } else {
        if (originalExpr.includes('y')) {
            // Неявная функция: f(x,y) = 0
            expr = originalExpr;
            expr = processExpr(expr);
            try {
                const func = new Function('x', 'y', `return ${expr};`);
                return { type: 'implicit', evaluator: func };
            } catch (e) {
                console.error('Ошибка парсинга неявной функции:', e);
                return { type: 'error', message: 'Неверное выражение' };
            }
        } else {
            // Явная функция: y = f(x)
            expr = originalExpr;
            expr = processExpr(expr);
            try {
                const func = new Function('x', `return ${expr};`);
                const domain = getFunctionDomain(originalExpr);
                return { type: 'explicit', evaluator: func, domain };
            } catch (e) {
                console.error('Ошибка парсинга явной функции:', e);
                return { type: 'error', message: 'Неверное выражение' };
            }
        }
    }
}

function processExpr(expr) {
    // Обрабатываем e^x корректно
    expr = expr.replace(/e\^x/g, 'Math.exp(x)')
               .replace(/e\^(\([^)]+\))/g, 'Math.exp$1')
               .replace(/pi/g, 'Math.PI')
               .replace(/e\b/g, 'Math.E') // Обрабатываем e как константу
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
               .replace(/arcsin/g, 'Math.asin')
               .replace(/arccos/g, 'Math.acos')
               .replace(/arctan/g, 'Math.atan')
               .replace(/(\d+)!/g, (match, num) => factorial(parseInt(num)))
               .replace(/\^/g, '**');
    return expr;
}

// Определение области определения функции
function getFunctionDomain(expr) {
    if (expr.includes('ln') || expr.includes('log')) {
        return { min: 0.0001, max: Infinity }; // ln(x) и log(x) определены для x > 0
    }
    return { min: -Infinity, max: Infinity }; // По умолчанию вся числовая ось
}

// Отрисовка графика
function drawGraph(forceRedraw = false, isScaling = false) {
    const currentTime = Date.now();
    
    // Применяем троттлинг при перетаскивании или масштабировании
    if ((isDragging || isScaling) && !forceRedraw && currentTime - lastDrawTime < DRAW_THROTTLE) {
        if (!animationFrame) {
            animationFrame = requestAnimationFrame(() => {
                drawGraph(false, isScaling);
                animationFrame = null;
            });
        }
        return;
    }
    
    lastDrawTime = currentTime;
    drawAxes();
    
    // Получаем текущие функции
    const functionInputs = document.querySelectorAll('.function-input');
    const currentFunctions = Array.from(functionInputs).map(input => {
        return {
            funcStr: input.querySelector('input[type="text"]').value.trim(),
            color: input.querySelector('input[type="color"]').value
        };
    });
    
    // Если функции не изменились и мы просто перетаскиваем график или масштабируем, используем оптимизированную отрисовку
    const functionsChanged = JSON.stringify(currentFunctions) !== JSON.stringify(lastFunctions);
    
    if (!functionsChanged && (isDragging || isScaling) && !forceRedraw) {
        // Оптимизированная отрисовка при перетаскивании или масштабировании
        currentFunctions.forEach(({ funcStr, color }) => {
            if (!funcStr) return;
            const parsed = parseFunction(funcStr);
            if (parsed.type === 'error') {
                console.error(parsed.message);
                return;
            }
            
            if (parsed.type === 'explicit') {
                drawExplicitFunctionOptimized(parsed.evaluator, parsed.domain, color);
            } else if (parsed.type === 'implicit') {
                drawImplicitFunctionOptimized(parsed.evaluator, color);
            }
        });
    } else {
        // Полная отрисовка при изменении функций или других случаях
        currentFunctions.forEach(({ funcStr, color }) => {
            if (!funcStr) return;
            const parsed = parseFunction(funcStr);
            if (parsed.type === 'error') {
                console.error(parsed.message);
                return;
            }
            
            if (parsed.type === 'explicit') {
                drawExplicitFunction(parsed.evaluator, parsed.domain, color);
            } else if (parsed.type === 'implicit') {
                drawImplicitFunction(parsed.evaluator, color);
            }
        });
        
        // Сохраняем текущие функции
        lastFunctions = currentFunctions;
    }
}

function drawExplicitFunction(evaluator, domain, color) {
    const xAxis = canvas.height / 2 + offsetY;
    const yAxis = canvas.width / 2 + offsetX;
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Определяем диапазон x в координатах canvas
    const minXCanvas = (-yAxis) / scale;
    const maxXCanvas = (canvas.width - yAxis) / scale;
    const minX = Math.max(domain.min, minXCanvas);
    const maxX = Math.min(domain.max, maxXCanvas);
    const step = 0.01 / scale; // Очень маленький шаг для точности

    let firstPoint = true;
    let previousY = null;

    for (let x = minX; x <= maxX; x += step) {
        let y;
        try {
            y = evaluator(x);
            if (!Number.isFinite(y) || Math.abs(y) > 1e6) {
                firstPoint = true;
                previousY = null;
                continue;
            }
        } catch (e) {
            console.warn(`Ошибка вычисления для x=${x}:`, e);
            firstPoint = true;
            previousY = null;
            continue;
        }

        const px = yAxis + x * scale;
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
}

function drawImplicitFunction(evaluator, color) {
    // Выбираем размер сетки в зависимости от масштаба
    const gridStepPixels = 10;
    const yAxis = canvas.width / 2 + offsetX;
    const xAxis = canvas.height / 2 + offsetY;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // Рассчитываем видимую область графика
    const minXCanvas = Math.floor((-yAxis) / scale);
    const maxXCanvas = Math.ceil((canvas.width - yAxis) / scale);
    const minYCanvas = Math.floor((-xAxis) / scale);
    const maxYCanvas = Math.ceil((canvas.height - xAxis) / scale);
    
    for (let px = 0; px < canvas.width; px += gridStepPixels) {
        for (let py = 0; py < canvas.height; py += gridStepPixels) {
            const x0 = (px - yAxis) / scale;
            const y0 = (xAxis - py) / scale;
            const x1 = (px + gridStepPixels - yAxis) / scale;
            const y1 = (xAxis - (py + gridStepPixels)) / scale;
            
            // Пропускаем расчеты за пределами видимой области
            if (x0 < minXCanvas - 1 || x0 > maxXCanvas + 1 || 
                y0 < minYCanvas - 1 || y0 > maxYCanvas + 1) {
                continue;
            }
            
            const f00 = evaluator(x0, y0);
            const f10 = evaluator(x1, y0);
            const f01 = evaluator(x0, y1);
            const f11 = evaluator(x1, y1);
            
            if (isNaN(f00) || isNaN(f10) || isNaN(f01) || isNaN(f11)) continue;
            
            const config = (f00 < 0 ? 1 : 0) + (f10 < 0 ? 2 : 0) + (f01 < 0 ? 4 : 0) + (f11 < 0 ? 8 : 0);
            drawMarchingSquare(config, px, py, gridStepPixels, f00, f10, f01, f11);
        }
    }
}

function drawMarchingSquare(config, px, py, step, f00, f10, f01, f11) {
    const edges = [];
    if ((f00 < 0) !== (f01 < 0)) {
        const t = f00 / (f00 - f01);
        edges.push({x: px, y: py + t * step});
    }
    if ((f10 < 0) !== (f11 < 0)) {
        const t = f10 / (f10 - f11);
        edges.push({x: px + step, y: py + t * step});
    }
    if ((f00 < 0) !== (f10 < 0)) {
        const t = f00 / (f00 - f10);
        edges.push({x: px + t * step, y: py});
    }
    if ((f01 < 0) !== (f11 < 0)) {
        const t = f01 / (f01 - f11);
        edges.push({x: px + t * step, y: py + step});
    }
    if (edges.length === 2) {
        ctx.beginPath();
        ctx.moveTo(edges[0].x, edges[0].y);
        ctx.lineTo(edges[1].x, edges[1].y);
        ctx.stroke();
    } else if (edges.length === 4) {
        ctx.beginPath();
        ctx.moveTo(edges[0].x, edges[0].y);
        ctx.lineTo(edges[1].x, edges[1].y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(edges[2].x, edges[2].y);
        ctx.lineTo(edges[3].x, edges[3].y);
        ctx.stroke();
    }
}

// Функция для добавления примера
function addExample(funcStr) {
    addFunctionInput(funcStr);
}

// Функция для добавления поля ввода функции с дебаунсингом
function addFunctionInput(defaultValue = 'y = x') {
    const functionDiv = document.createElement('div');
    functionDiv.className = 'function-input';
    functionDiv.innerHTML = `
        <input type="text" placeholder="Введите функцию (например, y = x + 1)" value="${defaultValue}" oninput="debouncedDrawGraph()" onfocus="showFunctionButtons(this)" onblur="hideFunctionButtons()">
        <input type="color" value="#${Math.floor(Math.random()*16777215).toString(16)}" onchange="drawGraph()">
        <button onclick="removeFunctionInput(this)" class="remove-btn">✖</button>
    `;
    functionList.appendChild(functionDiv);
    drawGraph();
}

// Функция для удаления поля ввода функции с оптимизацией
function removeFunctionInput(button) {
    button.parentElement.remove();
    // Форсируем перерисовку после удаления функции
    setTimeout(() => {
        drawGraph(true);
    }, 0);
}

// Функция для добавления символа в поле ввода с дебаунсингом
function appendToFunction(char) {
    if (lastActiveInput && lastActiveInput.tagName === 'INPUT' && lastActiveInput.type === 'text') {
        lastActiveInput.value += char;
        lastActiveInput.focus();
        debouncedDrawGraph();
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
    document.body.classList.toggle('light');
    drawGraph();
    
    // Сохраняем выбранную тему в localStorage
    const isLightTheme = document.body.classList.contains('light');
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
}

// Функция для анимации масштаба c оптимизацией
function animateScale() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    
    const animate = () => {
        const diff = targetScale - scale;
        if (Math.abs(diff) > 0.1) {
            // Более плавное изменение масштаба
            scale += diff * 0.15;
            // Используем оптимизированный рендеринг во время анимации масштаба
            drawGraph(false, true);
            animationFrame = requestAnimationFrame(animate);
        } else {
            scale = targetScale;
            // Финальная отрисовка с полным качеством
            drawGraph(true);
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

// Функция для центрирования вида (сброс смещения без изменения масштаба)
function centerView() {
    offsetX = initialState.offsetX;
    offsetY = initialState.offsetY;
    drawGraph(true);
}

// Обработчики событий мыши с оптимизацией
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
    // Форсируем высококачественную перерисовку после завершения перетаскивания
    setTimeout(() => {
        drawGraph(true);
    }, 0);
});

canvas.addEventListener('mouseleave', () => {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'grab';
        // Форсируем высококачественную перерисовку после завершения перетаскивания
        setTimeout(() => {
            drawGraph(true);
        }, 0);
    }
});

// Обработчик колесика мыши с троттлингом
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    
    const currentTime = Date.now();
    if (currentTime - lastWheelTime < WHEEL_THROTTLE) {
        return;
    }
    lastWheelTime = currentTime;
    
    // Упрощенное масштабирование без сложных вычислений смещения
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    
    // Если уже находимся в процессе масштабирования, просто меняем targetScale
    if (animationFrame) {
        targetScale = Math.max(5, Math.min(1000, targetScale * factor));
        return;
    }
    
    targetScale = Math.max(5, Math.min(1000, scale * factor));
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

// Функция для дебаунсинга отрисовки графика при вводе
function debouncedDrawGraph() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        drawGraph(true);
    }, 300);
}

// Оптимизированная функция отрисовки явных функций при перетаскивании
function drawExplicitFunctionOptimized(evaluator, domain, color) {
    const xAxis = canvas.height / 2 + offsetY;
    const yAxis = canvas.width / 2 + offsetX;
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Определяем диапазон x в координатах canvas
    const minXCanvas = (-yAxis) / scale;
    const maxXCanvas = (canvas.width - yAxis) / scale;
    const minX = Math.max(domain.min, minXCanvas);
    const maxX = Math.min(domain.max, maxXCanvas);
    
    // Увеличиваем шаг при перетаскивании для повышения производительности
    const step = 0.5 / scale;
    
    let firstPoint = true;
    let previousY = null;

    for (let x = minX; x <= maxX; x += step) {
        let y;
        try {
            y = evaluator(x);
            if (!Number.isFinite(y) || Math.abs(y) > 1e6) {
                firstPoint = true;
                previousY = null;
                continue;
            }
        } catch (e) {
            firstPoint = true;
            previousY = null;
            continue;
        }

        const px = yAxis + x * scale;
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
}

// Оптимизированная функция отрисовки неявных функций при перетаскивании
function drawImplicitFunctionOptimized(evaluator, color) {
    // Подстраиваем шаг сетки в зависимости от масштаба
    let gridStepPixels;
    
    if (scale < 20) {
        gridStepPixels = 15; // Меньше шаг при большом отдалении
    } else if (scale < 50) {
        gridStepPixels = 20;
    } else {
        gridStepPixels = 25;
    }
    
    const yAxis = canvas.width / 2 + offsetX;
    const xAxis = canvas.height / 2 + offsetY;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    // Рассчитываем видимую область графика
    const minXCanvas = Math.floor((-yAxis) / scale);
    const maxXCanvas = Math.ceil((canvas.width - yAxis) / scale);
    const minYCanvas = Math.floor((-xAxis) / scale);
    const maxYCanvas = Math.ceil((canvas.height - xAxis) / scale);
    
    for (let px = 0; px < canvas.width; px += gridStepPixels) {
        for (let py = 0; py < canvas.height; py += gridStepPixels) {
            const x0 = (px - yAxis) / scale;
            const y0 = (xAxis - py) / scale;
            
            // Пропускаем расчеты за пределами видимой области
            if (x0 < minXCanvas - 1 || x0 > maxXCanvas + 1 || 
                y0 < minYCanvas - 1 || y0 > maxYCanvas + 1) {
                continue;
            }
            
            const x1 = (px + gridStepPixels - yAxis) / scale;
            const y1 = (xAxis - (py + gridStepPixels)) / scale;
            
            const f00 = evaluator(x0, y0);
            const f10 = evaluator(x1, y0);
            const f01 = evaluator(x0, y1);
            const f11 = evaluator(x1, y1);
            
            if (isNaN(f00) || isNaN(f10) || isNaN(f01) || isNaN(f11)) continue;
            
            const config = (f00 < 0 ? 1 : 0) + (f10 < 0 ? 2 : 0) + (f01 < 0 ? 4 : 0) + (f11 < 0 ? 8 : 0);
            drawMarchingSquare(config, px, py, gridStepPixels, f00, f10, f01, f11);
        }
    }
}

// Инициализация
window.addEventListener('load', () => {
    addFunctionInput('y = x');
    drawGraph();
    
    // Загружаем сохраненную тему
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.querySelector('.switch input').checked = true;
        document.body.classList.add('light');
        drawGraph();
    }
});