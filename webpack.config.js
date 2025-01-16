const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: path.resolve(__dirname, 'src/extension.ts'),
    output: {
        filename: 'extension.js',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                // Copy a single file
                { from: "src/manifest.json", to: "manifest.json" },
                { from: "src/styles.css", to: "styles.css" },
                { from: "src/*.png", to: "[name][ext]" },
            ],
        }),
    ],
};