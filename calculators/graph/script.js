// Получаем элементы
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const functionList = document.getElementById('functionList');
const functionButtons = document.getElementById('functionButtons');

// Переменная для хранения последнего активного поля ввода
let lastActiveInput = null;

// Параметры графика
const scale = 50; // Масштаб (пикселей на единицу) - увеличим масштаб для более редких делений

// Устанавливаем размеры канваса на весь экран
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log('Canvas resized to:', canvas.width, 'x', canvas.height); // Отладка
    drawGraph();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Функция для очистки канваса и рисования осей
function drawAxes() {
    const xAxis = canvas.height / 2; // Локальная переменная
    const yAxis = canvas.width / 2;  // Локальная переменная

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем сетку
    ctx.beginPath();
    ctx.strokeStyle = '#e0e0e0'; // Серый цвет для сетки
    ctx.lineWidth = 0.5;

    // Вертикальные линии сетки
    for (let i = -yAxis / scale; i <= yAxis / scale; i++) {
        const x = yAxis + i * scale;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }

    // Горизонтальные линии сетки
    for (let i = -xAxis / scale; i <= xAxis / scale; i++) {
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
    ctx.font = '12px Arial'; // Увеличим шрифт
    ctx.fillStyle = '#333'; // Темно-серый цвет для меток
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Деления на оси X
    for (let i = -yAxis / scale; i <= yAxis / scale; i++) {
        if (i % 1 !== 0) continue; // Пропускаем, чтобы деления были реже (каждую 1 единицу)
        const x = yAxis + i * scale;
        ctx.beginPath();
        ctx.moveTo(x, xAxis - 5);
        ctx.lineTo(x, xAxis + 5);
        ctx.stroke();
        if (i !== 0) {
            ctx.fillText(i, x, xAxis + 20); // Смещаем метки ниже оси
        }
    }

    // Деления на оси Y
    for (let i = -xAxis / scale; i <= xAxis / scale; i++) {
        if (i % 1 !== 0) continue; // Пропускаем, чтобы деления были реже (каждую 1 единицу)
        const y = xAxis - i * scale;
        ctx.beginPath();
        ctx.moveTo(yAxis - 5, y);
        ctx.lineTo(yAxis + 5, y);
        ctx.stroke();
        if (i !== 0) {
            ctx.fillText(i, yAxis - 25, y); // Смещаем метки левее оси
        }
    }
    console.log('Axes drawn'); // Отладка
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
        // Заменяем математические константы и функции
        let expr = funcStr.replace(/pi/g, 'Math.PI')
                         .replace(/e(?!\^)/g, 'Math.E') // e как константа, но не e^
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

        // Убираем "y =" из начала строки, если есть
        expr = expr.replace(/y\s*=\s*/, '');

        // Подставляем значение x
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
    console.log('Drawing graph...'); // Отладка
    drawAxes();

    // Получаем все поля ввода функций
    const functionInputs = document.querySelectorAll('.function-input');
    console.log('Function inputs found:', functionInputs.length); // Отладка

    functionInputs.forEach(input => {
        const funcStr = input.querySelector('input[type="text"]').value.trim();
        const color = input.querySelector('input[type="color"]').value;

        console.log('Processing function:', funcStr, 'with color:', color); // Отладка

        if (funcStr) {
            const xAxis = canvas.height / 2; // Локальная переменная для рисования графика
            const yAxis = canvas.width / 2;  // Локальная переменная для рисования графика

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5; // Увеличим толщину линии графика

            let firstPoint = true;
            for (let px = 0; px < canvas.width; px++) {
                const x = (px - yAxis) / scale; // Переводим пиксели в координаты x
                const y = evaluateFunction(funcStr, x);
                if (isNaN(y) || !isFinite(y)) continue;

                const py = xAxis - y * scale; // Переводим y в пиксели
                if (firstPoint) {
                    ctx.moveTo(px, py);
                    firstPoint = false;
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.stroke();
            console.log('Graph drawn for:', funcStr); // Отладка
        }
    });
}

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
        lastActiveInput.focus(); // Возвращаем фокус на поле ввода
        drawGraph();
    }
}

function clearFunctions() {
    functionList.innerHTML = '';
    addFunctionInput(); // Добавляем одно пустое поле после очистки
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
        lastActiveInput.focus(); // Возвращаем фокус
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
    lastActiveInput = input; // Сохраняем последнее активное поле ввода
    functionButtons.classList.add('visible');
}

// Функция для скрытия панели кнопок
function hideFunctionButtons() {
    setTimeout(() => {
        // Проверяем, находится ли фокус внутри панели кнопок
        const isFocusInsidePanel = functionButtons.contains(document.activeElement);
        if (!isFocusInsidePanel && document.activeElement.tagName !== 'INPUT') {
            functionButtons.classList.remove('visible');
        }
    }, 200);
}

// Предотвращаем скрытие панели при клике внутри неё
functionButtons.addEventListener('mousedown', (e) => {
    e.preventDefault(); // Предотвращаем потерю фокуса
});

// Функция переключения темы
function toggleTheme() {
    document.body.classList.toggle('light');
    document.querySelectorAll('.function-panel, .function-header, button, .tab-button, .nav-link')
        .forEach(el => el.classList.toggle('light'));
    drawGraph(); // Перерисовываем график при смене темы
}

// Инициализация: добавляем одно поле ввода с тестовым выражением
addFunctionInput('y = x'); // Добавляем тестовое выражение по умолчанию
drawGraph();