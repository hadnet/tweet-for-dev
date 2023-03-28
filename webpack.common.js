const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  entry: {
    popup: path.resolve('src/pages/Popup/index.tsx'),
    panel: path.resolve('src/pages/Panel/index.tsx'),
    options: path.resolve('src/pages/Options/index.tsx'),
    background: path.resolve('src/pages/Background/index.ts'),
    contentScript: path.resolve('src/pages/Content/index.ts'),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
        type: 'asset/resource'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve('src/static'),
          to: path.resolve('build'),
        }
      ]
    }),
    ...getHtmlPlugins([
      'popup',
      'options',
      'panel',
    ]),
  ],
  output: {
    filename: '[name].js',
    path: path.resolve('build'),
  },
  optimization: {
    splitChunks: {
      chunks(chunk) {
        return chunk.name !== 'contentScript' && chunk.name !== 'background'
      }
    },
  }
}

function getHtmlPlugins(chunks) {
  return chunks.map(chunk => new HtmlPlugin({
    title: `${chunk}`[0].toUpperCase() + `${chunk}`.slice(1),
    filename: `${chunk}.html`,
    chunks: [chunk],
  }))
}
