const path = require("path")
const pkg = require("./package.json")

module.exports = {
  mode: "development",
  cache: false,
  devServer: {
    contentBase: path.resolve(__dirname, "dist"),
    compress: true
  },
  entry: "./index.js",
  output: {
    library: "swtc_transaction",
    path: path.resolve(__dirname, "dist"),
    filename: ["swtc-transaction-", ".js"].join(pkg.version)
  }
}
