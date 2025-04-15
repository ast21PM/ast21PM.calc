const canvas = document.getElementById('graphCanvas');
let gl = null;
let useWebGL = true;

try {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) throw new Error('WebGL not supported');
} catch (e) {
    console.warn('WebGL не поддерживается, используется 2D Canvas:', e);
    useWebGL = false;
}

const ctx = useWebGL ? null : canvas.getContext('2d');
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

// WebGL шейдеры и программа
let program, positionLocation, resolutionLocation, colorLocation, scaleLocation, offsetLocation, positionBuffer;

if (useWebGL) {
    const vertexShaderSource = `
        attribute vec2 a_position;
        uniform vec2 u_resolution;
        uniform float u_scale;
        uniform vec2 u_offset;
        void main() {
            vec2 position = (a_position * u_scale) + u_offset;
            vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        }
    `;

    const fragmentShaderSource = `
        precision mediump float;
        uniform vec4 u_color;
        void main() {
            gl_FragColor = u_color;
        }
    `;

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

    function createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Ошибка связывания программы:', gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) {
        useWebGL = false;
    } else {
        program = createProgram(gl, vertexShader, fragmentShader);
        if (!program) {
            useWebGL = false;
        } else {
            positionLocation = gl.getAttribLocation(program, 'a_position');
            resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
            colorLocation = gl.getUniformLocation(program, 'u_color');
            scaleLocation = gl.getUniformLocation(program, 'u_scale');
            offsetLocation = gl.getUniformLocation(program, 'u_offset');
            positionBuffer = gl.createBuffer();
        }
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 20; // Уменьшено для предотвращения перекрытия
    if (useWebGL && gl) {
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    drawGraph();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function getGridStep(scale) {
    const steps = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
    const pixelsPerUnit = scale;
    for (let step of steps) {
        if (pixelsPerUnit * step >= 30 && pixelsPerUnit * step <= 100) return step;
    }
    return 1;
}

function drawAxes() {
    if (useWebGL && gl) {
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const xAxis = canvas.height / 2 + offsetY;
        const yAxis = canvas.width / 2 + offsetX;
        const gridStep = getGridStep(scale);
        const stepSize = gridStep * scale;

        const minX = Math.floor((-yAxis) / stepSize) * gridStep;
        const maxX = Math.ceil((canvas.width - yAxis) / stepSize) * gridStep;
        const minY = Math.floor((-xAxis) / stepSize) * gridStep;
        const maxY = Math.ceil((canvas.height - xAxis) / stepSize) * gridStep;

        let positions = [];
        for (let i = minX; i <= maxX; i += gridStep) {
            const x = (i * scale) + yAxis;
            positions.push(x, 0, x, canvas.height);
        }
        for (let i = minY; i <= maxY; i += gridStep) {
            const y = xAxis - (i * scale);
            positions.push(0, y, canvas.width, y);
        }
        drawLines(positions, [0.88, 0.88, 0.88, 1.0]);

        positions = [0, xAxis, canvas.width, xAxis, yAxis, 0, yAxis, canvas.height];
        drawLines(positions, [0.4, 0.4, 0.4, 1.0]);
    } else if (ctx) {
        const xAxis = canvas.height / 2 + offsetY;
        const yAxis = canvas.width / 2 + offsetX;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

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

        ctx.beginPath();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1.5;
        ctx.moveTo(0, xAxis);
        ctx.lineTo(canvas.width, xAxis);
        ctx.moveTo(yAxis, 0);
        ctx.lineTo(yAxis, canvas.height);
        ctx.stroke();
    }
}

function drawLines(positions, color) {
    if (!useWebGL || !gl) return;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1f(scaleLocation, 1.0);
    gl.uniform2f(offsetLocation, 0, 0);
    gl.uniform4fv(colorLocation, color);

    gl.drawArrays(gl.LINES, 0, positions.length / 2);
}

function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
}

function parseExpression(expr) {
    return expr.toLowerCase()
        .replace(/pi/g, 'Math.PI')
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
}

function evaluateFunction(funcStr, x, t = 0) {
    try {
        let expr = parseExpression(funcStr);
        if (expr.includes('{')) {
            const parts = expr.split(/,\s*/);
            const xExpr = parts[0].replace(/^{/, '').trim();
            const yExpr = parts[1].replace(/}$/, '').trim();
            const xVal = eval(`(function(x, t) { return ${xExpr}; })(${x}, ${t})`);
            const yVal = eval(`(function(x, t) { return ${yExpr}; })(${x}, ${t})`);
            return { x: xVal, y: yVal };
        }
        if (expr.includes('=')) {
            const [left, right] = expr.split('=').map(s => s.trim());
            if (left.includes('x') && left.includes('y')) {
                return { implicit: `${left} - (${right})` };
            } else {
                expr = left.includes('y') ? `${left} - (${right})` : right;
            }
        }
        const result = eval(`(function(x, t) { return ${expr}; })(${x}, ${t})`);
        return Number.isFinite(result) ? result : NaN;
    } catch (e) {
        console.warn('Ошибка в выражении:', funcStr, e);
        return NaN;
    }
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, 1.0];
}

