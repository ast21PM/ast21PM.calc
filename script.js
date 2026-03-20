let display = document.getElementById('display');
let calculator = document.getElementById('calculator');
let themeToggle = document.getElementById('themeToggle');
let resizeHandle = document.getElementById('resizeHandle');

const DEFAULT_WIDTH = 650;
const DEFAULT_HEIGHT = 550;

let history = [];

// Добавление символов в поле ввода
function append(value) {
    display.value += value;
}

// Очистка поля ввода
function clearDisplay() {
    display.value = '';
}

// Удаление последнего символа
function backspace() {
    display.value = display.value.slice(0, -1);
}

// Форматирование числа
function formatNumber(number) {
    if (typeof number === 'number') {
        let formatted = math.format(number, { precision: 14, notation: 'auto' });
        // Убираем лишние нули после запятой, если они есть
        return formatted.replace(/(?:\.0+|(\.\d+?)0+)$/, '$1');
    }
    return number.toString();
}

// Вычисление выражения
function calculate(operation) {
    let expression = display.value.trim();
    
    if (expression === '') {
        return;
    }

    try {
        if (operation === '=') {
            // Заменяем специальные символы на их эквиваленты в Math.js
            let parseExpr = expression
                .replace(/π/g, 'pi')
                .replace(/\^2/g, '^2')
                .replace(/%/g, '/100');

            // Проверка на деление на ноль (Math.js иногда возвращает Infinity)
            if (/\/0(?!\.)/.test(parseExpr)) {
                throw new Error("Деление на ноль");
            }

            // Вычисляем выражение
            let result = math.evaluate(parseExpr);

            if (!isFinite(result) || isNaN(result)) {
                throw new Error("Некорректный результат");
            }

            display.value = formatNumber(result);
            updateHistory(expression, display.value);
        }
    } catch (error) {
        let errorMsg = error.message;
        if (errorMsg.includes("Unexpected end of expression") || errorMsg.includes("SyntaxError")) {
            errorMsg = "Синтаксическая ошибка";
        }
        updateHistory(expression, 'Ошибка: ' + errorMsg);
        display.value = "Ошибка";
        setTimeout(() => {
            if (display.value === "Ошибка") {
                display.value = expression;
            }
        }, 1500);
    }
}

// Обновление истории
function updateHistory(expression, result) {
    const historyDiv = document.getElementById('history');
    history.push({ expr: expression, res: result });
    historyDiv.innerHTML = history.map(item => 
        `<div><span class="expression">${item.expr}</span><span class="equals">=</span><span class="result">${item.res}</span></div>`
    ).join('');
}

// Переключение темы
function toggleThemeSpecific() {
    let calc = document.querySelector('.calculator');
    let displayInput = document.getElementById('display');
    let buttons = document.querySelectorAll('button');
    let navLinks = document.querySelectorAll('.nav-link');

    calc.classList.toggle('light');
    displayInput.classList.toggle('light');
    buttons.forEach(button => button.classList.toggle('light'));
    navLinks.forEach(link => link.classList.toggle('light'));
}

function toggleThemeWrapper() {
    toggleTheme(toggleThemeSpecific);
}
// Override window.toggleTheme for inline onclick attribute
window.toggleTheme = toggleThemeWrapper;

// Показ панели
function showPanel(panel) {
    let panels = document.querySelectorAll('.panel');
    let tabButtons = document.querySelectorAll('.tab-button');

    panels.forEach(p => p.style.display = 'none');
    tabButtons.forEach(tb => tb.classList.remove('active'));

    if (panel === 'basic') {
        document.querySelector('.basic-panel').style.display = 'grid';
        document.querySelector('.tab-button[onclick*="basic"]').classList.add('active');
    } else if (panel === 'functions') {
        document.querySelector('.functions-panel').style.display = 'grid';
        document.querySelector('.tab-button[onclick*="functions"]').classList.add('active');
    }
}

// Перемещение курсора
function moveCursor(direction) {
    const input = display;
    const cursorPos = input.selectionStart || 0;

    if (direction === 'left' && cursorPos > 0) {
        input.setSelectionRange(cursorPos - 1, cursorPos - 1);
    } else if (direction === 'right' && cursorPos < input.value.length) {
        input.setSelectionRange(cursorPos + 1, cursorPos + 1);
    }
    input.focus();
}

// Обработка клавиш
display.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        calculate('=');
    } else if (event.key === 'Backspace') {
        // backspace natively handled if we don't preventDefault
        return;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        return;
    } else if (event.key.length === 1 && !/[0-9+\-*/.()πie%!]/.test(event.key)) {
        event.preventDefault();
    }
});

// Защита от вставки некорректного текста
display.addEventListener('paste', (event) => {
    event.preventDefault();
    let paste = (event.clipboardData || window.clipboardData).getData('text');
    let filtered = paste.replace(/[^0-9+\-*/.()πie%! ]/g, '');
    append(filtered);
});

// Easter Egg functionality
function createEasterEgg() {
    // Create easter egg button
    const easterEggBtn = document.createElement('button');
    easterEggBtn.className = 'easter-egg';
    easterEggBtn.innerHTML = '🐱';
    easterEggBtn.title = 'Easter Egg';
    document.body.appendChild(easterEggBtn);

    // Create easter egg content
    const easterEggContent = document.createElement('div');
    easterEggContent.className = 'easter-egg-content';
    easterEggContent.innerHTML = `
        <div class="error">404</div>
        <div class="img">
            <img src="cat.png" alt="cat">
            <h1 class="okak">ОКАК</h1>
        </div>
    `;
    document.body.appendChild(easterEggContent);

    // Add click event to show/hide easter egg
    easterEggBtn.addEventListener('click', () => {
        easterEggContent.style.display = 'block';
        setTimeout(() => {
            easterEggContent.style.display = 'none';
        }, 5000); // Hide after 5 seconds
    });
}

// Модифицируем функцию window.onload
window.onload = function() {
    // Запускаем анимацию загрузки
    updateLoadingText(0);

    // Имитируем загрузку
    setTimeout(() => {
        hidePreloader();

        // Инициализируем калькулятор
        showPanel('basic');
        calculator.style.width = `${DEFAULT_WIDTH}px`;
        calculator.style.height = `${DEFAULT_HEIGHT}px`;

        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            toggleThemeWrapper();
            document.querySelector('.switch input').checked = true;
        }

        setupWindowDraggable(
            calculator,
            calculator.querySelector('.calculator-header'),
            resizeHandle,
            DEFAULT_WIDTH,
            DEFAULT_HEIGHT
        );
    }, 2000); // Показываем прелоадер 2 секунды
};

// Initialize easter egg
window.addEventListener('load', createEasterEgg);