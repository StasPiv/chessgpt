/**
 * Определяет, является ли устройство мобильным
 * @returns {boolean} true если устройство мобильное
 */
export function isMobileDevice() {
    // Проверка по User Agent
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    
    // Проверка по размеру экрана
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const isMobileScreen = screenWidth <= 768;
    
    // Проверка на наличие touch events
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Комбинированная проверка
    return mobileRegex.test(userAgent) || (isMobileScreen && hasTouchSupport);
}

/**
 * Добавляет обработчик для отслеживания изменений размера экрана
 * @param {Function} callback - функция, вызываемая при изменении
 * @returns {Function} функция для удаления обработчика
 */
export function addResizeListener(callback) {
    const handleResize = () => {
        callback(isMobileDevice());
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
        window.removeEventListener('resize', handleResize);
    };
}
