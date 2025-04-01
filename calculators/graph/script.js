// Получаем элементы
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
const functionList = document.getElementById('functionList');

// Устанавливаем размеры канваса
canvas.width = 600;
canvas.height = 400;

// Параметры графика
const scale = 20; // Масштаб (пикселей на единицу)
const xAxis = canvas.height / 2; // Положение оси X
const yAxis = canvas.width / 2; // Положение оси Y

// Функция для очистки канваса и рисования осей
function drawAxes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем оси
    ctx.beginPath();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;

    // Ось X
    ctx.moveTo(0, xAxis);
    ctx.lineTo(canvas.width, xAxis);
    ctx.stroke();

    // Ось Y
    ctx.moveTo(yAxis, 0);
    ctx.lineTo(yAxis, canvas.height);
    ctx.stroke();

    // Деления на осях
    ctx.font = '10px Arial';
    ctx.fillStyle = '#000';
    for (let i = -yAxis / scale; i <= yAxis / scale; i++) {
        const x = yAxis + i * scale;
        ctx.moveTo(x, xAxis - 5);
        ctx.lineTo(x, xAxis + 5);
        ctx.stroke();
        if (i !== 0) ctx.fillText(i, x - 5, xAxis + 15);
    }
    for (let i = -xAxis / scale; i <= xAxis / scale; i++) {
        const y = xAxis - i * scale;
        ctx.moveTo(yAxis - 5, y);
        ctx.lineTo(yAxis + 5, y);
        ctx.stroke();
        if (i !== 0) ctx.fillText(i, yAxis - 15, y + 5);
    }
}

// Функция для парсинга и вычисления значения функции
function evaluateFunction(funcStr, x) {
    try {
        // Заменяем математические константы и функции
        let expr = funcStr.replace(/pi/g, Math.PI)
                         .replace(/e/g, Math.E)
                         .replace(/sin/g, 'Math.sin')
                         .replace(/cos/g, 'Math.cos')
                         .replace(/tan/g, 'Math.tan')
                         .replace(/cot/g, '1/Math.tan')
                         .replace(/ln/g, 'Math.log')
                         .replace(/log/g, 'Math.log10')
                         .replace(/abs/g, 'Math.abs')
                         .replace(/sqrt/g, 'Math.sqrt')
                         .replace(/\^/g, '**');

        // Убираем "y =" из начала строки, если есть
        expr = expr.replace(/y\s*=\s*/, '');

        // Подставляем значение x
        return eval(expr);
    } catch (e) {
        console.error('Ошибка в выражении:', e);
        return NaN;
    }
}

// Функция для рисования графика
function drawGraph() {
    drawAxes();

    // Получаем все поля ввода функций
    const functionInputs = document.querySelectorAll('.function-input');
    functionInputs.forEach(input => {
        const funcStr = input.querySelector('input[type="text"]').value.trim();
        const color = input.querySelector('input[type="color"]').value;

        if (funcStr) {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            let firstPoint = true;
            for (let px = 0; px < canvas.width; px++) {
                const x = (px - yAxis) / scale; // Переводим пиксели в координаты x
                const y = evaluateFunction(funcStr, x);
                if (isNaN(y)) continue;

                const py = xAxis - y * scale; // Переводим y в пиксели
                if (firstPoint) {
                    ctx.moveTo(px, py);
                    firstPoint = false;
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.stroke();
        }
    });
}

// Функция для добавления нового поля ввода функции
function addFunctionInput() {
    const functionDiv = document.createElement('div');
    functionDiv.className = 'function-input';
    functionDiv.innerHTML = `
        <input type="text" placeholder="Введите функцию (например, y = x + 1)" oninput="drawGraph()">
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
    const activeInput = document.activeElement;
    if (activeInput.tagName === 'INPUT' && activeInput.type === 'text') {
        activeInput.value += char;
        drawGraph();
    }
}

function clearFunctions() {
    functionList.innerHTML = '';
    addFunctionInput(); // Добавляем одно пустое поле после очистки
    drawGraph();
}

function moveCursor(direction) {
    const activeInput = document.activeElement;
    if (activeInput.tagName === 'INPUT' && activeInput.type === 'text') {
        const pos = activeInput.selectionStart;
        if (direction === 'left' && pos > 0) {
            activeInput.setSelectionRange(pos - 1, pos - 1);
        } else if (direction === 'right' && pos < activeInput.value.length) {
            activeInput.setSelectionRange(pos + 1, pos + 1);
        }
    }
}

// Функция переключения панелей
function showPanel(panelName) {
    document.querySelectorAll('.panel').forEach(panel => panel.style.display = 'none');
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.querySelector(`.${panelName}-panel`).style.display = 'grid';
    document.querySelector(`button[onclick="showPanel('${panelName}')"]`).classList.add('active');
}

// Функция переключения темы
function toggleTheme() {
    document.body.classList.toggle('light');
    document.querySelectorAll('.calculator, .calculator-header, button, .tab-button, .nav-link, .resize-handle')
        .forEach(el => el.classList.toggle('light'));
}

// Инициализация: добавляем одно поле ввода по умолчанию
addFunctionInput();
drawGraph();