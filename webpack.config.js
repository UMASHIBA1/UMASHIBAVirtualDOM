const path = require("path");
const outputPath = path.resolve(__dirname, "public");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./index.ts",
  output: {
    filename: "bundle.js",
    path: `${outputPath}`,
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  devServer: {
    contentBase: `${outputPath}/`, //エントリーポイントを指定
    open: true, // ブラウザを自動で開くか否か
    hot: true, // 開発中にCSSとかを変更した時、リロードせずに更新するか否か
    watchContentBase: true, // 変更した時自動でリロードされるか否か
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html",
    }),
  ],
};
