module.exports = function override(config, env) {
  // Thêm fallback cho các module Node.js core (nếu cần)
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "fs": false,
    "path": require.resolve("path-browserify"),
  };
  
  // Bỏ qua source map cho một số thư viện cụ thể
  config.module.rules.push({
    test: /\.(js|mjs|jsx)$/,
    enforce: 'pre',
    loader: require.resolve('source-map-loader'),
    options: {
      filterSourceMappingUrl: (url, resourcePath) => {
        // Bỏ qua source map cho jpeg-lossless-decoder-js
        if (resourcePath.includes('jpeg-lossless-decoder-js')) {
          return false;
        }
        return true;
      },
    },
  });
  
  return config;
}