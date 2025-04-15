// Универсальная мобильная адаптация для всех калькуляторов и страниц сайта
function isMobileDevice() {
    return window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
}

function adaptForMobile() {
    // Универсально ищем калькулятор или конвертер
    const calculator = document.getElementById('calculator') || document.getElementById('converter');
    const resizeHandle = document.getElementById('resizeHandle') || document.querySelector('.resize-handle');
    const header = calculator ? calculator.querySelector('.calculator-header') || calculator.querySelector('.converter-header') : null;

    if (!calculator) return; // Нет калькулятора — ничего не делаем

    if (isMobileDevice()) {
        calculator.classList.add('mobile-mode');
        if (header) {
            header.style.cursor = 'default';
            header.onmousedown = null;
            header.ondblclick = null;
        }
        if (resizeHandle) resizeHandle.style.display = "none";
        calculator.style.position = 'static';
        calculator.style.transform = 'none';
        calculator.style.width = '100vw';
        calculator.style.height = 'auto';
        calculator.style.minWidth = '0';
        calculator.style.margin = '0';
    } else {
        calculator.classList.remove('mobile-mode');
        if (resizeHandle) resizeHandle.style.display = "";
        // Можно вернуть обработчики, если нужно
    }
}

document.addEventListener("DOMContentLoaded", adaptForMobile);
window.addEventListener("resize", () => setTimeout(adaptForMobile, 200));

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

window.addEventListener("resize", debounce(adaptForMobile, 200));