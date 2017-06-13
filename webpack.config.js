var path = require('path');
var webpack = require('webpack');
var commonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var providePlugin = webpack.ProvidePlugin;

var commonConfig = {
    entry: {
        'app': path.join(__dirname,'./src/client/main.ts'),
        'vendor': path.join(__dirname,'./src/client/vendor.ts'),
    },
    output: {
        filename: '[name].min.js',
        path: path.join(__dirname, 'dist/client')
    },
    resolve: {
        extensions: ['.ts', '.js', '.json']
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'raw-loader'
                    }, 
                    {
                        loader:'sass-loader',
                        options: {
                            outputStyle: 'compressed'
                        }
                    }
                ]
            },
            { 
                test: /\.(html|css)$/, 
                loader: 'raw-loader'
            },
        ]
    },
    plugins: [
        new providePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.$': 'jquery',
            'window.jQuery': 'jquery',
            'window.jquery': 'jquery',
            Tether: 'tether',
            'window.Tether': 'tether',
        }),
        new commonsChunkPlugin({
            name: 'common',
            minChunks: 2
        })
    ]
};

module.exports = commonConfig;
