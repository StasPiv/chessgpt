/**
 * Менеджер полноэкранного режима
 */
class FullscreenManager {
    constructor() {
        this.listeners = [];
        this.isSupported = this.checkSupport();
        this.addEventListeners();
    }

    checkSupport() {
        const element = document.documentElement;
        return !!(
            element.requestFullscreen ||
            element.webkitRequestFullscreen ||
            element.mozRequestFullScreen ||
            element.msRequestFullscreen
        );
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    isInFullscreen() {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
    }

    async requestFullscreen() {
        try {
            if (!this.isSupported) {
                return this.mobileFullscreenFallback();
            }

            if (this.isInFullscreen()) {
                return true;
            }

            const element = document.documentElement;

            // Специальная обработка для iOS Safari
            if (this.isIOS()) {
                return await this.requestFullscreenIOS();
            }

            // Стандартный подход для других браузеров
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                await element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                await element.msRequestFullscreen();
            }

            // Даем время браузеру обработать запрос
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return this.isInFullscreen();

        } catch (error) {
            // Fallback для мобильных устройств
            return this.mobileFullscreenFallback();
        }
    }

    async requestFullscreenIOS() {
        const element = document.documentElement;
        
        try {
            if (element.webkitRequestFullscreen) {
                await element.webkitRequestFullscreen();
                return true;
            } else {
                return this.iOSFullscreenFallback();
            }
        } catch (error) {
            return this.iOSFullscreenFallback();
        }
    }

    iOSFullscreenFallback() {
        // Скрываем адресную строку
        window.scrollTo(0, 1);
        
        // Устанавливаем мета-тег для максимального использования экрана
        let viewport = document.querySelector('meta[name=viewport]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        
        // Добавляем CSS класс для полноэкранного стиля
        document.body.classList.add('ios-fullscreen-fallback');
        
        return true;
    }

    mobileFullscreenFallback() {
        try {
            // Скрываем адресную строку
            window.scrollTo(0, 1);
            
            // Добавляем CSS класс
            document.body.classList.add('mobile-fullscreen-fallback');
            
            // Пытаемся максимизировать viewport
            const viewport = document.querySelector('meta[name=viewport]');
            if (viewport) {
                const currentContent = viewport.getAttribute('content');
                viewport.setAttribute('content', currentContent + ', viewport-fit=cover');
            }
            
            return true;
            
        } catch (error) {
            return false;
        }
    }

    async exitFullscreen() {
        try {
            if (!this.isInFullscreen()) {
                return true;
            }

            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                await document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                await document.msExitFullscreen();
            }

            // Убираем fallback классы
            document.body.classList.remove('mobile-fullscreen-fallback', 'ios-fullscreen-fallback');

            return true;

        } catch (error) {
            return false;
        }
    }

    addEventListeners() {
        const events = [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange'
        ];

        const handler = () => {
            const isFullscreen = this.isInFullscreen();
            this.notifyListeners(isFullscreen);
        };

        events.forEach(event => {
            document.addEventListener(event, handler);
        });

        // Дополнительно отслеживаем изменения размера окна
        window.addEventListener('resize', () => {
            setTimeout(() => {
                const isFullscreen = this.isInFullscreen();
                this.notifyListeners(isFullscreen);
            }, 100);
        });
    }

    addListener(callback) {
        this.listeners.push(callback);
        
        // Возвращаем функцию для удаления слушателя
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    notifyListeners(isFullscreen) {
        this.listeners.forEach(callback => {
            try {
                callback(isFullscreen);
            } catch (error) {
                // Тихо игнорируем ошибки в слушателях
                console.error('Fullscreen listener error:', error);
            }
        });
    }
}

// Создаем глобальный экземпляр
const fullscreenManager = new FullscreenManager();

export default fullscreenManager;