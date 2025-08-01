const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');

module.exports = {
  mode: 'development',
  entry: './src/index.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  devServer: {
    static: './dist',
    port: 3000,
    open: true,
    historyApiFallback: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'public/manifest.json'), to: '' },
        { from: path.resolve(__dirname, 'public/service-worker.js'), to: '' },
        { from: path.resolve(__dirname, 'public/images'), to: 'images' },
        { from: path.resolve(__dirname, 'public/favicon.ico'), to: '' },
        { from: path.resolve(__dirname, '_redirects'), to: '' },
      ],
    }),

    new Dotenv({
      path: './.env',
      systemvars: true, // <--- ESTA LÍNEA HACE QUE FUNCIONE EN NETLIFY
    }),
  ],
};
