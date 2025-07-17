const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    mode: 'development',
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