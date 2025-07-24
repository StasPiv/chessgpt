
const path = require('path');
const webpack = require('webpack');

// Определяем режим сборки
const isProduction = process.env.NODE_ENV === 'production';

console.log('=== Webpack Build Info ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Is Production:', isProduction);

// Загружаем правильные переменные окружения
const dotenv = require('dotenv');

// Сначала загружаем .env файл
const envConfig = dotenv.config({ path: '.env' });
console.log('.env loaded:', envConfig.parsed);

// Если production, то перезаписываем переменными из .env.production
if (isProduction) {
    const prodConfig = dotenv.config({
        path: '.env.production',
        override: true  // Явно указываем override
    });
    console.log('.env.production loaded:', prodConfig.parsed);
}

console.log('Final REACT_APP_WEBSOCKET_URL:', process.env.REACT_APP_WEBSOCKET_URL);
console.log('========================');