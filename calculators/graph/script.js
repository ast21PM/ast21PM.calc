// Инициализация WebGL
const canvas = document.getElementById('graphCanvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert('Ваш браузер не поддерживает WebGL.');
}

// Установка размеров canvas
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Настройка WebGL
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(1.0, 1.0, 1.0, 1.0); // Белый фон
gl.clear(gl.COLOR_BUFFER_BIT);

// Шейдеры
const vertexShaderSource = `
    attribute vec2 a_position;
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); // Синий цвет для графика
    }
`;

// Создание шейдеров
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Ошибка компиляции шейдера:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// Создание программы
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Ошибка линковки программы:', gl.getProgramInfoLog(program));
}

gl.useProgram(program);

// Получение позиции атрибута
const positionLocation = gl.getAttribLocation(program, 'a_position');

// Создание буфера
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// Переменная для отслеживания режима abc
let isAlphaMode = false;

// Функция для переключения темы
function toggleTheme() {
    document.body.classList.toggle('light');
    document.querySelector('.control-panel').classList.toggle('light');
    document.querySelector('.input-wrapper').classList.toggle('light');
    document.querySelector('.input-label').classList.toggle('light');
    document.querySelector('#display').classList.toggle('light');
    document.querySelectorAll('button').forEach(button => button.classList.toggle('light'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('light'));
}

// Функция для переключения режима abc
function toggleAlpha() {
    isAlphaMode = !isAlphaMode;
    const alphaBtn = document.querySelector('.alpha-btn');
    alphaBtn.textContent = isAlphaMode ? '123' : 'abc';
    // Здесь можно добавить логику для изменения отображаемых кнопок, если нужно
}

// Функция для добавления символов в поле ввода
function append(value) {
    const display = document.getElementById('display');
    display.value += value;
    display.focus();
}

// Функция очистки поля ввода
function clearDisplay() {
    const display = document.getElementById('display');
    display.value = '';
    display.focus();
    gl.clear(gl.COLOR_BUFFER_BIT); // Очистка графика
    drawGrid();
    drawAxes(); // Перерисовка осей
}

// Функция перемещения курсора
function moveCursor(direction) {
    const display = document.getElementById('display');
    const cursorPos = display.selectionStart;
    if (direction === 'left' && cursorPos > 0) {
        display.setSelectionRange(cursorPos - 1, cursorPos - 1);
    } else if (direction === 'right' && cursorPos < display.value.length) {
        display.setSelectionRange(cursorPos + 1, cursorPos + 1);
    }
    display.focus();
}

// Функция удаления последнего символа
function deleteLast() {
    const display = document.getElementById('display');
    display.value = display.value.slice(0, -1);
    display.focus();
}

// Функция для построения графика
function drawGraph() {
    const display = document.getElementById('display');
    let expression = display.value;

    // Парсинг уравнения
    let func;
    try {
        const node = math.parse(expression);
        func = node.compile();
    } catch (error) {
        alert('Ошибка в уравнении: ' + error.message);
        return;
    }

    // Очистка canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Отрисовка осей и сетки
    drawGrid();
    drawAxes();

    // Массив точек для графика
    const points = [];
    const scaleX = 2 * Math.PI / canvas.width; // Масштаб по X (от -π до π)
    const scaleY = 4 / canvas.height; // Масштаб по Y (от -2 до 2)

    for (let pixelX = 0; pixelX < canvas.width; pixelX++) {
        const x = (pixelX - canvas.width / 2) * scaleX; // Преобразование пикселей в координаты
        try {
            const y = func.evaluate({ x: x });
            const pixelY = canvas.height / 2 - y / scaleY; // Преобразование Y в пиксели
            points.push((pixelX / canvas.width) * 2 - 1); // Нормализация X
            points.push((pixelY / canvas.height) * 2 - 1); // Нормализация Y
        } catch (error) {
            continue; // Пропускаем точки, где функция не определена
        }
    }

    // Передача точек в буфер
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

    // Настройка атрибута
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Отрисовка графика
    gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);
}

// Функция для отрисовки сетки (квадратов)
function drawGrid() {
    const gridPoints = [];
    const scaleX = 2 * Math.PI / canvas.width; // Масштаб по X
    const scaleY = 4 / canvas.height; // Масштаб по Y
    const stepX = Math.PI / 3; // Шаг по X (π/3)
    const stepY = 1; // Шаг по Y (1)

    // Вертикальные линии
    for (let x = -Math.PI; x <= Math.PI; x += stepX) {
        const pixelX = (x / scaleX + canvas.width / 2) / canvas.width * 2 - 1;
        gridPoints.push(pixelX);
        gridPoints.push(-1); // От низа
        gridPoints.push(pixelX);
        gridPoints.push(1); // До верха
    }

    // Горизонтальные линии
    for (let y = -2; y <= 2; y += stepY) {
        const pixelY = (canvas.height / 2 - y / scaleY) / canvas.height * 2 - 1;
        gridPoints.push(-1); // От левого края
        gridPoints.push(pixelY);
        gridPoints.push(1); // До правого края
        gridPoints.push(pixelY);
    }

    // Установка серого цвета для сетки
    const fragmentShaderSourceGrid = `
        precision mediump float;
        void main() {
            gl_FragColor = vec4(0.8, 0.8, 0.8, 1.0); // Серый цвет для сетки
        }
    `;
    const fragmentShaderGrid = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceGrid);
    const programGrid = gl.createProgram();
    gl.attachShader(programGrid, vertexShader);
    gl.attachShader(programGrid, fragmentShaderGrid);
    gl.linkProgram(programGrid);
    gl.useProgram(programGrid);

    const positionLocationGrid = gl.getAttribLocation(programGrid, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridPoints), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocationGrid);
    gl.vertexAttribPointer(positionLocationGrid, 2, gl.FLOAT, false, 0, 0);

    // Отрисовка сетки
    gl.drawArrays(gl.LINES, 0, gridPoints.length / 2);

    // Возвращаем программу для графика
    gl.useProgram(program);
}

// Функция для отрисовки осей координат
function drawAxes() {
    const axisPoints = [];

    // Ось X (горизонтальная линия через центр)
    for (let pixelX = 0; pixelX < canvas.width; pixelX++) {
        const x = (pixelX / canvas.width) * 2 - 1;
        const y = 0; // Центр по Y
        axisPoints.push(x);
        axisPoints.push(y);
    }

    // Ось Y (вертикальная линия через центр)
    for (let pixelY = 0; pixelY < canvas.height; pixelY++) {
        const x = 0; // Центр по X
        const y = (pixelY / canvas.height) * 2 - 1;
        axisPoints.push(x);
        axisPoints.push(-y);
    }

    // Установка черного цвета для осей
    const fragmentShaderSourceAxis = `
        precision mediump float;
        void main() {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Черный цвет для осей
        }
    `;
    const fragmentShaderAxis = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceAxis);
    const programAxis = gl.createProgram();
    gl.attachShader(programAxis, vertexShader);
    gl.attachShader(programAxis, fragmentShaderAxis);
    gl.linkProgram(programAxis);
    gl.useProgram(programAxis);

    const positionLocationAxis = gl.getAttribLocation(programAxis, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(axisPoints), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocationAxis);
    gl.vertexAttribPointer(positionLocationAxis, 2, gl.FLOAT, false, 0, 0);

    // Отрисовка осей
    gl.drawArrays(gl.LINES, 0, axisPoints.length / 2);

    // Возвращаем программу для графика
    gl.useProgram(program);
}

// Отрисовка сетки и осей при загрузке страницы
drawGrid();
drawAxes();