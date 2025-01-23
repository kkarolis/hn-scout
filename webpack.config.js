const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const { version } = require('./package.json');

module.exports = {
    mode: 'development',
    entry: {
        extension: './src/extension.ts',
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true, // Cleans the dist folder before each build
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: 'src/manifest.json',
                    to: 'manifest.json',
                    transform(content) {
                        const manifest = JSON.parse(content.toString());
                        manifest.version = version;
                        return JSON.stringify(manifest, null, 2);
                    },
                },
                { from: 'src/styles.css', to: 'styles.css' },
                { from: 'src/icons', to: 'icons' },
            ],
        }),
        new ZipPlugin({
            path: path.resolve(__dirname, 'releases'),
            filename: `hn-scout-v${version}.zip`,
            extension: 'zip',
        })
    ],
};