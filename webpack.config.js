const path = require("path");
module.exports = {
  mode: "development",
  entry: {
      dev:"./src/index.ts",
    index: "./src/lib/index.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"), // 打包后的输出目录
    filename: "[name].min.js",
    clean:true,
    library: {
        type: "module"
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  experiments: {
    outputModule: true,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
};
