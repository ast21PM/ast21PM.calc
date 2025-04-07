
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


function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawGraph();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();


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


function drawAxes() {
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


    ctx.font = '12px Arial';
    ctx.fillStyle = '#333';
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
        ctx.fillText(label, yAxis - 20, y);
    }
}


function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
}


function evaluateFunction(funcStr, x) {
    try {
        let expr = funcStr.toLowerCase()
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
            .replace(/\^/g, '**')
            .replace(/y\s*=\s*/, '');

        const result = eval(`(function(x) { return ${expr}; })(${x})`);
        return Number.isFinite(result) ? result : NaN;
    } catch (e) {
        console.error('Ошибка в выражении:', funcStr, e);
        return NaN;
    }
}


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


let animationFrameId = null;
function animateScale() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    const animate = () => {
        const diff = targetScale - scale;
        if (Math.abs(diff) > 0.1) {
            scale += diff * 0.2;
            drawGraph();
            animationFrameId = requestAnimationFrame(animate);
        } else {
            scale = targetScale;
            drawGraph();
            animationFrameId = null;
        }
    };
    animationFrameId = requestAnimationFrame(animate);
}


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

function removeFunctionInput(button) {
    button.parentElement.remove();
    drawGraph();
}

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

function showPanel(panelName) {
    document.querySelectorAll('.panel').forEach(panel => panel.style.display = 'none');
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.querySelector(`.${panelName}-panel`).style.display = 'grid';
    document.querySelector(`button[onclick="showPanel('${panelName}')"]`).classList.add('active');
}

function showFunctionButtons(input) {
    lastActiveInput = input;
    functionButtons.classList.add('visible');
}

function hideFunctionButtons() {
    setTimeout(() => {
        const isFocusInsidePanel = functionButtons.contains(document.activeElement);
        if (!isFocusInsidePanel && document.activeElement.tagName !== 'INPUT') {
            functionButtons.classList.remove('visible');
        }
    }, 200);
}

functionButtons.addEventListener('mousedown', (e) => e.preventDefault());

function toggleTheme() {
    document.body.classList.toggle('light');
    document.querySelectorAll('.function-panel, .function-header, button, .tab-button, .nav-link')
        .forEach(el => el.classList.toggle('light'));
    drawGraph();
}

// Инициализация
addFunctionInput('y = x');
drawGraph();
