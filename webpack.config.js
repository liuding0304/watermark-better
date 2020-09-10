const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

function resolve(p) {
  return path.resolve(__dirname, p);
}


module.exports = {
  mode: 'production',
  entry: resolve('src/index.js'),
  output: {
    filename: 'watermark-better.min.js',
    path: resolve('lib'),
  },
  module: {
    rules: [
      {
        test:/\.js$/,
        use:{
          loader:'babel-loader',
          options:{
            presets:['@babel/preset-env']
          }
        }
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(), // 打包前清理打包目标目录（如dist）
  ],
}
