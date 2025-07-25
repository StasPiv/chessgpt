
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

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true
    },
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    devServer: {
        static: path.join(__dirname, 'public'),
        compress: true,
        port: 9000,
        headers: {
            'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
        }
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
                'REACT_APP_WEBSOCKET_URL': JSON.stringify(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080')
            }
        })
    ],
    module: {
        rules: [
            {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    }
};