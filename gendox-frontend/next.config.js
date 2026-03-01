const path = require('path')

module.exports = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: false,
  images: { unoptimized: true },
  webpack: config => {
    config.resolve.alias = {
      ...config.resolve.alias,
      apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision'),
      '@': path.resolve(__dirname, './src'),
    }

    return config
  }
}
