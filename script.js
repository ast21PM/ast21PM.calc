let display = document.getElementById('display');
let advancedPanel = document.querySelector('.advanced-panel');
let calculator = document.querySelector('.calculator');

function append(value) {
    if (/[\d+\-*/.()πi]/.test(value)) {
        display.value += value;
    }
}

function clearDisplay() {
    display.value = '';
}

function calculate(operation) {
    let expression = display.value;
    let result;

    try {
        if (operation === '=') {
            expression = expression.replace(/π/g, Math.PI).replace(/i/g, 'i');
            result = eval(expression);
        } else {
            let input = parseFloat(expression.replace(/π/g, Math.PI)) || 0;
            switch (operation) {
                case 'square': result = input * input; break;
                case 'sqrt': result = Math.sqrt(input); break;
                case 'nthRoot':
                    let n = prompt("Введите степень корня:");
                    result = Math.pow(input, 1 / parseFloat(n)) || 0;
                    break;
                case 'sin': result = Math.sin(toRadians(input)); break;
                case 'cos': result = Math.cos(toRadians(input)); break;
                case 'tan': result = Math.tan(toRadians(input)); break;
                case 'cot': result = 1 / Math.tan(toRadians(input)) || 0; break;
                case 'asin': result = toDegrees(Math.asin(input)); break;
                case 'acos': result = toDegrees(Math.acos(input)); break;
                default: result = 'Ошибка';
            }
        }
        display.value = isNaN(result) || !isFinite(result) ? 'Ошибка' : result;
    } catch (error) {
        display.value = 'Ошибка';
    }
}

function toggleAdvanced() {
    if (advancedPanel.style.display === 'none' || advancedPanel.style.display === '') {
        advancedPanel.style.display = 'grid';
        document.querySelector('.function-panel').style.display = 'none';
        calculator.classList.add('expanded'); // Расширяем калькулятор
    } else {
        advancedPanel.style.display = 'none';
        document.querySelector('.function-panel').style.display = 'grid';
        calculator.classList.remove('expanded'); // Уменьшаем калькулятор
    }
}

// Фикс дублирования цифр и работы Backspace
display.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        calculate('=');
    } else if (event.key === 'Backspace' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        return; // Позволяем стандартное поведение
    } else if (!/[0-9+\-*/.()πi]/.test(event.key)) {
        event.preventDefault(); // Блокируем ненужные символы
    }
});

// Конвертация градусов и радиан
function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function toDegrees(radians) {
    return radians * 180 / Math.PI;
}