function drawGraph() {
    drawAxes();
    const functionInputs = document.querySelectorAll('.function-input');
    functionInputs.forEach(input => {
        const funcStr = input.querySelector('input[type="text"]').value.trim();
        const color = input.querySelector('input[type="color"]').value;
        const rgbColor = hexToRgb(color);

        if (!funcStr) return;

        const xAxis = canvas.height / 2 + offsetY;
        const yAxis = canvas.width / 2 + offsetX;
        const step = Math.max(1 / scale, 0.005);

        const evaluation = evaluateFunction(funcStr, 0);
        if (typeof evaluation === 'object' && evaluation.implicit) {
            drawImplicitFunction(funcStr, rgbColor, xAxis, yAxis, step);
        } else if (typeof evaluation === 'object' && evaluation.x !== undefined) {
            drawParametricFunction(funcStr, rgbColor, xAxis, yAxis);
        } else if (funcStr.includes('<') || funcStr.includes('>')) {
            drawInequality(funcStr, rgbColor, xAxis, yAxis, step);
        } else {
            drawRegularFunction(funcStr, rgbColor, xAxis, yAxis, step);
        }
    });
}

function drawRegularFunction(funcStr, color, xAxis, yAxis, step) {
    const minX = (0 - yAxis) / scale;
    const maxX = (canvas.width - yAxis) / scale;
    let positions = [];

    for (let x = minX; x <= maxX; x += step) {
        const y = evaluateFunction(funcStr, x);
        if (!Number.isFinite(y)) continue;
        positions.push(x, -y);
    }

    if (useWebGL && gl) {
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.uniform1f(scaleLocation, scale);
        gl.uniform2f(offsetLocation, yAxis, xAxis);
        gl.uniform4fv(colorLocation, color);

        gl.drawArrays(gl.LINE_STRIP, 0, positions.length / 2);
    } else if (ctx) {
        ctx.beginPath();
        ctx.strokeStyle = color.join ? `rgb(${color[0]*255},${color[1]*255},${color[2]*255})` : color;
        ctx.lineWidth = 2;
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
}

// Остальные функции (drawParametricFunction, drawImplicitFunction, drawInequality) оставлены без изменений для краткости

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

function zoomIn() { targetScale = Math.min(targetScale * 1.2, 1000); animateScale(); }
function zoomOut() { targetScale = Math.max(targetScale / 1.2, 5); animateScale(); }
function resetView() { targetScale = initialState.scale; offsetX = initialState.offsetX; offsetY = initialState.offsetY; animateScale(); }

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    targetScale = Math.max(5, Math.min(1000, targetScale * factor));
    animateScale();
});

canvas.addEventListener('mousedown', (e) => { isDragging = true; startX = e.clientX; startY = e.clientY; });
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

function addFunctionInput(defaultValue = 'y = x') {
    const functionDiv = document.createElement('div');
    functionDiv.className = 'function-input';
    functionDiv.innerHTML = `
        <input type="text" placeholder="Введите функцию (например, y = x^2)" value="${defaultValue}" oninput="drawGraph()" onfocus="showFunctionButtons(this)" onblur="hideFunctionButtons()">
        <input type="color" value="#${Math.floor(Math.random()*16777215).toString(16)}" onchange="drawGraph()">
        <button onclick="removeFunctionInput(this)" class="remove-btn">✖</button>
    `;
    functionList.appendChild(functionDiv);
    drawGraph();
}

function removeFunctionInput(button) { button.parentElement.remove(); drawGraph(); }
function appendToFunction(char) { if (lastActiveInput) { lastActiveInput.value += char; lastActiveInput.focus(); drawGraph(); } }
function clearFunctions() { functionList.innerHTML = ''; addFunctionInput(); drawGraph(); }
function moveCursor(direction) {
    if (lastActiveInput) {
        const pos = lastActiveInput.selectionStart;
        if (direction === 'left' && pos > 0) lastActiveInput.setSelectionRange(pos - 1, pos - 1);
        else if (direction === 'right' && pos < lastActiveInput.value.length) lastActiveInput.setSelectionRange(pos + 1, pos + 1);
        lastActiveInput.focus();
    }
}

function showPanel(panelName) {
    document.querySelectorAll('.panel').forEach(panel => panel.style.display = 'none');
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.querySelector(`.${panelName}-panel`).style.display = 'grid';
    document.querySelector(`button[onclick="showPanel('${panelName}')"]`).classList.add('active');
}

function showFunctionButtons(input) { lastActiveInput = input; functionButtons.classList.add('visible'); }
function hideFunctionButtons() {
    setTimeout(() => {
        if (!functionButtons.contains(document.activeElement) && document.activeElement.tagName !== 'INPUT') {
            functionButtons.classList.remove('visible');
        }
    }, 200);
}

function toggleTheme() {
    document.body.classList.toggle('light');
    document.querySelectorAll('.function-panel, .function-header, button, .tab-button, .nav-link')
        .forEach(el => el.classList.toggle('light'));
    drawGraph();
}

addFunctionInput('y = x^2');
drawGraph();
styles.css - /* Стили для тела страницы */
body {
    margin: 0;
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #1a1a2e, #2d2d44);
    transition: background 0.3s ease;
    overflow: hidden;
}