// vite.config.js
export default {
  // ...other config
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    }
  }
};
