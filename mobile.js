// mobile.js
// Функция для проверки, является ли устройство мобильным
function isMobileDevice() {
    return window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
}

// Функция для адаптации
function adaptForMobile() {
    const calculator = document.getElementById('calculator');
    const resizeHandle = document.getElementById('resizeHandle');

    if (isMobileDevice()) {
        console.log("Мобильное устройство обнаружено, применяем адаптацию...");
        // Добавляем класс для мобильного режима
        calculator.classList.add('mobile-mode');

        // Отключаем перетаскивание
        calculator.querySelector('.calculator-header').removeEventListener('mousedown', startDragging);
        calculator.querySelector('.calculator-header').removeEventListener('dblclick', resetSize);
        // Отключаем изменение размера
        resizeHandle.removeEventListener('mousedown', startResizing);
        resizeHandle.removeEventListener('dblclick', resetSize);
        resizeHandle.style.display = "none"; // Скрываем ручку изменения размера
    } else {
        console.log("Это не мобильное устройство, применяем стандартные настройки...");
        // Удаляем класс мобильного режима
        calculator.classList.remove('mobile-mode');

        // Включаем перетаскивание и изменение размера для десктопа
        calculator.querySelector('.calculator-header').addEventListener('mousedown', startDragging);
        calculator.querySelector('.calculator-header').addEventListener('dblclick', resetSize);
        resizeHandle.addEventListener('mousedown', startResizing);
        resizeHandle.addEventListener('dblclick', resetSize);
        resizeHandle.style.display = "block";
    }
}

// Вызываем функцию при загрузке страницы
document.addEventListener("DOMContentLoaded", adaptForMobile);

// Вызываем функцию при изменении размера окна с debounce
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

window.addEventListener("resize", debounce(adaptForMobile, 200));