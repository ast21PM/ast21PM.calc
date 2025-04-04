
function isMobileDevice() {
    return window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
}


function adaptForMobile() {
    const calculator = document.getElementById('calculator');
    const resizeHandle = document.getElementById('resizeHandle');

    if (isMobileDevice()) {
        console.log("Мобильное устройство обнаружено, применяем адаптацию...");

        calculator.classList.add('mobile-mode');


        calculator.querySelector('.calculator-header').removeEventListener('mousedown', startDragging);
        calculator.querySelector('.calculator-header').removeEventListener('dblclick', resetSize);

        resizeHandle.removeEventListener('mousedown', startResizing);
        resizeHandle.removeEventListener('dblclick', resetSize);
        resizeHandle.style.display = "none"; 
    } else {
        console.log("Это не мобильное устройство, применяем стандартные настройки...");

        calculator.classList.remove('mobile-mode');


        calculator.querySelector('.calculator-header').addEventListener('mousedown', startDragging);
        calculator.querySelector('.calculator-header').addEventListener('dblclick', resetSize);
        resizeHandle.addEventListener('mousedown', startResizing);
        resizeHandle.addEventListener('dblclick', resetSize);
        resizeHandle.style.display = "block";
    }
}


document.addEventListener("DOMContentLoaded", adaptForMobile);


function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

window.addEventListener("resize", debounce(adaptForMobile, 200));