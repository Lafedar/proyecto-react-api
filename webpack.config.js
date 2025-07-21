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
    static: {
      directory: path.join(__dirname, 'public'), // Sirve archivos estáticos desde /public
      publicPath: '/',
    },
    port: 3000,
    open: true,
    historyApiFallback: true,
    hot: true, // Opcional: activa Hot Module Replacement
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
      favicon: './public/favicon.ico',
      
    }),
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, '_redirects'), to: '' },
        { from: 'public/favicon.ico', to: 'favicon.ico' },
        { from: "public/apple-touch-icon.png", to: "apple-touch-icon.png" },
      
      ],
    }),

    new Dotenv({
      path: './.env',
      systemvars: true, // <--- ESTA LÍNEA HACE QUE FUNCIONE EN NETLIFY
    }),
  ],
};
