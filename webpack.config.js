module.exports = {
  mode: 'production',
  entry: './src/js/scripts.js',
  output: {
    filename: 'scripts.js'
  },
  plugins: [],
  module: {
    rules: [
      {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'}
    ]
  }
}