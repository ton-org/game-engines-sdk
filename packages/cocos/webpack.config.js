const path = require('path');
const webpack = require('webpack');
const TypescriptDeclarationPlugin = require('typescript-declaration-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.ts',
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
    extensions: ['.tsx', '.ts', '.js'],
    fallback: {
      buffer: require.resolve('buffer/')
    }
  },
  output: {
    filename: 'index.ts',
    path: path.resolve(__dirname, './dist'),
    libraryTarget: 'module'
  },
  experiments: {
    outputModule: true
  },
  target: ['web', 'browserslist:> 0.5%'],
  externals: [],
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new TypescriptDeclarationPlugin({
      out: 'index.d.ts',
      exclude: /node_modules/
    })
  ]
};
