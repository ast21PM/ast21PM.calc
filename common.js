// common.js

// Функции для прелоадера
const loadingTexts = [
    'Инициализация...',
    'Загрузка модулей...',
    'Настройка интерфейса...',
    'Почти готово...'
];

function updateLoadingText(index) {
    if (index >= loadingTexts.length) return;

    const detail = document.querySelector('.loading-details .detail');
    if (!detail) return;

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
    if (!preloader) return;
    preloader.classList.add('fade-out');
    setTimeout(() => {
        preloader.style.display = 'none';
    }, 500);
}

// Переключение темы (общая логика)
function toggleTheme(specificToggles = () => {}) {
    const body = document.body;
    body.classList.toggle('light');

    // Вызываем специфичные для страницы переключения (передаем в callback)
    if (typeof specificToggles === 'function') {
        specificToggles();
    }

    const isLightTheme = body.classList.contains('light');
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
}

// Универсальная настройка Drag & Drop и Resize для калькулятора
function setupWindowDraggable(calculatorEl, headerEl, resizeHandleEl, defaultWidth, defaultHeight, onResizeCallback = null) {
    if (!calculatorEl) return;

    let isDragging = false;
    let initialX = 0, initialY = 0;
    let xOffset = 0, yOffset = 0;

    if (headerEl) {
        headerEl.addEventListener('mousedown', startDragging);
        headerEl.addEventListener('dblclick', resetSizeAndPosition);
    }
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);

    function startDragging(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        isDragging = true;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            xOffset = e.clientX - initialX;
            yOffset = e.clientY - initialY;
            calculatorEl.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        }
    }

    function stopDragging() {
        isDragging = false;
    }

    let isResizing = false;
    let initialXResize = 0, initialYResize = 0;
    let initialWidth = defaultWidth, initialHeight = defaultHeight;

    if (resizeHandleEl) {
        resizeHandleEl.addEventListener('mousedown', startResizing);
        resizeHandleEl.addEventListener('dblclick', resetSizeAndPosition);
    }
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);

    function startResizing(e) {
        e.preventDefault();
        const rect = calculatorEl.getBoundingClientRect();
        initialWidth = rect.width;
        initialHeight = rect.height;
        initialXResize = e.clientX;
        initialYResize = e.clientY;
        isResizing = true;
    }

    function resize(e) {
        if (isResizing) {
            e.preventDefault();
            const dx = e.clientX - initialXResize;
            const dy = e.clientY - initialYResize;

            const newWidth = Math.max(initialWidth + dx, 300);
            const newHeight = Math.max(initialHeight + dy, 200);

            calculatorEl.style.width = `${newWidth}px`;
            calculatorEl.style.height = `${newHeight}px`;

            if (onResizeCallback) {
                onResizeCallback(newWidth, newHeight);
            }
        }
    }

    function stopResizing() {
        if (isResizing) {
            isResizing = false;
            const rect = calculatorEl.getBoundingClientRect();
            initialWidth = rect.width;
            initialHeight = rect.height;
        }
    }

    function resetSizeAndPosition() {
        calculatorEl.style.width = `${defaultWidth}px`;
        calculatorEl.style.height = `${defaultHeight}px`;
        initialWidth = defaultWidth;
        initialHeight = defaultHeight;
        xOffset = 0;
        yOffset = 0;
        calculatorEl.style.transform = `translate(0px, 0px)`;
        if (typeof window.resetSpecificLayout === 'function') {
             window.resetSpecificLayout();
        }
    }
}
